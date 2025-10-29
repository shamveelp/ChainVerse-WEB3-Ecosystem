import { inject, injectable } from "inversify";
import { Request, Response } from "express";
import { TYPES } from "../../core/types/types";
import { StatusCode } from "../../enums/statusCode.enum";
import { CustomError } from "../../utils/customError";
import logger from "../../utils/logger";
import { ICommunityAdminSubscriptionController } from "../../core/interfaces/controllers/communityAdmin/ICommunityAdminSubscription.controller";
import { ICommunityAdminSubscriptionService } from "../../core/interfaces/services/communityAdmin/ICommunityAdminSubscriptionService";
import { CreateSubscriptionDto, SubscriptionResponseDto, RazorpayOrderResponseDto } from "../../dtos/communityAdmin/CommunityAdminSubscription.dto";

@injectable()
export class CommunityAdminSubscriptionController implements ICommunityAdminSubscriptionController {
  constructor(
    @inject(TYPES.ICommunityAdminSubscriptionService) private _subscriptionService: ICommunityAdminSubscriptionService
  ) {}

  async createOrder(req: Request, res: Response): Promise<void> {
    try {
      const communityAdminId = (req as any).user.id;
      const createDto: CreateSubscriptionDto = req.body;
      const order = await this._subscriptionService.createOrder(communityAdminId, createDto);
      res.status(StatusCode.OK).json({
        success: true,
        data: order,
        message: "Subscription order created successfully",
      });
    } catch (error) {
      const err = error as Error;
      const statusCode = error instanceof CustomError ? error.statusCode : StatusCode.INTERNAL_SERVER_ERROR;
      const message = err.message || "Failed to create subscription order";
      logger.error("Create subscription order error:", { message, stack: err.stack, adminId: (req as any).user?.id });
      res.status(statusCode).json({
        success: false,
        error: message,
      });
    }
  }

  async verifyPayment(req: Request, res: Response): Promise<void> {
    try {
      const communityAdminId = (req as any).user.id;
      const paymentData = req.body;
      const subscription = await this._subscriptionService.verifyPayment(communityAdminId, paymentData);
      res.status(StatusCode.OK).json({
        success: true,
        data: subscription,
        message: "Subscription activated successfully",
      });
    } catch (error) {
      const err = error as Error;
      const statusCode = error instanceof CustomError ? error.statusCode : StatusCode.INTERNAL_SERVER_ERROR;
      const message = err.message || "Failed to verify payment";
      logger.error("Verify subscription payment error:", { message, stack: err.stack, adminId: (req as any).user?.id });
      res.status(statusCode).json({
        success: false,
        error: message,
      });
    }
  }

  async getSubscription(req: Request, res: Response): Promise<void> {
    try {
      const communityAdminId = (req as any).user.id;
      const subscription = await this._subscriptionService.getSubscription(communityAdminId);
      res.status(StatusCode.OK).json({
        success: true,
        data: subscription,
        message: "Subscription retrieved successfully",
      });
    } catch (error) {
      const err = error as Error;
      const statusCode = error instanceof CustomError ? error.statusCode : StatusCode.INTERNAL_SERVER_ERROR;
      const message = err.message || "Failed to fetch subscription";
      logger.error("Get subscription error:", { message, stack: err.stack, adminId: (req as any).user?.id });
      res.status(statusCode).json({
        success: false,
        error: message,
      });
    }
  }
}