import { Request, Response } from "express";
import { injectable, inject } from "inversify";
import { IAdminUserController } from "../../core/interfaces/controllers/admin/IAdminUser.controller";
import { IAdminUserService } from "../../core/interfaces/services/admin/IAdminUserService";
import { IReferralHistoryService } from "../../core/interfaces/services/IReferralHistoryService";
import { IPointsHistoryService } from "../../core/interfaces/services/IPointsHistoryService";
import { IDailyCheckInService } from "../../core/interfaces/services/IDailyCheckInService";
import { TYPES } from "../../core/types/types";
import logger from "../../utils/logger";
import { StatusCode } from "../../enums/statusCode.enum";
import { ErrorMessages, SuccessMessages, LoggerMessages } from "../../enums/messages.enum";
import { GetUsersResponseDto, UserResponseDto } from "../../dtos/admin/AdminUser.dto";

@injectable()
export class AdminUserController implements IAdminUserController {
  constructor(
    @inject(TYPES.IAdminUserService) private _adminUserService: IAdminUserService,
    @inject(TYPES.IReferralHistoryService) private _referralHistoryService: IReferralHistoryService,
    @inject(TYPES.IPointsHistoryService) private _pointsHistoryService: IPointsHistoryService,
    @inject(TYPES.IDailyCheckInService) private _dailyCheckInService: IDailyCheckInService,
  ) { }

  /**
   * Retrieves all users with pagination and search functionality.
   * @param req - Express Request object containing query parameters (page, limit, search).
   * @param res - Express Response object.
   */
  async getAllUsers(req: Request, res: Response): Promise<void> {
    try {
      const page = Number(req.query.page) || 1;
      const limit = Number(req.query.limit) || 10;
      const search = String(req.query.search) || '';

      const result = await this._adminUserService.getAllUsers(page, limit, search);

      const response = new GetUsersResponseDto(
        result.users,
        result.total,
        result.page,
        result.limit,
        SuccessMessages.USERS_RETRIEVED
      );

      res.status(StatusCode.OK).json(response);
    } catch (error) {
      const err = error as Error;
      logger.error(LoggerMessages.GET_ALL_USERS_ERROR, err);
      res.status(StatusCode.BAD_REQUEST).json({
        success: false,
        message: err.message || ErrorMessages.SERVER_ERROR,
      });
    }
  }

  /**
   * Retrieves a specific user by their ID.
   * @param req - Express Request object containing user ID in params.
   * @param res - Express Response object.
   */
  async getUserById(req: Request, res: Response): Promise<void> {
    try {
      const id = req.params.id;
      const user = await this._adminUserService.getUserById(id);

      if (!user) {
        res.status(StatusCode.NOT_FOUND).json({
          success: false,
          message: ErrorMessages.USER_NOT_FOUND
        });
        return;
      }

      const response = new UserResponseDto(user);
      res.status(StatusCode.OK).json({
        success: true,
        user: response,
      });
    } catch (error) {
      const err = error as Error;
      logger.error(LoggerMessages.GET_USER_BY_ID_ERROR, err);
      res.status(StatusCode.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: ErrorMessages.SERVER_ERROR
      });
    }
  }

  /**
   * Updates the status of a user (e.g., active, suspended).
   * @param req - Express Request object containing user ID in params and update data in body.
   * @param res - Express Response object.
   */
  async updateUserStatus(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const updateData = req.body;

      const updatedUser = await this._adminUserService.updateUserStatus(id, updateData);

      if (!updatedUser) {
        res.status(StatusCode.NOT_FOUND).json({
          success: false,
          message: ErrorMessages.USER_NOT_FOUND
        });
        return;
      }

      const response = new UserResponseDto(updatedUser);
      res.status(StatusCode.OK).json({
        success: true,
        message: SuccessMessages.USER_STATUS_UPDATED,
        user: response,
      });
    } catch (error) {
      const err = error as Error;
      logger.error(LoggerMessages.UPDATE_USER_STATUS_ERROR, err);
      res.status(StatusCode.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: ErrorMessages.SERVER_ERROR
      });
    }
  }

  /**
   * Bans or unbans a user.
   * @param req - Express Request object containing user ID in params and isBanned status in body.
   * @param res - Express Response object.
   */
  async updateUserBanStatus(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { isBanned } = req.body;

      const updatedUser = await this._adminUserService.updateUserStatus(id, { isBanned });

      if (!updatedUser) {
        res.status(StatusCode.NOT_FOUND).json({
          success: false,
          message: ErrorMessages.USER_NOT_FOUND
        });
        return;
      }

      const response = new UserResponseDto(updatedUser);
      res.status(StatusCode.OK).json({
        success: true,
        message: SuccessMessages.USER_STATUS_UPDATED,
        user: response,
      });
    } catch (error) {
      const err = error as Error;
      logger.error(LoggerMessages.UPDATE_USER_BAN_STATUS_ERROR, err);
      res.status(StatusCode.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: ErrorMessages.SERVER_ERROR
      });
    }
  }

  /**
   * Deletes a user from the system.
   * @param req - Express Request object containing user ID in params.
   * @param res - Express Response object.
   */
  async deleteUser(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const deleted = await this._adminUserService.deleteUser(id);

      if (!deleted) {
        res.status(StatusCode.NOT_FOUND).json({
          success: false,
          message: ErrorMessages.USER_NOT_FOUND
        });
        return;
      }

      res.status(StatusCode.OK).json({
        success: true,
        message: SuccessMessages.USER_DELETED,
      });
    } catch (error) {
      const err = error as Error;
      logger.error(LoggerMessages.DELETE_USER_ERROR, err);
      res.status(StatusCode.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: ErrorMessages.SERVER_ERROR
      });
    }
  }

  /**
   * Retrieves referral history for a specific user.
   * @param req - Express Request object containing user ID in params and pagination queries.
   * @param res - Express Response object.
   */
  async getUserReferrals(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const page = Number(req.query.page) || 1;
      const limit = Number(req.query.limit) || 10;

      const result = await this._referralHistoryService.findByReferrer(id, page, limit);

      res.status(StatusCode.OK).json({
        success: true,
        referrals: result.referrals,
        total: result.total,
        totalPages: result.totalPages,
        page,
        limit,
        message: SuccessMessages.REFERRALS_RETRIEVED,
      });
    } catch (error) {
      const err = error as Error;
      logger.error(LoggerMessages.GET_USER_REFERRALS_ERROR, err);
      res.status(StatusCode.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: err.message || ErrorMessages.SERVER_ERROR,
      });
    }
  }

  /**
   * Retrieves points history for a specific user.
   * @param req - Express Request object containing user ID in params and pagination queries.
   * @param res - Express Response object.
   */
  async getUserPointsHistory(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const page = Number(req.query.page) || 1;
      const limit = Number(req.query.limit) || 10;

      const result = await this._pointsHistoryService.getPointsHistory(id, page, limit);

      res.status(StatusCode.OK).json({
        success: true,
        history: result.history,
        total: result.total,
        totalPages: result.totalPages,
        page,
        limit,
        message: SuccessMessages.POINTS_HISTORY_RETRIEVED,
      });
    } catch (error) {
      const err = error as Error;
      logger.error(LoggerMessages.GET_USER_POINTS_HISTORY_ERROR, err);
      res.status(StatusCode.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: err.message || ErrorMessages.SERVER_ERROR,
      });
    }
  }

  /**
   * Retrieves daily check-in history for a specific user.
   * @param req - Express Request object containing user ID in params and pagination queries.
   * @param res - Express Response object.
   */
  async getUserCheckInHistory(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const page = Number(req.query.page) || 1;
      const limit = Number(req.query.limit) || 10;

      const result = await this._dailyCheckInService.getCheckInHistory(id, page, limit);

      res.status(StatusCode.OK).json({
        success: true,
        checkIns: result.checkIns,
        total: result.total,
        totalPages: result.totalPages,
        page,
        limit,
        message: SuccessMessages.CHECKIN_HISTORY_RETRIEVED,
      });
    } catch (error) {
      const err = error as Error;
      logger.error(LoggerMessages.GET_USER_CHECKIN_HISTORY_ERROR, err);
      res.status(StatusCode.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: err.message || ErrorMessages.SERVER_ERROR,
      });
    }
  }

  /**
   * Retrieves general statistics for a specific user.
   * @param req - Express Request object containing user ID in params.
   * @param res - Express Response object.
   */
  async getUserStats(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const stats = await this._referralHistoryService.getReferralStats(id);

      res.status(StatusCode.OK).json({
        success: true,
        stats: {
          totalReferrals: stats.totalReferrals,
          totalPointsEarnedFromReferrals: stats.totalPointsEarned,
        },
        message: SuccessMessages.USER_STATS_RETRIEVED,
      });
    } catch (error) {
      const err = error as Error;
      logger.error(LoggerMessages.GET_USER_STATS_ERROR, err);
      res.status(StatusCode.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: err.message || ErrorMessages.SERVER_ERROR,
      });
    }
  }
}