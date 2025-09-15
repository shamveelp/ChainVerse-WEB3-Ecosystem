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
import { ErrorMessages } from "../../enums/messages.enum";
import { GetUsersResponseDto, UserResponseDto } from "../../dtos/admin/AdminUser.dto";

@injectable()
export class AdminUserController implements IAdminUserController {
  constructor(
    @inject(TYPES.IAdminUserService) private _adminUserService: IAdminUserService,
    @inject(TYPES.IReferralHistoryService) private _referralHistoryService: IReferralHistoryService,
    @inject(TYPES.IPointsHistoryService) private _pointsHistoryService: IPointsHistoryService,
    @inject(TYPES.IDailyCheckInService) private _dailyCheckInService: IDailyCheckInService,
  ) {}

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
        "Users retrieved successfully"
      );
      
      res.status(StatusCode.OK).json(response);
    } catch (error) {
      const err = error as Error;
      logger.error("Get all users error:", err);
      res.status(StatusCode.BAD_REQUEST).json({
        success: false,
        message: err.message || ErrorMessages.SERVER_ERROR,
      });
    }
  }

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
      logger.error("Failed to fetch user", err);
      res.status(StatusCode.INTERNAL_SERVER_ERROR).json({ 
        success: false,
        message: ErrorMessages.SERVER_ERROR 
      });
    }
  }

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
        message: "User status updated successfully",
        user: response,
      });
    } catch (error) {
      const err = error as Error;
      logger.error("Update user status error:", err);
      res.status(StatusCode.INTERNAL_SERVER_ERROR).json({ 
        success: false,
        message: ErrorMessages.SERVER_ERROR 
      });
    }
  }

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
        message: `User ${isBanned ? 'banned' : 'unbanned'} successfully`,
        user: response,
      });
    } catch (error) {
      const err = error as Error;
      logger.error("Update user ban status error:", err);
      res.status(StatusCode.INTERNAL_SERVER_ERROR).json({ 
        success: false,
        message: ErrorMessages.SERVER_ERROR 
      });
    }
  }

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
        message: "User deleted successfully",
      });
    } catch (error) {
      const err = error as Error;
      logger.error("Delete user error:", err);
      res.status(StatusCode.INTERNAL_SERVER_ERROR).json({ 
        success: false,
        message: ErrorMessages.SERVER_ERROR 
      });
    }
  }

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
        message: "Referrals retrieved successfully",
      });
    } catch (error) {
      const err = error as Error;
      logger.error("Get user referrals error:", err);
      res.status(StatusCode.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: err.message || ErrorMessages.SERVER_ERROR,
      });
    }
  }

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
        message: "Points history retrieved successfully",
      });
    } catch (error) {
      const err = error as Error;
      logger.error("Get user points history error:", err);
      res.status(StatusCode.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: err.message || ErrorMessages.SERVER_ERROR,
      });
    }
  }

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
        message: "Check-in history retrieved successfully",
      });
    } catch (error) {
      const err = error as Error;
      logger.error("Get user check-in history error:", err);
      res.status(StatusCode.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: err.message || ErrorMessages.SERVER_ERROR,
      });
    }
  }

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
        message: "User stats retrieved successfully",
      });
    } catch (error) {
      const err = error as Error;
      logger.error("Get user stats error:", err);
      res.status(StatusCode.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: err.message || ErrorMessages.SERVER_ERROR,
      });
    }
  }
}