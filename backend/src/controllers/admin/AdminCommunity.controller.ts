import { Request, Response } from "express";
import { injectable, inject } from "inversify";
import { IAdminCommunityController } from "../../core/interfaces/controllers/admin/IAdminCommunity.controller";
import { IAdminCommunityService } from "../../core/interfaces/services/admin/IAdminCommunity.service";
import { IMailService } from "../../core/interfaces/services/IMail.service";
import { TYPES } from "../../core/types/types";
import logger from "../../utils/logger";
import { StatusCode } from "../../enums/statusCode.enum";
import { ErrorMessages, SuccessMessages, LoggerMessages } from "../../enums/messages.enum";
import { CommunityRequestResponseDto } from "../../dtos/admin/AdminCommunity.dto";
import { PaginatedResponseDto } from "../../dtos/base/BaseResponse.dto";

@injectable()
export class AdminCommunityController implements IAdminCommunityController {
  constructor(
    @inject(TYPES.IAdminCommunityService) private _adminCommunityService: IAdminCommunityService,
    @inject(TYPES.IMailService) private _mailService: IMailService,
  ) { }

  /**
   * 
   * @param req 
   * @param res 
   */

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
        SuccessMessages.COMMUNITY_REQUESTS_RETRIEVED
      );

      res.status(StatusCode.OK).json(response);
    } catch (error) {
      const err = error as Error;
      logger.error(LoggerMessages.GET_COMMUNITY_REQUESTS_ERROR, err);
      res.status(StatusCode.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: err.message || ErrorMessages.SERVER_ERROR,
      });
    }
  }

  /**
   * 
   * @param req 
   * @param res 
   * @returns 
   */

  async getCommunityRequestById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const request = await this._adminCommunityService.getCommunityRequestById(id);

      if (!request) {
        res.status(StatusCode.NOT_FOUND).json({
          success: false,
          message: ErrorMessages.COMMUNITY_REQUEST_NOT_FOUND,
        });
        return;
      }

      const response = new CommunityRequestResponseDto(request);
      res.status(StatusCode.OK).json({
        success: true,
        request: response,
      });
    } catch (error) {
      const err = error as Error;
      logger.error(LoggerMessages.GET_COMMUNITY_REQUEST_BY_ID_ERROR, err);
      res.status(StatusCode.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: err.message || ErrorMessages.SERVER_ERROR,
      });
    }
  }

  /**
   * 
   * @param req 
   * @param res 
   * @returns 
   */

  async approveCommunityRequest(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const updatedRequest = await this._adminCommunityService.approveCommunityRequest(id);
      if (!updatedRequest) {
        res.status(StatusCode.NOT_FOUND).json({
          success: false,
          message: ErrorMessages.COMMUNITY_REQUEST_NOT_FOUND,
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
        logger.warn(LoggerMessages.SEND_APPROVAL_EMAIL_ERROR, emailError);
      }

      const response = new CommunityRequestResponseDto(updatedRequest);
      res.status(StatusCode.OK).json({
        success: true,
        message: SuccessMessages.COMMUNITY_REQUEST_APPROVED,
        request: response,
      });

      logger.info(`${LoggerMessages.COMMUNITY_REQUEST_APPROVED_LOG} ${id}`);
    } catch (error) {
      const err = error as Error;
      logger.error(LoggerMessages.APPROVE_COMMUNITY_REQUEST_ERROR, err);
      res.status(StatusCode.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: err.message || ErrorMessages.SERVER_ERROR,
      });
    }
  }

  /**
   * 
   * @param req 
   * @param res 
   * @returns 
   */

  async rejectCommunityRequest(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { reason } = req.body;

      if (!reason) {
        res.status(StatusCode.BAD_REQUEST).json({
          success: false,
          message: ErrorMessages.REJECTION_REASON_REQUIRED,
        });
        return;
      }

      const updatedRequest = await this._adminCommunityService.rejectCommunityRequest(id, reason);
      if (!updatedRequest) {
        res.status(StatusCode.NOT_FOUND).json({
          success: false,
          message: ErrorMessages.COMMUNITY_REQUEST_NOT_FOUND,
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
        logger.warn(LoggerMessages.SEND_REJECTION_EMAIL_ERROR, emailError);
      }

      const response = new CommunityRequestResponseDto(updatedRequest);
      res.status(StatusCode.OK).json({
        success: true,
        message: SuccessMessages.COMMUNITY_REQUEST_REJECTED,
        request: response,
      });

      logger.info(`${LoggerMessages.COMMUNITY_REQUEST_REJECTED_LOG} ${id}, reason: ${reason}`);
    } catch (error) {
      const err = error as Error;
      logger.error(LoggerMessages.REJECT_COMMUNITY_REQUEST_ERROR, err);
      res.status(StatusCode.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: err.message || ErrorMessages.SERVER_ERROR,
      });
    }
  }
}