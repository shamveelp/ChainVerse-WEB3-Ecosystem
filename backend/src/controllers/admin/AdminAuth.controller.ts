import { Request, Response } from "express";
import { injectable, inject } from "inversify";
import { IAdminAuthController } from "../../core/interfaces/controllers/admin/IAuthAdmin.controllers";
import { IAdminAuthService } from "../../core/interfaces/services/admin/IAdminAuthService";
import { TYPES } from "../../core/types/types";
import { StatusCodes } from "../../constants/statusCodes";
import { SuccessMessages, ErrorMessages } from "../../constants/messages";
import logger from "../../utils/logger";
import { IUserAuthService } from "../../core/interfaces/services/user/IUserAuthService";
import { IJwtService } from "../../core/interfaces/services/IJwtService";
import { StatusCode } from "../../enums/statusCode.enum";
import { ICommunityRequestRepository } from "../../core/interfaces/repositories/ICommunityRequestRepository";
import { ICommunityAdminAuthService } from "../../core/interfaces/services/communityAdmin/ICommunityAdminAuthService";

@injectable()
export class AdminAuthController implements IAdminAuthController {
  constructor(
    @inject(TYPES.IAdminAuthService) private adminAuthService: IAdminAuthService,
    @inject(TYPES.IUserAuthService) private userAuthService: IUserAuthService,
    @inject(TYPES.IJwtService) private jwtService: IJwtService,
    @inject(TYPES.ICommunityRequestRepository) private communityRequestRepo: ICommunityRequestRepository,
    @inject(TYPES.ICommunityAdminAuthService) private communityAdminAuthService: ICommunityAdminAuthService,
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
        // console.log(users)
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


   // Community Admin Management
  async getAllCommunityRequests(req: Request, res: Response): Promise<void> {
    try {
      const page = Number(req.query.page) || 1;
      const limit = Number(req.query.limit) || 10;
      const search = String(req.query.search) || '';
      
      const requests = await this.communityRequestRepo.findAll(page, limit, search);
      res.status(StatusCode.OK).json(requests);
    } catch (error: any) {
      logger.error("Get community requests error:", error);
      res.status(StatusCode.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: error.message || "Failed to fetch community requests"
      });
    }
  }

  async approveCommunityRequest(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      
      // Update request status to approved
      const updatedRequest = await this.communityRequestRepo.updateStatus(id, 'approved');
      if (!updatedRequest) {
        res.status(StatusCode.NOT_FOUND).json({
          success: false,
          message: "Community request not found"
        });
        return;
      }

      // Create community from request
      await this.communityAdminAuthService.createCommunityFromRequest(id);

      res.status(StatusCode.OK).json({
        success: true,
        message: "Community request approved successfully",
        request: updatedRequest
      });

      logger.info(`Community request approved: ${id}`);
    } catch (error: any) {
      logger.error("Approve community request error:", error);
      res.status(StatusCode.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: error.message || "Failed to approve community request"
      });
    }
  }

  async rejectCommunityRequest(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { reason } = req.body;

      const updatedRequest = await this.communityRequestRepo.updateStatus(id, 'rejected');
      if (!updatedRequest) {
        res.status(StatusCode.NOT_FOUND).json({
          success: false,
          message: "Community request not found"
        });
        return;
      }

      res.status(StatusCode.OK).json({
        success: true,
        message: "Community request rejected successfully",
        request: updatedRequest
      });

      logger.info(`Community request rejected: ${id}, reason: ${reason}`);
    } catch (error: any) {
      logger.error("Reject community request error:", error);
      res.status(StatusCode.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: error.message || "Failed to reject community request"
      });
    }
  }


 
}
