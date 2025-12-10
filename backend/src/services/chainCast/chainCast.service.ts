import { injectable, inject } from "inversify";
import { TYPES } from "../../core/types/types";
import { CustomError } from "../../utils/customError";
import { StatusCode } from "../../enums/statusCode.enum";
import logger from "../../utils/logger";
import { Types } from "mongoose";
import { IChainCastService } from "../../core/interfaces/services/chainCast/IChainCast.service";
import { IChainCastRepository } from "../../core/interfaces/repositories/chainCast/IChainCast.repository";
import { ICommunityAdminRepository } from "../../core/interfaces/repositories/ICommunityAdminRepository";
import { IUserRepository } from "../../core/interfaces/repositories/IUser.repository";
import CommunityMemberModel from "../../models/communityMember.model";
import { ErrorMessages, SuccessMessages, LoggerMessages } from "../../enums/messages.enum";
import {
  CreateChainCastDto,
  UpdateChainCastDto,
  JoinChainCastDto,
  RequestModerationDto,
  ReviewModerationRequestDto,
  AddReactionDto,
  GetChainCastsQueryDto,
  GetParticipantsQueryDto,
  GetReactionsQueryDto,
  ChainCastResponseDto,
  ChainCastsListResponseDto,
  ChainCastParticipantsListResponseDto,
  ChainCastReactionsListResponseDto,
  ChainCastModerationRequestsListResponseDto,
  ChainCastParticipantResponseDto,
  ChainCastReactionResponseDto,
  ChainCastModerationRequestResponseDto,
  UpdateParticipantDto,
} from "../../dtos/chainCast/ChainCast.dto";

@injectable()
export class ChainCastService implements IChainCastService {
  constructor(
    @inject(TYPES.IChainCastRepository)
    private _chainCastRepository: IChainCastRepository,
    @inject(TYPES.ICommunityAdminRepository)
    private _adminRepository: ICommunityAdminRepository,
    @inject(TYPES.IUserRepository) private _userRepository: IUserRepository
  ) { }

  // Admin ChainCast management
  /**
   * Creates a new ChainCast.
   * @param {string} adminId - Admin ID.
   * @param {CreateChainCastDto} data - ChainCast data.
   * @returns {Promise<ChainCastResponseDto>} Created ChainCast.
   */
  async createChainCast(
    adminId: string,
    data: CreateChainCastDto
  ): Promise<ChainCastResponseDto> {
    try {
      // Verify admin exists and get community
      const admin = await this._adminRepository.findById(adminId);
      if (!admin || !admin.communityId) {
        throw new CustomError(
          ErrorMessages.ADMIN_NOT_FOUND,
          StatusCode.NOT_FOUND
        );
      }

      // Check if there's already an active ChainCast
      const activeChainCast =
        await this._chainCastRepository.findActiveChainCastByCommunity(
          admin.communityId.toString()
        );
      if (activeChainCast) {
        throw new CustomError(
          ErrorMessages.ACTIVE_CHAINCAST_EXISTS,
          StatusCode.BAD_REQUEST
        );
      }

      // Create ChainCast
      const chainCastData = {
        communityId: admin.communityId,
        adminId: admin._id,
        title: data.title,
        description: data.description,
        scheduledStartTime: data.scheduledStartTime
          ? new Date(data.scheduledStartTime)
          : undefined,
        maxParticipants: data.maxParticipants || 50,
        settings: {
          allowReactions: data.settings?.allowReactions ?? true,
          allowChat: data.settings?.allowChat ?? true,
          moderationRequired: data.settings?.moderationRequired ?? true,
          recordSession: data.settings?.recordSession ?? false,
        },
        status: "scheduled" as const,
        streamData: {
          streamKey: this._generateStreamKey(),
          streamUrl: undefined,
          recordingUrl: undefined,
        },
        stats: {
          totalViews: 0,
          peakViewers: 0,
          totalReactions: 0,
          averageWatchTime: 0,
        },
      };

      const chainCast =
        await this._chainCastRepository.createChainCast(chainCastData);

      logger.info(SuccessMessages.CHAINCAST_CREATED, {
        chainCastId: chainCast._id,
        adminId,
        communityId: admin.communityId,
        title: data.title,
      });

      return new ChainCastResponseDto(chainCast, admin, "admin", true, true);
    } catch (error) {
      logger.error(LoggerMessages.CREATE_CHAINCAST_ERROR, error);
      if (error instanceof CustomError) {
        throw error;
      }
      throw new CustomError(
        ErrorMessages.FAILED_CREATE_CHAINCAST,
        StatusCode.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Retrieves ChainCasts for an admin.
   * @param {string} adminId - Admin ID.
   * @param {GetChainCastsQueryDto} query - Query parameters.
   * @returns {Promise<ChainCastsListResponseDto>} List of ChainCasts.
   */
  async getChainCasts(
    adminId: string,
    query: GetChainCastsQueryDto
  ): Promise<ChainCastsListResponseDto> {
    try {
      const admin = await this._adminRepository.findById(adminId);
      if (!admin) {
        throw new CustomError(
          ErrorMessages.ADMIN_NOT_FOUND,
          StatusCode.NOT_FOUND
        );
      }

      const limit = Math.min(query.limit || 10, 50);
      const skip = query.cursor ? await this._getCursorSkip(query.cursor) : 0;

      const { chainCasts, total } =
        await this._chainCastRepository.findChainCastsByAdmin(
          adminId,
          skip,
          limit + 1,
          query.status
        );

      const hasMore = chainCasts.length > limit;
      const chainCastsList = chainCasts.slice(0, limit);
      const nextCursor = hasMore
        ? chainCastsList[chainCastsList.length - 1]._id.toString()
        : undefined;

      // Transform to DTOs
      const chainCastDtos = chainCastsList.map(
        (chainCast) =>
          new ChainCastResponseDto(chainCast, admin, "admin", true, true)
      );

      // Get summary
      const summary = await this._getChainCastsSummary(adminId);

      return new ChainCastsListResponseDto(
        chainCastDtos,
        hasMore,
        total,
        nextCursor,
        summary
      );
    } catch (error) {
      logger.error(LoggerMessages.GET_CHAINCASTS_ERROR, error);
      if (error instanceof CustomError) {
        throw error;
      }
      throw new CustomError(
        ErrorMessages.FAILED_GET_CHAINCASTS,
        StatusCode.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Retrieves a ChainCast by ID.
   * @param {string} chainCastId - ChainCast ID.
   * @param {string} [userId] - User ID.
   * @returns {Promise<ChainCastResponseDto>} ChainCast details.
   */
  async getChainCastById(
    chainCastId: string,
    userId?: string
  ): Promise<ChainCastResponseDto> {
    try {
      const chainCast =
        await this._chainCastRepository.findChainCastById(chainCastId);
      if (!chainCast) {
        throw new CustomError(ErrorMessages.CHAINCAST_NOT_FOUND, StatusCode.NOT_FOUND);
      }

      let userRole: string | undefined;
      let canJoin = false;
      let canModerate = false;

      if (userId) {
        // Check if user is admin
        const adminIdFromCast =
          typeof chainCast.adminId === "object"
            ? chainCast.adminId._id?.toString() || chainCast.adminId.toString()
            : chainCast.adminId;

        const isAdmin = adminIdFromCast === userId;
        if (isAdmin) {
          userRole = "admin";
          canJoin = true;
          canModerate = true;
        } else {
          // Liberal join policy - allow users to join if ChainCast is live
          canJoin = chainCast.status === "live";
          userRole = "viewer";

          // Check if user is already a participant
          const participant =
            await this._chainCastRepository.findParticipantByChainCastAndUser(
              chainCastId,
              userId
            );
          if (participant) {
            userRole = participant.role;
            canModerate = participant.permissions.canModerate;
          }
        }
      }

      return new ChainCastResponseDto(
        chainCast,
        (chainCast as any).adminId,
        userRole,
        canJoin,
        canModerate
      );
    } catch (error) {
      logger.error(LoggerMessages.GET_CHAINCAST_BY_ID_ERROR, error);
      if (error instanceof CustomError) {
        throw error;
      }
      throw new CustomError(
        ErrorMessages.FAILED_GET_CHAINCAST,
        StatusCode.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Updates a ChainCast.
   * @param {string} adminId - Admin ID.
   * @param {string} chainCastId - ChainCast ID.
   * @param {UpdateChainCastDto} data - Update data.
   * @returns {Promise<ChainCastResponseDto>} Updated ChainCast.
   */
  async updateChainCast(
    adminId: string,
    chainCastId: string,
    data: UpdateChainCastDto
  ): Promise<ChainCastResponseDto> {
    try {
      const chainCast =
        await this._chainCastRepository.findChainCastById(chainCastId);
      if (!chainCast) {
        throw new CustomError(ErrorMessages.CHAINCAST_NOT_FOUND, StatusCode.NOT_FOUND);
      }

      // Verify ownership
      const adminIdFromCast =
        typeof chainCast.adminId === "object"
          ? chainCast.adminId._id?.toString() || chainCast.adminId.toString()
          : chainCast.adminId;

      if (adminIdFromCast !== adminId) {
        throw new CustomError(
          ErrorMessages.UNAUTHORIZED_CHAINCAST_ACTION,
          StatusCode.FORBIDDEN
        );
      }

      // Don't allow updates to live or ended ChainCasts
      if (chainCast.status === "live" || chainCast.status === "ended") {
        throw new CustomError(
          ErrorMessages.CHAINCAST_LIVE_OR_ENDED,
          StatusCode.BAD_REQUEST
        );
      }

      const updateData = {
        title: data.title,
        description: data.description,
        scheduledStartTime: data.scheduledStartTime
          ? new Date(data.scheduledStartTime)
          : undefined,
        maxParticipants: data.maxParticipants,
        settings: data.settings,
      };

      const updatedChainCast = await this._chainCastRepository.updateChainCast(
        chainCastId,
        updateData as any
      );
      if (!updatedChainCast) {
        throw new CustomError(
          ErrorMessages.FAILED_UPDATE_CHAINCAST,
          StatusCode.INTERNAL_SERVER_ERROR
        );
      }

      const admin = await this._adminRepository.findById(adminId);
      return new ChainCastResponseDto(
        updatedChainCast,
        admin,
        "admin",
        true,
        true
      );
    } catch (error) {
      logger.error(LoggerMessages.UPDATE_CHAINCAST_ERROR, error);
      if (error instanceof CustomError) {
        throw error;
      }
      throw new CustomError(
        ErrorMessages.FAILED_UPDATE_CHAINCAST,
        StatusCode.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Deletes a ChainCast.
   * @param {string} adminId - Admin ID.
   * @param {string} chainCastId - ChainCast ID.
   * @returns {Promise<{ success: boolean; message: string }>} Result.
   */
  async deleteChainCast(
    adminId: string,
    chainCastId: string
  ): Promise<{ success: boolean; message: string }> {
    try {
      const chainCast =
        await this._chainCastRepository.findChainCastById(chainCastId);
      if (!chainCast) {
        throw new CustomError(ErrorMessages.CHAINCAST_NOT_FOUND, StatusCode.NOT_FOUND);
      }

      // Verify ownership
      const adminIdFromCast =
        typeof chainCast.adminId === "object"
          ? chainCast.adminId._id?.toString() || chainCast.adminId.toString()
          : chainCast.adminId;

      if (adminIdFromCast !== adminId) {
        throw new CustomError(
          ErrorMessages.UNAUTHORIZED_CHAINCAST_ACTION,
          StatusCode.FORBIDDEN
        );
      }

      // Don't allow deletion of live ChainCasts
      if (chainCast.status === "live") {
        throw new CustomError(
          ErrorMessages.CHAINCAST_LIVE_DELETE_ERROR,
          StatusCode.BAD_REQUEST
        );
      }

      const success =
        await this._chainCastRepository.deleteChainCast(chainCastId);
      if (!success) {
        throw new CustomError(
          ErrorMessages.FAILED_DELETE_CHAINCAST,
          StatusCode.INTERNAL_SERVER_ERROR
        );
      }

      return {
        success: true,
        message: SuccessMessages.CHAINCAST_DELETED,
      };
    } catch (error) {
      logger.error(LoggerMessages.DELETE_CHAINCAST_ERROR, error);
      if (error instanceof CustomError) {
        throw error;
      }
      throw new CustomError(
        ErrorMessages.FAILED_DELETE_CHAINCAST,
        StatusCode.INTERNAL_SERVER_ERROR
      );
    }
  }

  // ChainCast control
  /**
   * Starts a ChainCast.
   * @param {string} adminId - Admin ID.
   * @param {string} chainCastId - ChainCast ID.
   * @returns {Promise<ChainCastResponseDto>} Started ChainCast.
   */
  async startChainCast(
    adminId: string,
    chainCastId: string
  ): Promise<ChainCastResponseDto> {
    try {
      const chainCast =
        await this._chainCastRepository.findChainCastById(chainCastId);
      if (!chainCast) {
        throw new CustomError(ErrorMessages.CHAINCAST_NOT_FOUND, StatusCode.NOT_FOUND);
      }

      const adminIdFromCast =
        typeof chainCast.adminId === "object"
          ? chainCast.adminId._id?.toString() || chainCast.adminId.toString()
          : chainCast.adminId;

      // Verify ownership
      if (adminIdFromCast !== adminId) {
        throw new CustomError(
          ErrorMessages.UNAUTHORIZED_CHAINCAST_ACTION,
          StatusCode.FORBIDDEN
        );
      }

      if (chainCast.status !== "scheduled") {
        throw new CustomError(
          ErrorMessages.CHAINCAST_NOT_SCHEDULED,
          StatusCode.BAD_REQUEST
        );
      }

      // Update to live status
      const updateData = {
        status: "live" as const,
        actualStartTime: new Date(),
        streamData: {
          ...chainCast.streamData,
          streamUrl: this._generateStreamUrl(chainCast.streamData.streamKey!),
        },
      };

      const updatedChainCast = await this._chainCastRepository.updateChainCast(
        chainCastId,
        updateData
      );
      if (!updatedChainCast) {
        throw new CustomError(
          ErrorMessages.FAILED_START_CHAINCAST,
          StatusCode.INTERNAL_SERVER_ERROR
        );
      }

      // Create admin as participant
      await this._createAdminParticipant(chainCastId, adminId);

      const admin = await this._adminRepository.findById(adminId);
      return new ChainCastResponseDto(
        updatedChainCast,
        admin,
        "admin",
        true,
        true
      );
    } catch (error) {
      logger.error(LoggerMessages.START_CHAINCAST_ERROR, error);
      if (error instanceof CustomError) {
        throw error;
      }
      throw new CustomError(
        ErrorMessages.FAILED_START_CHAINCAST,
        StatusCode.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Ends a ChainCast.
   * @param {string} adminId - Admin ID.
   * @param {string} chainCastId - ChainCast ID.
   * @returns {Promise<ChainCastResponseDto>} Ended ChainCast.
   */
  async endChainCast(
    adminId: string,
    chainCastId: string
  ): Promise<ChainCastResponseDto> {
    try {
      const chainCast =
        await this._chainCastRepository.findChainCastById(chainCastId);
      if (!chainCast) {
        throw new CustomError(ErrorMessages.CHAINCAST_NOT_FOUND, StatusCode.NOT_FOUND);
      }

      const adminIdFromCast =
        typeof chainCast.adminId === "object"
          ? chainCast.adminId._id?.toString() || chainCast.adminId.toString()
          : chainCast.adminId;

      // Verify ownership
      if (adminIdFromCast !== adminId) {
        throw new CustomError(
          ErrorMessages.UNAUTHORIZED_CHAINCAST_ACTION,
          StatusCode.FORBIDDEN
        );
      }

      if (chainCast.status !== "live") {
        throw new CustomError(
          ErrorMessages.CHAINCAST_NOT_LIVE_END_ERROR,
          StatusCode.BAD_REQUEST
        );
      }

      // Update to ended status
      const updateData = {
        status: "ended" as const,
        endTime: new Date(),
        currentParticipants: 0,
      };

      const updatedChainCast = await this._chainCastRepository.updateChainCast(
        chainCastId,
        updateData
      );
      if (!updatedChainCast) {
        throw new CustomError(
          ErrorMessages.FAILED_END_CHAINCAST,
          StatusCode.INTERNAL_SERVER_ERROR
        );
      }

      // End all participant sessions
      await this._endAllParticipantSessions(chainCastId);

      const admin = await this._adminRepository.findById(adminId);
      return new ChainCastResponseDto(
        updatedChainCast,
        admin,
        "admin",
        true,
        true
      );
    } catch (error) {
      logger.error(LoggerMessages.END_CHAINCAST_ERROR, error);
      if (error instanceof CustomError) {
        throw error;
      }
      throw new CustomError(
        ErrorMessages.FAILED_END_CHAINCAST,
        StatusCode.INTERNAL_SERVER_ERROR
      );
    }
  }

  // User ChainCast participation
  /**
   * Retrieves ChainCasts for a community.
   * @param {string} communityId - Community ID.
   * @param {string} userId - User ID.
   * @param {GetChainCastsQueryDto} query - Query parameters.
   * @returns {Promise<ChainCastsListResponseDto>} List of ChainCasts.
   */
  async getCommunityChainCasts(
    communityId: string,
    userId: string,
    query: GetChainCastsQueryDto
  ): Promise<ChainCastsListResponseDto> {
    try {
      const limit = Math.min(query.limit || 10, 50);
      const skip = query.cursor ? await this._getCursorSkip(query.cursor) : 0;

      const { chainCasts, total } =
        await this._chainCastRepository.findChainCastsByCommunity(
          communityId,
          skip,
          limit + 1,
          query.status
        );

      const hasMore = chainCasts.length > limit;
      const chainCastsList = chainCasts.slice(0, limit);
      const nextCursor = hasMore
        ? chainCastsList[chainCastsList.length - 1]._id.toString()
        : undefined;

      // Transform to DTOs with user permissions
      const chainCastDtos = await Promise.all(
        chainCastsList.map(async (chainCast) => {
          const participant =
            await this._chainCastRepository.findParticipantByChainCastAndUser(
              chainCast._id.toString(),
              userId
            );

          const canJoin = chainCast.status === "live";
          const canModerate = participant?.permissions.canModerate || false;
          const userRole = participant?.role || "viewer";

          return new ChainCastResponseDto(
            chainCast,
            (chainCast as any).adminId,
            userRole,
            canJoin,
            canModerate
          );
        })
      );

      return new ChainCastsListResponseDto(
        chainCastDtos,
        hasMore,
        total,
        nextCursor
      );
    } catch (error) {
      logger.error(LoggerMessages.GET_COMMUNITY_CHAINCASTS_ERROR, error);
      if (error instanceof CustomError) {
        throw error;
      }
      throw new CustomError(
        ErrorMessages.FAILED_GET_COMMUNITY_CHAINCASTS,
        StatusCode.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Joins a ChainCast.
   * @param {string} userId - User ID.
   * @param {JoinChainCastDto} data - Join data.
   * @returns {Promise<{ success: boolean; message: string; streamUrl?: string }>} Join result.
   */
  async joinChainCast(
    userId: string,
    data: JoinChainCastDto
  ): Promise<{ success: boolean; message: string; streamUrl?: string }> {
    try {
      const chainCast = await this._chainCastRepository.findChainCastById(
        data.chainCastId
      );
      if (!chainCast) {
        throw new CustomError(ErrorMessages.CHAINCAST_NOT_FOUND, StatusCode.NOT_FOUND);
      }

      if (chainCast.status !== "live") {
        throw new CustomError(
          ErrorMessages.CHAINCAST_NOT_LIVE,
          StatusCode.BAD_REQUEST
        );
      }

      // Check participant limit
      const currentCount =
        await this._chainCastRepository.getActiveParticipantsCount(
          data.chainCastId
        );
      if (currentCount >= chainCast.maxParticipants) {
        throw new CustomError(
          ErrorMessages.CHAINCAST_FULL,
          StatusCode.BAD_REQUEST
        );
      }

      // Check if user is already a participant
      let existingParticipant =
        await this._chainCastRepository.findParticipantByChainCastAndUser(
          data.chainCastId,
          userId
        );

      if (existingParticipant && existingParticipant.isActive) {
        return {
          success: true,
          message: ErrorMessages.ALREADY_PARTICIPANT,
          streamUrl: chainCast.streamData.streamUrl,
        };
      }

      // Create or reactivate participant
      if (existingParticipant) {
        await this._chainCastRepository.updateParticipant(
          data.chainCastId,
          userId,
          {
            isActive: true,
            joinedAt: new Date(),
            leftAt: undefined,
            connectionInfo: {
              quality: data.quality || "medium",
            },
          }
        );
      } else {
        await this._chainCastRepository.createParticipant({
          chainCastId: chainCast._id,
          userId: new Types.ObjectId(userId),
          role: "viewer",
          permissions: {
            canStream: false,
            canModerate: false,
            canReact: chainCast.settings.allowReactions,
            canChat: chainCast.settings.allowChat,
          },
          streamData: {
            hasVideo: false,
            hasAudio: false,
            isMuted: false,
            isVideoOff: true,
          },
          connectionInfo: {
            quality: data.quality || "medium",
          },
        });
      }

      // Update ChainCast participant count
      const newCount =
        await this._chainCastRepository.getActiveParticipantsCount(
          data.chainCastId
        );
      await this._chainCastRepository.updateChainCast(data.chainCastId, {
        currentParticipants: newCount,
        "stats.peakViewers": Math.max(chainCast.stats.peakViewers, newCount),
        "stats.totalViews": chainCast.stats.totalViews + 1,
      } as any);

      return {
        success: true,
        message: SuccessMessages.JOIN_CHAINCAST_SUCCESS,
        streamUrl: chainCast.streamData.streamUrl,
      };
    } catch (error) {
      logger.error(LoggerMessages.JOIN_CHAINCAST_ERROR, error);
      if (error instanceof CustomError) {
        throw error;
      }
      throw new CustomError(
        ErrorMessages.FAILED_JOIN_CHAINCAST,
        StatusCode.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Leaves a ChainCast.
   * @param {string} userId - User ID.
   * @param {string} chainCastId - ChainCast ID.
   * @returns {Promise<{ success: boolean; message: string }>} Result.
   */
  async leaveChainCast(
    userId: string,
    chainCastId: string
  ): Promise<{ success: boolean; message: string }> {
    try {
      const participant =
        await this._chainCastRepository.findParticipantByChainCastAndUser(
          chainCastId,
          userId
        );

      if (!participant || !participant.isActive) {
        return {
          success: true,
          message: ErrorMessages.NOT_PARTICIPANT,
        };
      }

      // Mark participant as inactive instead of removing
      await this._chainCastRepository.updateParticipant(chainCastId, userId, {
        isActive: false,
        leftAt: new Date(),
      });

      // Update participant count
      const newCount =
        await this._chainCastRepository.getActiveParticipantsCount(chainCastId);
      await this._chainCastRepository.updateChainCast(chainCastId, {
        currentParticipants: newCount,
      });

      return {
        success: true,
        message: SuccessMessages.LEAVE_CHAINCAST_SUCCESS,
      };
    } catch (error) {
      logger.error(LoggerMessages.LEAVE_CHAINCAST_ERROR, error);
      if (error instanceof CustomError) {
        throw error;
      }
      throw new CustomError(
        ErrorMessages.FAILED_LEAVE_CHAINCAST,
        StatusCode.INTERNAL_SERVER_ERROR
      );
    }
  }

  // Participant management
  /**
   * Retrieves participants of a ChainCast.
   * @param {string} chainCastId - ChainCast ID.
   * @param {GetParticipantsQueryDto} query - Query parameters.
   * @returns {Promise<ChainCastParticipantsListResponseDto>} List of participants.
   */
  async getParticipants(
    chainCastId: string,
    query: GetParticipantsQueryDto
  ): Promise<ChainCastParticipantsListResponseDto> {
    try {
      const chainCast =
        await this._chainCastRepository.findChainCastById(chainCastId);
      if (!chainCast) {
        throw new CustomError(ErrorMessages.CHAINCAST_NOT_FOUND, StatusCode.NOT_FOUND);
      }

      const limit = Math.min(query.limit || 20, 100);
      const skip = query.cursor ? await this._getCursorSkip(query.cursor) : 0;

      const { participants, total } =
        await this._chainCastRepository.findParticipantsByChainCast(
          chainCastId,
          skip,
          limit + 1,
          query.filter
        );

      const hasMore = participants.length > limit;
      const participantsList = participants.slice(0, limit);
      const nextCursor = hasMore
        ? participantsList[participantsList.length - 1]._id.toString()
        : undefined;

      // Transform to DTOs
      const participantDtos = participantsList.map(
        (participant) =>
          new ChainCastParticipantResponseDto(
            participant,
            (participant as any).userId
          )
      );

      // Get counts
      const activeCount =
        await this._chainCastRepository.getActiveParticipantsCount(chainCastId);
      const moderatorCount =
        await this._chainCastRepository.getModeratorsCount(chainCastId);

      return new ChainCastParticipantsListResponseDto(
        participantDtos,
        hasMore,
        total,
        activeCount,
        moderatorCount,
        nextCursor
      );
    } catch (error) {
      logger.error(LoggerMessages.GET_PARTICIPANTS_ERROR, error);
      if (error instanceof CustomError) {
        throw error;
      }
      throw new CustomError(
        ErrorMessages.FAILED_GET_PARTICIPANTS,
        StatusCode.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Updates a participant's settings.
   * @param {string} chainCastId - ChainCast ID.
   * @param {string} userId - User ID.
   * @param {UpdateParticipantDto} data - Update data.
   * @returns {Promise<{ success: boolean; message: string }>} Result.
   */
  async updateParticipant(
    chainCastId: string,
    userId: string,
    data: UpdateParticipantDto
  ): Promise<{ success: boolean; message: string }> {
    try {
      const participant =
        await this._chainCastRepository.findParticipantByChainCastAndUser(
          chainCastId,
          userId
        );

      if (!participant || !participant.isActive) {
        throw new CustomError(
          ErrorMessages.NOT_PARTICIPANT,
          StatusCode.FORBIDDEN
        );
      }

      const updateData = {
        streamData: {
          ...participant.streamData,
          ...data,
        },
      };

      await this._chainCastRepository.updateParticipant(
        chainCastId,
        userId,
        updateData
      );

      return {
        success: true,
        message: SuccessMessages.PARTICIPANT_UPDATED,
      };
    } catch (error) {
      logger.error(LoggerMessages.UPDATE_PARTICIPANT_ERROR, error);
      if (error instanceof CustomError) {
        throw error;
      }
      throw new CustomError(
        ErrorMessages.FAILED_UPDATE_PARTICIPANT,
        StatusCode.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Removes a participant from a ChainCast.
   * @param {string} adminId - Admin ID.
   * @param {string} chainCastId - ChainCast ID.
   * @param {string} participantId - Participant ID.
   * @param {string} [reason] - Reason for removal.
   * @returns {Promise<{ success: boolean; message: string }>} Result.
   */
  async removeParticipant(
    adminId: string,
    chainCastId: string,
    participantId: string,
    reason?: string
  ): Promise<{ success: boolean; message: string }> {
    try {
      const chainCast =
        await this._chainCastRepository.findChainCastById(chainCastId);
      if (!chainCast) {
        throw new CustomError(ErrorMessages.CHAINCAST_NOT_FOUND, StatusCode.NOT_FOUND);
      }

      // Verify ownership
      const adminIdFromCast =
        typeof chainCast.adminId === "object"
          ? chainCast.adminId._id?.toString() || chainCast.adminId.toString()
          : chainCast.adminId;

      if (adminIdFromCast !== adminId) {
        throw new CustomError(
          ErrorMessages.UNAUTHORIZED_CHAINCAST_ACTION,
          StatusCode.FORBIDDEN
        );
      }

      const participant =
        await this._chainCastRepository.findParticipantByChainCastAndUser(
          chainCastId,
          participantId
        );

      if (!participant || !participant.isActive) {
        throw new CustomError(ErrorMessages.PARTICIPANT_NOT_FOUND, StatusCode.NOT_FOUND);
      }

      // Cannot remove other admins
      if (participant.role === "admin") {
        throw new CustomError(
          ErrorMessages.CANNOT_REMOVE_ADMIN,
          StatusCode.FORBIDDEN
        );
      }

      await this._chainCastRepository.removeParticipant(
        chainCastId,
        participantId
      );

      // Update participant count
      const newCount =
        await this._chainCastRepository.getActiveParticipantsCount(chainCastId);
      await this._chainCastRepository.updateChainCast(chainCastId, {
        currentParticipants: newCount,
      });

      return {
        success: true,
        message: SuccessMessages.PARTICIPANT_REMOVED,
      };
    } catch (error) {
      logger.error(LoggerMessages.REMOVE_PARTICIPANT_ERROR, error);
      if (error instanceof CustomError) {
        throw error;
      }
      throw new CustomError(
        ErrorMessages.FAILED_REMOVE_PARTICIPANT,
        StatusCode.INTERNAL_SERVER_ERROR
      );
    }
  }

  // Moderation
  /**
   * Requests moderation permissions for a participant.
   * @param {string} userId - User ID.
   * @param {RequestModerationDto} data - Request data.
   * @returns {Promise<{ success: boolean; message: string }>} Result.
   */
  async requestModeration(
    userId: string,
    data: RequestModerationDto
  ): Promise<{ success: boolean; message: string }> {
    try {
      const chainCast = await this._chainCastRepository.findChainCastById(
        data.chainCastId
      );
      if (!chainCast) {
        throw new CustomError(ErrorMessages.CHAINCAST_NOT_FOUND, StatusCode.NOT_FOUND);
      }

      if (chainCast.status !== "live") {
        throw new CustomError(
          ErrorMessages.CHAINCAST_NOT_LIVE,
          StatusCode.BAD_REQUEST
        );
      }

      // Check if user is a participant
      const participant =
        await this._chainCastRepository.findParticipantByChainCastAndUser(
          data.chainCastId,
          userId
        );

      if (!participant || !participant.isActive) {
        throw new CustomError(
          ErrorMessages.MODERATION_REQUEST_NOT_PARTICIPANT,
          StatusCode.FORBIDDEN
        );
      }

      if (participant.role !== "viewer") {
        throw new CustomError(
          ErrorMessages.ALREADY_MODERATOR,
          StatusCode.BAD_REQUEST
        );
      }

      // Check for existing pending request
      const existingRequest =
        await this._chainCastRepository.findPendingModerationRequestByUser(
          data.chainCastId,
          userId
        );

      if (existingRequest) {
        throw new CustomError(
          ErrorMessages.PENDING_MOD_REQUEST,
          StatusCode.BAD_REQUEST
        );
      }

      // Create moderation request
      await this._chainCastRepository.createModerationRequest({
        chainCastId: chainCast._id,
        userId: new Types.ObjectId(userId),
        requestedPermissions: data.requestedPermissions,
        message: data.message,
      });

      return {
        success: true,
        message: SuccessMessages.MOD_REQUEST_SUBMITTED,
      };
    } catch (error) {
      logger.error(LoggerMessages.REQUEST_MODERATION_ERROR, error);
      if (error instanceof CustomError) {
        throw error;
      }
      throw new CustomError(
        ErrorMessages.FAILED_REQUEST_MODERATION,
        StatusCode.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Retrieves moderation requests.
   * @param {string} adminId - Admin ID.
   * @param {string} chainCastId - ChainCast ID.
   * @returns {Promise<ChainCastModerationRequestsListResponseDto>} List of requests.
   */
  async getModerationRequests(
    adminId: string,
    chainCastId: string
  ): Promise<ChainCastModerationRequestsListResponseDto> {
    try {
      const chainCast =
        await this._chainCastRepository.findChainCastById(chainCastId);
      if (!chainCast) {
        throw new CustomError(ErrorMessages.CHAINCAST_NOT_FOUND, StatusCode.NOT_FOUND);
      }

      // Verify ownership
      const adminIdFromCast =
        typeof chainCast.adminId === "object"
          ? chainCast.adminId._id?.toString() || chainCast.adminId.toString()
          : chainCast.adminId;

      if (adminIdFromCast !== adminId) {
        throw new CustomError(
          ErrorMessages.UNAUTHORIZED_MODERATION,
          StatusCode.FORBIDDEN
        );
      }

      const { requests, total } =
        await this._chainCastRepository.findModerationRequestsByChainCast(
          chainCastId,
          0,
          100,
          "pending"
        );

      // Transform to DTOs
      const requestDtos = requests.map(
        (request) =>
          new ChainCastModerationRequestResponseDto(
            request,
            (request as any).userId
          )
      );

      const pendingCount =
        await this._chainCastRepository.getPendingModerationRequestsCount(
          chainCastId
        );

      return new ChainCastModerationRequestsListResponseDto(
        requestDtos,
        false,
        total,
        pendingCount
      );
    } catch (error) {
      logger.error(LoggerMessages.GET_MODERATION_REQUESTS_ERROR, error);
      if (error instanceof CustomError) {
        throw error;
      }
      throw new CustomError(
        ErrorMessages.FAILED_GET_MODERATION_REQUESTS,
        StatusCode.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Reviews a moderation request.
   * @param {string} adminId - Admin ID.
   * @param {ReviewModerationRequestDto} data - Review data.
   * @returns {Promise<{ success: boolean; message: string }>} Result.
   */
  async reviewModerationRequest(
    adminId: string,
    data: ReviewModerationRequestDto
  ): Promise<{ success: boolean; message: string }> {
    try {
      const request = await this._chainCastRepository.findModerationRequestById(
        data.requestId
      );
      if (!request) {
        throw new CustomError(
          ErrorMessages.MOD_REQUEST_NOT_FOUND,
          StatusCode.NOT_FOUND
        );
      }

      const chainCast = await this._chainCastRepository.findChainCastById(
        request.chainCastId.toString()
      );
      if (!chainCast) {
        throw new CustomError(ErrorMessages.CHAINCAST_NOT_FOUND, StatusCode.NOT_FOUND);
      }

      // Verify ownership
      const adminIdFromCast =
        typeof chainCast.adminId === "object"
          ? chainCast.adminId._id?.toString() || chainCast.adminId.toString()
          : chainCast.adminId;

      if (adminIdFromCast !== adminId) {
        throw new CustomError(
          ErrorMessages.UNAUTHORIZED_MODERATION,
          StatusCode.FORBIDDEN
        );
      }

      if (request.status !== "pending") {
        throw new CustomError(
          ErrorMessages.MOD_REQUEST_REVIEWED,
          StatusCode.BAD_REQUEST
        );
      }

      // Update request
      await this._chainCastRepository.updateModerationRequest(data.requestId, {
        status: data.status,
        reviewedBy: new Types.ObjectId(adminId),
        reviewedAt: new Date(),
        reviewMessage: data.reviewMessage,
      });

      // If approved, update participant permissions
      if (data.status === "approved") {
        const permissions = {
          canStream:
            request.requestedPermissions.video ||
            request.requestedPermissions.audio,
          canModerate: true,
          canReact: true,
          canChat: true,
        };

        await this._chainCastRepository.updateParticipantRole(
          request.chainCastId.toString(),
          request.userId.toString(),
          "moderator",
          permissions
        );
      }

      return {
        success: true,
        message: `Moderation request ${data.status} successfully`,
      };
    } catch (error) {
      logger.error(LoggerMessages.REVIEW_MODERATION_REQUEST_ERROR, error);
      if (error instanceof CustomError) {
        throw error;
      }
      throw new CustomError(
        ErrorMessages.FAILED_REVIEW_MODERATION,
        StatusCode.INTERNAL_SERVER_ERROR
      );
    }
  }

  // Reactions
  /**
   * Adds a reaction to a ChainCast.
   * @param {string} userId - User ID.
   * @param {AddReactionDto} data - Reaction data.
   * @returns {Promise<{ success: boolean; message: string }>} Result.
   */
  async addReaction(
    userId: string,
    data: AddReactionDto
  ): Promise<{ success: boolean; message: string }> {
    try {
      const chainCast = await this._chainCastRepository.findChainCastById(
        data.chainCastId
      );
      if (!chainCast) {
        throw new CustomError(ErrorMessages.CHAINCAST_NOT_FOUND, StatusCode.NOT_FOUND);
      }

      if (chainCast.status !== "live") {
        throw new CustomError(
          ErrorMessages.CHAINCAST_NOT_LIVE,
          StatusCode.BAD_REQUEST
        );
      }

      if (!chainCast.settings.allowReactions) {
        throw new CustomError(
          ErrorMessages.REACTIONS_DISABLED,
          StatusCode.FORBIDDEN
        );
      }

      // Create reaction
      await this._chainCastRepository.createReaction({
        chainCastId: chainCast._id,
        userId: new Types.ObjectId(userId),
        emoji: data.emoji,
      });

      // Update ChainCast reaction stats
      await this._chainCastRepository.updateChainCastStats(data.chainCastId, {
        totalReactions: 1,
      });

      return {
        success: true,
        message: SuccessMessages.REACTION_ADDED,
      };
    } catch (error) {
      logger.error(LoggerMessages.ADD_REACTION_ERROR, error);
      if (error instanceof CustomError) {
        throw error;
      }
      throw new CustomError(
        ErrorMessages.FAILED_ADD_REACTION,
        StatusCode.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Retrieves reactions for a ChainCast.
   * @param {string} chainCastId - ChainCast ID.
   * @param {GetReactionsQueryDto} query - Query parameters.
   * @returns {Promise<ChainCastReactionsListResponseDto>} List of reactions.
   */
  async getReactions(
    chainCastId: string,
    query: GetReactionsQueryDto
  ): Promise<ChainCastReactionsListResponseDto> {
    try {
      const chainCast =
        await this._chainCastRepository.findChainCastById(chainCastId);
      if (!chainCast) {
        throw new CustomError(ErrorMessages.CHAINCAST_NOT_FOUND, StatusCode.NOT_FOUND);
      }

      const limit = Math.min(query.limit || 50, 100);
      const skip = query.cursor ? await this._getCursorSkip(query.cursor) : 0;

      const [{ reactions, total }, reactionsSummary] = await Promise.all([
        this._chainCastRepository.findReactionsByChainCast(
          chainCastId,
          skip,
          limit + 1
        ),
        this._chainCastRepository.getReactionsSummary(chainCastId),
      ]);

      const hasMore = reactions.length > limit;
      const reactionsList = reactions.slice(0, limit);
      const nextCursor = hasMore
        ? reactionsList[reactionsList.length - 1]._id.toString()
        : undefined;

      // Transform to DTOs
      const reactionDtos = reactionsList.map(
        (reaction) =>
          new ChainCastReactionResponseDto(reaction, (reaction as any).userId)
      );

      return new ChainCastReactionsListResponseDto(
        reactionDtos,
        hasMore,
        total,
        reactionsSummary,
        nextCursor
      );
    } catch (error) {
      logger.error(LoggerMessages.GET_REACTIONS_ERROR, error);
      if (error instanceof CustomError) {
        throw error;
      }
      throw new CustomError(
        ErrorMessages.FAILED_GET_REACTIONS,
        StatusCode.INTERNAL_SERVER_ERROR
      );
    }
  }

  // Analytics
  /**
   * Retrieves analytics for ChainCasts.
   * @param {string} adminId - Admin ID.
   * @param {string} [period] - Time period.
   * @returns {Promise<any>} Analytics data.
   */
  async getChainCastAnalytics(adminId: string, period?: string): Promise<any> {
    try {
      const admin = await this._adminRepository.findById(adminId);
      if (!admin || !admin.communityId) {
        throw new CustomError(
          ErrorMessages.ADMIN_NOT_FOUND,
          StatusCode.NOT_FOUND
        );
      }

      let startDate: Date | undefined;
      let endDate: Date | undefined;

      if (period) {
        const now = new Date();
        switch (period) {
          case "week":
            startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            break;
          case "month":
            startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            break;
          case "year":
            startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
            break;
        }
        endDate = now;
      }

      const analytics = await this._chainCastRepository.getChainCastAnalytics(
        admin.communityId.toString(),
        startDate,
        endDate
      );

      return {
        success: true,
        data: analytics,
      };
    } catch (error) {
      logger.error(LoggerMessages.GET_CHAINCAST_ANALYTICS_ERROR, error);
      if (error instanceof CustomError) {
        throw error;
      }
      throw new CustomError(
        ErrorMessages.FAILED_GET_ANALYTICS,
        StatusCode.INTERNAL_SERVER_ERROR
      );
    }
  }

  // Utility methods
  /**
   * Checks if a user can join a ChainCast.
   * @param {string} userId - User ID.
   * @param {string} chainCastId - ChainCast ID.
   * @returns {Promise<{ canJoin: boolean; reason?: string }>} Check result.
   */
  async canUserJoinChainCast(
    userId: string,
    chainCastId: string
  ): Promise<{ canJoin: boolean; reason?: string }> {
    try {
      const chainCast =
        await this._chainCastRepository.findChainCastById(chainCastId);
      if (!chainCast) {
        return { canJoin: false, reason: "ChainCast not found" };
      }

      if (chainCast.status !== "live") {
        return { canJoin: false, reason: "ChainCast is not live" };
      }

      // Check participant limit
      const currentCount =
        await this._chainCastRepository.getActiveParticipantsCount(chainCastId);
      if (currentCount >= chainCast.maxParticipants) {
        return { canJoin: false, reason: "ChainCast is full" };
      }

      // Liberal join policy - allow users to join
      return { canJoin: true };
    } catch (error) {
      logger.error(LoggerMessages.CAN_USER_JOIN_CHAINCAST_ERROR, error);
      return { canJoin: false, reason: "Error checking permissions" };
    }
  }

  // Private helper methods
  private _generateStreamKey(): string {
    return (
      "sk_" +
      Math.random().toString(36).substring(2, 15) +
      Math.random().toString(36).substring(2, 15)
    );
  }

  private _generateStreamUrl(streamKey: string): string {
    return `https://localhost:3000/live/${streamKey}`;
  }

  private async _getCursorSkip(cursor: string): Promise<number> {
    return 0;
  }

  private async _getChainCastsSummary(adminId: string): Promise<any> {
    return {
      live: 0,
      scheduled: 0,
      ended: 0,
    };
  }

  private async _createAdminParticipant(
    chainCastId: string,
    adminId: string
  ): Promise<void> {
    await this._chainCastRepository.createParticipant({
      chainCastId: new Types.ObjectId(chainCastId),
      userId: new Types.ObjectId(adminId),
      role: "admin",
      permissions: {
        canStream: true,
        canModerate: true,
        canReact: true,
        canChat: true,
      },
      streamData: {
        hasVideo: true,
        hasAudio: true,
        isMuted: false,
        isVideoOff: false,
      },
    });
  }

  private async _endAllParticipantSessions(chainCastId: string): Promise<void> {
    // Mark all participants as inactive
    // This would be done with a bulk update in MongoDB
    // For now, we'll leave this as a placeholder
  }
}