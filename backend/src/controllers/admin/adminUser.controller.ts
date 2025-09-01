import { Request, Response } from "express";
import { injectable, inject } from "inversify";
import { IAdminUserController } from "../../core/interfaces/controllers/admin/IAdminUser.controller";
import { IAdminUserService } from "../../core/interfaces/services/admin/IAdminUserService";
import { TYPES } from "../../core/types/types";
import logger from "../../utils/logger";
import { StatusCode } from "../../enums/statusCode.enum";
import { ErrorMessages } from "../../enums/messages.enum";
import { GetUsersResponseDto, UserResponseDto } from "../../dtos/admin/AdminUser.dto";

@injectable()
export class AdminUserController implements IAdminUserController {
  constructor(
    @inject(TYPES.IAdminUserService) private _adminUserService: IAdminUserService,
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
    } catch (error: any) {
      logger.error("Get all users error:", error);
      res.status(StatusCode.BAD_REQUEST).json({
        success: false,
        message: error.message || ErrorMessages.SERVER_ERROR,
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
    } catch (error: any) {
      logger.error("Failed to fetch user", error);
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
    } catch (error: any) {
      logger.error("Update user status error:", error);
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
    } catch (error: any) {
      logger.error("Update user ban status error:", error);
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
    } catch (error: any) {
      logger.error("Delete user error:", error);
      res.status(StatusCode.INTERNAL_SERVER_ERROR).json({ 
        success: false,
        message: ErrorMessages.SERVER_ERROR 
      });
    }
  }
}