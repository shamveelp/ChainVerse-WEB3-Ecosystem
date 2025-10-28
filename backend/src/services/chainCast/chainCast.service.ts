import { injectable, inject } from "inversify";
import { TYPES } from "../../core/types/types";
import { CustomError } from "../../utils/customError";
import { StatusCode } from "../../enums/statusCode.enum";
import logger from "../../utils/logger";
import { Types } from "mongoose";
import { IChainCastService } from "../../core/interfaces/services/chainCast/IChainCastService";
import { IChainCastRepository } from "../../core/interfaces/repositories/chainCast/IChainCastRepository";
import { ICommunityAdminRepository } from "../../core/interfaces/repositories/ICommunityAdminRepository";
import { IUserRepository } from "../../core/interfaces/repositories/IUserRepository";
import CommunityMemberModel from "../../models/communityMember.model";
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
  ) {}

  // Admin ChainCast management
  async createChainCast(
    adminId: string,
    data: CreateChainCastDto
  ): Promise<ChainCastResponseDto> {
    try {
      // Verify admin exists and get community
      const admin = await this._adminRepository.findById(adminId);
      if (!admin || !admin.communityId) {
        throw new CustomError(
          "Community admin not found or no associated community",
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
          "There is already an active ChainCast in this community",
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

      logger.info("ChainCast created successfully", {
        chainCastId: chainCast._id,
        adminId,
        communityId: admin.communityId,
        title: data.title,
      });

      return new ChainCastResponseDto(chainCast, admin, "admin", false, true);
    } catch (error) {
      logger.error("Create ChainCast error:", error);
      if (error instanceof CustomError) {
        throw error;
      }
      throw new CustomError(
        "Failed to create ChainCast",
        StatusCode.INTERNAL_SERVER_ERROR
      );
    }
  }

  async getChainCasts(
    adminId: string,
    query: GetChainCastsQueryDto
  ): Promise<ChainCastsListResponseDto> {
    try {
      const admin = await this._adminRepository.findById(adminId);
      if (!admin) {
        throw new CustomError(
          "Community admin not found",
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
          new ChainCastResponseDto(chainCast, admin, "admin", false, true)
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
      logger.error("Get ChainCasts error:", error);
      if (error instanceof CustomError) {
        throw error;
      }
      throw new CustomError(
        "Failed to get ChainCasts",
        StatusCode.INTERNAL_SERVER_ERROR
      );
    }
  }

  async getChainCastById(
    chainCastId: string,
    userId?: string
  ): Promise<ChainCastResponseDto> {
    try {
      const chainCast =
        await this._chainCastRepository.findChainCastById(chainCastId);
      if (!chainCast) {
        throw new CustomError("ChainCast not found", StatusCode.NOT_FOUND);
      }

      let userRole: string | undefined;
      let canJoin = false;
      let canModerate = false;

      if (userId) {
        // Check if user is a community member
        const isMember = await this.isUserCommunityMember(
          userId,
          chainCast.communityId.toString()
        );
        if (isMember) {
          canJoin =
            chainCast.status === "live" || chainCast.status === "scheduled";

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
      logger.error("Get ChainCast by ID error:", error);
      if (error instanceof CustomError) {
        throw error;
      }
      throw new CustomError(
        "Failed to get ChainCast",
        StatusCode.INTERNAL_SERVER_ERROR
      );
    }
  }

  async updateChainCast(
    adminId: string,
    chainCastId: string,
    data: UpdateChainCastDto
  ): Promise<ChainCastResponseDto> {
    try {
      const chainCast =
        await this._chainCastRepository.findChainCastById(chainCastId);
      if (!chainCast) {
        throw new CustomError("ChainCast not found", StatusCode.NOT_FOUND);
      }

      // Verify ownership
      if (chainCast.adminId.toString() !== adminId) {
        throw new CustomError(
          "You are not authorized to update this ChainCast",
          StatusCode.FORBIDDEN
        );
      }

      // Don't allow updates to live or ended ChainCasts
      if (chainCast.status === "live" || chainCast.status === "ended") {
        throw new CustomError(
          "Cannot update a live or ended ChainCast",
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
          "Failed to update ChainCast",
          StatusCode.INTERNAL_SERVER_ERROR
        );
      }

      const admin = await this._adminRepository.findById(adminId);
      return new ChainCastResponseDto(
        updatedChainCast,
        admin,
        "admin",
        false,
        true
      );
    } catch (error) {
      logger.error("Update ChainCast error:", error);
      if (error instanceof CustomError) {
        throw error;
      }
      throw new CustomError(
        "Failed to update ChainCast",
        StatusCode.INTERNAL_SERVER_ERROR
      );
    }
  }

  async deleteChainCast(
    adminId: string,
    chainCastId: string
  ): Promise<{ success: boolean; message: string }> {
    try {
      const chainCast =
        await this._chainCastRepository.findChainCastById(chainCastId);
      if (!chainCast) {
        throw new CustomError("ChainCast not found", StatusCode.NOT_FOUND);
      }

      // Verify ownership
      if (chainCast.adminId.toString() !== adminId) {
        throw new CustomError(
          "You are not authorized to delete this ChainCast",
          StatusCode.FORBIDDEN
        );
      }

      // Don't allow deletion of live ChainCasts
      if (chainCast.status === "live") {
        throw new CustomError(
          "Cannot delete a live ChainCast. End it first.",
          StatusCode.BAD_REQUEST
        );
      }

      const success =
        await this._chainCastRepository.deleteChainCast(chainCastId);
      if (!success) {
        throw new CustomError(
          "Failed to delete ChainCast",
          StatusCode.INTERNAL_SERVER_ERROR
        );
      }

      return {
        success: true,
        message: "ChainCast deleted successfully",
      };
    } catch (error) {
      logger.error("Delete ChainCast error:", error);
      if (error instanceof CustomError) {
        throw error;
      }
      throw new CustomError(
        "Failed to delete ChainCast",
        StatusCode.INTERNAL_SERVER_ERROR
      );
    }
  }

  // ChainCast control
  async startChainCast(
    adminId: string,
    chainCastId: string
  ): Promise<ChainCastResponseDto> {
    try {
      const chainCast =
        await this._chainCastRepository.findChainCastById(chainCastId);
      if (!chainCast) {
        throw new CustomError("ChainCast not found", StatusCode.NOT_FOUND);
      }
      const adminIdFromCast =
        typeof chainCast.adminId === "object"
          ? chainCast.adminId._id?.toString() || chainCast.adminId.toString()
          : chainCast.adminId;

      console.log("Starting ChainCast:", adminIdFromCast, "neeyanne", adminId);

      // Verify ownership
      if (adminIdFromCast !== adminId) {
        throw new CustomError(
          "You are not authorized to start this ChainCast",
          StatusCode.FORBIDDEN
        );
      }

      if (chainCast.status !== "scheduled") {
        throw new CustomError(
          "Only scheduled ChainCasts can be started",
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
          "Failed to start ChainCast",
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
        false,
        true
      );
    } catch (error) {
      logger.error("Start ChainCast error:", error);
      if (error instanceof CustomError) {
        throw error;
      }
      throw new CustomError(
        "Failed to start ChainCast",
        StatusCode.INTERNAL_SERVER_ERROR
      );
    }
  }

  async endChainCast(
    adminId: string,
    chainCastId: string
  ): Promise<ChainCastResponseDto> {
    try {
      const chainCast =
        await this._chainCastRepository.findChainCastById(chainCastId);
      if (!chainCast) {
        throw new CustomError("ChainCast not found", StatusCode.NOT_FOUND);
      }
      const adminIdFromCast =
        typeof chainCast.adminId === "object"
          ? chainCast.adminId._id?.toString() || chainCast.adminId.toString()
          : chainCast.adminId;

      // Verify ownership
      if (adminIdFromCast !== adminId) {
        throw new CustomError(
          "You are not authorized to end this ChainCast",
          StatusCode.FORBIDDEN
        );
      }

      if (chainCast.status !== "live") {
        throw new CustomError(
          "Only live ChainCasts can be ended",
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
          "Failed to end ChainCast",
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
        false,
        true
      );
    } catch (error) {
      logger.error("End ChainCast error:", error);
      if (error instanceof CustomError) {
        throw error;
      }
      throw new CustomError(
        "Failed to end ChainCast",
        StatusCode.INTERNAL_SERVER_ERROR
      );
    }
  }

  // User ChainCast participation
  async getCommunityChainCasts(
    communityId: string,
    userId: string,
    query: GetChainCastsQueryDto
  ): Promise<ChainCastsListResponseDto> {
    try {
      // Verify user is community member
      const isMember = await this.isUserCommunityMember(userId, communityId);
      if (!isMember) {
        throw new CustomError(
          "You are not a member of this community",
          StatusCode.FORBIDDEN
        );
      }

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

          const canJoin =
            chainCast.status === "live" || chainCast.status === "scheduled";
          const canModerate = participant?.permissions.canModerate || false;
          const userRole = participant?.role;

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
      logger.error("Get community ChainCasts error:", error);
      if (error instanceof CustomError) {
        throw error;
      }
      throw new CustomError(
        "Failed to get community ChainCasts",
        StatusCode.INTERNAL_SERVER_ERROR
      );
    }
  }

  async joinChainCast(
    userId: string,
    data: JoinChainCastDto
  ): Promise<{ success: boolean; message: string; streamUrl?: string }> {
    try {
      const chainCast = await this._chainCastRepository.findChainCastById(
        data.chainCastId
      );
      if (!chainCast) {
        throw new CustomError("ChainCast not found", StatusCode.NOT_FOUND);
      }

      if (chainCast.status !== "live") {
        throw new CustomError(
          "ChainCast is not currently live",
          StatusCode.BAD_REQUEST
        );
      }

      // Verify user can join
      const { canJoin, reason } = await this.canUserJoinChainCast(
        userId,
        data.chainCastId
      );
      if (!canJoin) {
        throw new CustomError(
          reason || "You cannot join this ChainCast",
          StatusCode.FORBIDDEN
        );
      }

      // Check if user is already a participant
      const existingParticipant =
        await this._chainCastRepository.findParticipantByChainCastAndUser(
          data.chainCastId,
          userId
        );

      if (existingParticipant && existingParticipant.isActive) {
        return {
          success: true,
          message: "You are already in this ChainCast",
          streamUrl: chainCast.streamData.streamUrl,
        };
      }

      // Check participant limit
      const currentCount =
        await this._chainCastRepository.getActiveParticipantsCount(
          data.chainCastId
        );
      if (currentCount >= chainCast.maxParticipants) {
        throw new CustomError(
          "ChainCast has reached maximum participant limit",
          StatusCode.BAD_REQUEST
        );
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
        message: "Successfully joined ChainCast",
        streamUrl: chainCast.streamData.streamUrl,
      };
    } catch (error) {
      logger.error("Join ChainCast error:", error);
      if (error instanceof CustomError) {
        throw error;
      }
      throw new CustomError(
        "Failed to join ChainCast",
        StatusCode.INTERNAL_SERVER_ERROR
      );
    }
  }

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
          message: "You are not in this ChainCast",
        };
      }

      // Remove participant
      await this._chainCastRepository.removeParticipant(chainCastId, userId);

      // Update participant count
      const newCount =
        await this._chainCastRepository.getActiveParticipantsCount(chainCastId);
      await this._chainCastRepository.updateChainCast(chainCastId, {
        currentParticipants: newCount,
      });

      return {
        success: true,
        message: "Successfully left ChainCast",
      };
    } catch (error) {
      logger.error("Leave ChainCast error:", error);
      if (error instanceof CustomError) {
        throw error;
      }
      throw new CustomError(
        "Failed to leave ChainCast",
        StatusCode.INTERNAL_SERVER_ERROR
      );
    }
  }

  // Participant management
  async getParticipants(
    chainCastId: string,
    query: GetParticipantsQueryDto
  ): Promise<ChainCastParticipantsListResponseDto> {
    try {
      const chainCast =
        await this._chainCastRepository.findChainCastById(chainCastId);
      if (!chainCast) {
        throw new CustomError("ChainCast not found", StatusCode.NOT_FOUND);
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
      logger.error("Get participants error:", error);
      if (error instanceof CustomError) {
        throw error;
      }
      throw new CustomError(
        "Failed to get participants",
        StatusCode.INTERNAL_SERVER_ERROR
      );
    }
  }

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
          "You are not a participant in this ChainCast",
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
        message: "Participant updated successfully",
      };
    } catch (error) {
      logger.error("Update participant error:", error);
      if (error instanceof CustomError) {
        throw error;
      }
      throw new CustomError(
        "Failed to update participant",
        StatusCode.INTERNAL_SERVER_ERROR
      );
    }
  }

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
        throw new CustomError("ChainCast not found", StatusCode.NOT_FOUND);
      }

      // Verify ownership
      if (chainCast.adminId.toString() !== adminId) {
        throw new CustomError(
          "You are not authorized to remove participants",
          StatusCode.FORBIDDEN
        );
      }

      const participant =
        await this._chainCastRepository.findParticipantByChainCastAndUser(
          chainCastId,
          participantId
        );

      if (!participant || !participant.isActive) {
        throw new CustomError("Participant not found", StatusCode.NOT_FOUND);
      }

      // Cannot remove other admins
      if (participant.role === "admin") {
        throw new CustomError(
          "Cannot remove community admin",
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
        message: "Participant removed successfully",
      };
    } catch (error) {
      logger.error("Remove participant error:", error);
      if (error instanceof CustomError) {
        throw error;
      }
      throw new CustomError(
        "Failed to remove participant",
        StatusCode.INTERNAL_SERVER_ERROR
      );
    }
  }

  // Moderation
  async requestModeration(
    userId: string,
    data: RequestModerationDto
  ): Promise<{ success: boolean; message: string }> {
    try {
      const chainCast = await this._chainCastRepository.findChainCastById(
        data.chainCastId
      );
      if (!chainCast) {
        throw new CustomError("ChainCast not found", StatusCode.NOT_FOUND);
      }

      if (chainCast.status !== "live") {
        throw new CustomError(
          "ChainCast is not currently live",
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
          "You must be a participant to request moderation",
          StatusCode.FORBIDDEN
        );
      }

      if (participant.role !== "viewer") {
        throw new CustomError(
          "You already have moderation permissions",
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
          "You already have a pending moderation request",
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
        message: "Moderation request submitted successfully",
      };
    } catch (error) {
      logger.error("Request moderation error:", error);
      if (error instanceof CustomError) {
        throw error;
      }
      throw new CustomError(
        "Failed to request moderation",
        StatusCode.INTERNAL_SERVER_ERROR
      );
    }
  }

  async getModerationRequests(
    adminId: string,
    chainCastId: string
  ): Promise<ChainCastModerationRequestsListResponseDto> {
    try {
      const chainCast =
        await this._chainCastRepository.findChainCastById(chainCastId);
      if (!chainCast) {
        throw new CustomError("ChainCast not found", StatusCode.NOT_FOUND);
      }

      // Verify ownership
      if (chainCast.adminId.toString() !== adminId) {
        throw new CustomError(
          "You are not authorized to view moderation requests",
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
      logger.error("Get moderation requests error:", error);
      if (error instanceof CustomError) {
        throw error;
      }
      throw new CustomError(
        "Failed to get moderation requests",
        StatusCode.INTERNAL_SERVER_ERROR
      );
    }
  }

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
          "Moderation request not found",
          StatusCode.NOT_FOUND
        );
      }

      const chainCast = await this._chainCastRepository.findChainCastById(
        request.chainCastId.toString()
      );
      if (!chainCast) {
        throw new CustomError("ChainCast not found", StatusCode.NOT_FOUND);
      }

      // Verify ownership
      if (chainCast.adminId.toString() !== adminId) {
        throw new CustomError(
          "You are not authorized to review this request",
          StatusCode.FORBIDDEN
        );
      }

      if (request.status !== "pending") {
        throw new CustomError(
          "Request has already been reviewed",
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
      logger.error("Review moderation request error:", error);
      if (error instanceof CustomError) {
        throw error;
      }
      throw new CustomError(
        "Failed to review moderation request",
        StatusCode.INTERNAL_SERVER_ERROR
      );
    }
  }

  // Reactions
  async addReaction(
    userId: string,
    data: AddReactionDto
  ): Promise<{ success: boolean; message: string }> {
    try {
      const chainCast = await this._chainCastRepository.findChainCastById(
        data.chainCastId
      );
      if (!chainCast) {
        throw new CustomError("ChainCast not found", StatusCode.NOT_FOUND);
      }

      if (chainCast.status !== "live") {
        throw new CustomError(
          "ChainCast is not currently live",
          StatusCode.BAD_REQUEST
        );
      }

      if (!chainCast.settings.allowReactions) {
        throw new CustomError(
          "Reactions are not allowed in this ChainCast",
          StatusCode.FORBIDDEN
        );
      }

      // Check if user is a participant
      const participant =
        await this._chainCastRepository.findParticipantByChainCastAndUser(
          data.chainCastId,
          userId
        );

      if (
        !participant ||
        !participant.isActive ||
        !participant.permissions.canReact
      ) {
        throw new CustomError(
          "You are not allowed to react in this ChainCast",
          StatusCode.FORBIDDEN
        );
      }

      // Create reaction
      await this._chainCastRepository.createReaction({
        chainCastId: chainCast._id,
        userId: new Types.ObjectId(userId),
        emoji: data.emoji,
      });

      // Update participant reaction count
      await this._chainCastRepository.updateParticipant(
        data.chainCastId,
        userId,
        { reactionsCount: participant.reactionsCount + 1 }
      );

      // Update ChainCast reaction stats
      await this._chainCastRepository.updateChainCastStats(data.chainCastId, {
        totalReactions: 1,
      });

      return {
        success: true,
        message: "Reaction added successfully",
      };
    } catch (error) {
      logger.error("Add reaction error:", error);
      if (error instanceof CustomError) {
        throw error;
      }
      throw new CustomError(
        "Failed to add reaction",
        StatusCode.INTERNAL_SERVER_ERROR
      );
    }
  }

  async getReactions(
    chainCastId: string,
    query: GetReactionsQueryDto
  ): Promise<ChainCastReactionsListResponseDto> {
    try {
      const chainCast =
        await this._chainCastRepository.findChainCastById(chainCastId);
      if (!chainCast) {
        throw new CustomError("ChainCast not found", StatusCode.NOT_FOUND);
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
      logger.error("Get reactions error:", error);
      if (error instanceof CustomError) {
        throw error;
      }
      throw new CustomError(
        "Failed to get reactions",
        StatusCode.INTERNAL_SERVER_ERROR
      );
    }
  }

  // Analytics
  async getChainCastAnalytics(adminId: string, period?: string): Promise<any> {
    try {
      const admin = await this._adminRepository.findById(adminId);
      if (!admin || !admin.communityId) {
        throw new CustomError(
          "Community admin not found",
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
      logger.error("Get ChainCast analytics error:", error);
      if (error instanceof CustomError) {
        throw error;
      }
      throw new CustomError(
        "Failed to get analytics",
        StatusCode.INTERNAL_SERVER_ERROR
      );
    }
  }

  // Utility methods
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
      console.log("Checking if user can join ChainCast:", userId, chainCast.communityId._id.toString());

      // Check if user is community member
      const isMember = await this.isUserCommunityMember(
        userId,
        chainCast.communityId._id.toString()
      );

      if (!isMember) {
        return {
          canJoin: false,
          reason: "You are not a member of this community",
        };
      }

      // Check participant limit
      const currentCount =
        await this._chainCastRepository.getActiveParticipantsCount(chainCastId);
      if (currentCount >= chainCast.maxParticipants) {
        return { canJoin: false, reason: "ChainCast is full" };
      }

      return { canJoin: true };
    } catch (error) {
      logger.error("Can user join ChainCast error:", error);
      return { canJoin: false, reason: "Error checking permissions" };
    }
  }

  async isUserCommunityMember(
    userId: string,
    communityId: string
  ): Promise<boolean> {
    try {
      const member = await CommunityMemberModel.findOne({
        userId: new Types.ObjectId(userId),
        communityId: new Types.ObjectId(communityId),
        isActive: true,
      });
      return !!member;
    } catch (error) {
      logger.error("Check community member error:", error);
      return false;
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
    // In a real implementation, this would connect to a streaming service
    return `https://localhost:3000/live/${streamKey}`;
  }

  private async _getCursorSkip(cursor: string): Promise<number> {
    // Simple implementation - in production, use proper cursor-based pagination
    return 0;
  }

  private async _getChainCastsSummary(adminId: string): Promise<any> {
    // Implementation would aggregate ChainCast statuses
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
