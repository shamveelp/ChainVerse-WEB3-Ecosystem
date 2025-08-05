import { Request, Response } from "express";
import { injectable, inject } from "inversify";
import { IAdminAuthController } from "../../core/interfaces/controllers/admin/IAuthAdmin.controllers";
import { IAdminAuthService } from "../../core/interfaces/services/admin/IAdminAuthService";
import { TYPES } from "../../core/types/types";
import { StatusCodes } from "../../constants/statusCodes";
import { SuccessMessages, ErrorMessages } from "../../constants/messages";
import logger from "../../utils/logger";
import { IUserAuthService } from "../../core/interfaces/services/user/IUserAuthService";
import { IJwtService } from "../../core/interfaces/services/user/IJwtService";
import { StatusCode } from "../../enums/statusCode.enum";

@injectable()
export class AdminAuthController implements IAdminAuthController {
  constructor(
    @inject(TYPES.IAdminAuthService) private adminAuthService: IAdminAuthService,
    @inject(TYPES.IUserAuthService) private userAuthService: IUserAuthService,
    @inject(TYPES.IJwtService) private jwtService: IJwtService
  ) {}

  async login(req: Request, res: Response) {
    try {
      const { email, password } = req.body;
      const { accessToken, refreshToken, admin } = await this.adminAuthService.login(email,password);
        //Set Cookies
      this.jwtService.setTokens(res, accessToken, refreshToken);
      res.status(StatusCodes.OK).json({ admin })
      logger.info("Admin logged in successfully");
    } catch (error: any) {
      logger.error("Admin login error:", error);
      res.status(StatusCodes.UNAUTHORIZED).json({
        success: false,
        message: error.message || ErrorMessages.SERVER_ERROR,
      });
    }
  }

  async getAllUsers(req: Request, res: Response): Promise<void> {
    try {
        const page = Number(req.query.page) || 1;
        const limit = Number(req.query.limit) || 5;
        const search = String(req.query.search) || '';

        const users = await this.userAuthService.getAllUsers(page, limit, search);
        res.status(StatusCodes.OK).json({users});
    } catch (error: any) {
        logger.error("Get all users error:", error);
        res.status(StatusCodes.BAD_REQUEST).json({
            success: false,
            message: error.message || ErrorMessages.SERVER_ERROR,
        });
    }
  }

  async getUserById(req: Request, res: Response): Promise<void> {
    try {
      const id = req.params.id;
      const user = await this.userAuthService.getUserById(id);
      if (!user) {
        res.status(StatusCode.NOT_FOUND).json({ message: "User not found" });
        return;
      }
      res.status(StatusCode.OK).json(user);
    } catch (err) {
      logger.error("Failed to fetch user", err);
      res.status(StatusCode.INTERNAL_SERVER_ERROR).json({ message: "Failed to fetch user" });
    }
  }

  async updateUserStatus(req: Request, res: Response) {
    try {
        const { id } = req.params;
        const { isBanned } = req.body;

        const updatedUser = await this.userAuthService.updateUserStatus(id, { isBanned });

        if (!updatedUser) {
            res.status(StatusCode.BAD_REQUEST).json({ message: "User not found" });
        return
        }

        res.status(StatusCode.OK).json(updatedUser);
    } catch (err) {
        res.status(StatusCode.INTERNAL_SERVER_ERROR).json({ message: "Failed to update user ban status" });
    }
  }

  logout(req: Request, res: Response) {
    this.jwtService.clearTokens(res)
  }

 
}
