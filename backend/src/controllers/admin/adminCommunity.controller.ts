import { Request, Response } from "express";
import { injectable, inject } from "inversify";
import { IAdminCommunityController } from "../../core/interfaces/controllers/admin/IAdminCommunity.controller";
import { IAdminCommunityService } from "../../core/interfaces/services/admin/IAdminCommunityService";
import { IMailService } from "../../core/interfaces/services/IMailService";
import { TYPES } from "../../core/types/types";
import logger from "../../utils/logger";
import { StatusCode } from "../../enums/statusCode.enum";
import { ErrorMessages } from "../../enums/messages.enum";
import { CommunityRequestResponseDto } from "../../dtos/admin/AdminCommunity.dto";
import { PaginatedResponseDto } from "../../dtos/base/BaseResponse.dto";

@injectable()
export class AdminCommunityController implements IAdminCommunityController {
  constructor(
    @inject(TYPES.IAdminCommunityService) private _adminCommunityService: IAdminCommunityService,
    @inject(TYPES.IMailService) private _mailService: IMailService,
  ) {}

  async getAllCommunityRequests(req: Request, res: Response): Promise<void> {
    try {
      const page = Number(req.query.page) || 1;
      const limit = Number(req.query.limit) || 10;
      const search = String(req.query.search) || '';
      
      const result = await this._adminCommunityService.getAllCommunityRequests(page, limit, search);
      
      const requestDtos = result.requests.map(request => new CommunityRequestResponseDto(request));
      const response = new PaginatedResponseDto(
        requestDtos,
        result.total,
        result.page,
        result.limit,
        true,
        "Community requests retrieved successfully"
      );
      
      res.status(StatusCode.OK).json(response);
    } catch (error: any) {
      logger.error("Get community requests error:", error);
      res.status(StatusCode.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: error.message || ErrorMessages.SERVER_ERROR,
      });
    }
  }

  async getCommunityRequestById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const request = await this._adminCommunityService.getCommunityRequestById(id);
      
      if (!request) {
        res.status(StatusCode.NOT_FOUND).json({
          success: false,
          message: "Community request not found",
        });
        return;
      }

      const response = new CommunityRequestResponseDto(request);
      res.status(StatusCode.OK).json({
        success: true,
        request: response,
      });
    } catch (error: any) {
      logger.error("Get community request by id error:", error);
      res.status(StatusCode.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: error.message || ErrorMessages.SERVER_ERROR,
      });
    }
  }

  async approveCommunityRequest(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      
      const updatedRequest = await this._adminCommunityService.approveCommunityRequest(id);
      if (!updatedRequest) {
        res.status(StatusCode.NOT_FOUND).json({
          success: false,
          message: "Community request not found",
        });
        return;
      }

      // Send approval email
      try {
        await this._mailService.sendCommunityApprovalEmail(
          updatedRequest.email,
          updatedRequest.communityName
        );
      } catch (emailError) {
        logger.warn("Failed to send approval email:", emailError);
      }

      const response = new CommunityRequestResponseDto(updatedRequest);
      res.status(StatusCode.OK).json({
        success: true,
        message: "Community request approved successfully",
        request: response,
      });

      logger.info(`Community request approved: ${id}`);
    } catch (error: any) {
      logger.error("Approve community request error:", error);
      res.status(StatusCode.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: error.message || ErrorMessages.SERVER_ERROR,
      });
    }
  }

  async rejectCommunityRequest(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { reason } = req.body;

      if (!reason) {
        res.status(StatusCode.BAD_REQUEST).json({
          success: false,
          message: "Rejection reason is required",
        });
        return;
      }

      const updatedRequest = await this._adminCommunityService.rejectCommunityRequest(id, reason);
      if (!updatedRequest) {
        res.status(StatusCode.NOT_FOUND).json({
          success: false,
          message: "Community request not found",
        });
        return;
      }

      // Send rejection email
      try {
        await this._mailService.sendCommunityRejectionEmail(
          updatedRequest.email,
          updatedRequest.communityName,
          reason
        );
      } catch (emailError) {
        logger.warn("Failed to send rejection email:", emailError);
      }

      const response = new CommunityRequestResponseDto(updatedRequest);
      res.status(StatusCode.OK).json({
        success: true,
        message: "Community request rejected successfully",
        request: response,
      });

      logger.info(`Community request rejected: ${id}, reason: ${reason}`);
    } catch (error: any) {
      logger.error("Reject community request error:", error);
      res.status(StatusCode.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: error.message || ErrorMessages.SERVER_ERROR,
      });
    }
  }
}