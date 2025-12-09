import { inject, injectable } from "inversify";
import { Request, Response } from "express";
import { TYPES } from "../../core/types/types";
import { StatusCode } from "../../enums/statusCode.enum";
import { ErrorMessages, LoggerMessages, SuccessMessages } from "../../enums/messages.enum";
import { CustomError } from "../../utils/customError";
import logger from "../../utils/logger";
import { ICommunityAdminSubscriptionController } from "../../core/interfaces/controllers/communityAdmin/ICommunityAdminSubscription.controller";
import { ICommunityAdminSubscriptionService } from "../../core/interfaces/services/communityAdmin/ICommunityAdminSubscription.service";
import { CreateSubscriptionDto, SubscriptionResponseDto, RazorpayOrderResponseDto } from "../../dtos/communityAdmin/CommunityAdminSubscription.dto";

@injectable()
export class CommunityAdminSubscriptionController implements ICommunityAdminSubscriptionController {
  constructor(
    @inject(TYPES.ICommunityAdminSubscriptionService) private _subscriptionService: ICommunityAdminSubscriptionService
  ) { }

  /**
   * Creates a new subscription order.
   * @param req - Express Request object containing subscription plan details in body.
   * @param res - Express Response object.
   */
  async createOrder(req: Request, res: Response): Promise<void> {
    try {
      const communityAdminId = (req as any).user.id;
      const createDto: CreateSubscriptionDto = req.body;
      const order = await this._subscriptionService.createOrder(communityAdminId, createDto);
      res.status(StatusCode.OK).json({
        success: true,
        data: order,
        message: SuccessMessages.SUBSCRIPTION_ORDER_CREATED,
      });
    } catch (error) {
      const err = error as Error;
      const statusCode = error instanceof CustomError ? error.statusCode : StatusCode.INTERNAL_SERVER_ERROR;
      const message = err.message || ErrorMessages.FAILED_CREATE_SUBSCRIPTION_ORDER;
      logger.error(LoggerMessages.CREATE_SUBSCRIPTION_ORDER_ERROR, { message, stack: err.stack, adminId: (req as any).user?.id });
      res.status(statusCode).json({
        success: false,
        error: message,
      });
    }
  }

  /**
   * Verifies a subscription payment.
   * @param req - Express Request object containing payment verification data.
   * @param res - Express Response object.
   */
  async verifyPayment(req: Request, res: Response): Promise<void> {
    try {
      const communityAdminId = (req as any).user.id;
      const paymentData = req.body;
      const subscription = await this._subscriptionService.verifyPayment(communityAdminId, paymentData);
      res.status(StatusCode.OK).json({
        success: true,
        data: subscription,
        message: SuccessMessages.SUBSCRIPTION_ACTIVATED,
      });
    } catch (error) {
      const err = error as Error;
      const statusCode = error instanceof CustomError ? error.statusCode : StatusCode.INTERNAL_SERVER_ERROR;
      const message = err.message || ErrorMessages.FAILED_VERIFY_PAYMENT;
      logger.error(LoggerMessages.VERIFY_SUBSCRIPTION_PAYMENT_ERROR, { message, stack: err.stack, adminId: (req as any).user?.id });
      res.status(statusCode).json({
        success: false,
        error: message,
      });
    }
  }

  /**
   * Retrieves the current subscription details.
   * @param req - Express Request object.
   * @param res - Express Response object.
   */
  async getSubscription(req: Request, res: Response): Promise<void> {
    try {
      const communityAdminId = (req as any).user.id;
      const subscription = await this._subscriptionService.getSubscription(communityAdminId);

      if (!subscription) {
        res.status(StatusCode.NOT_FOUND).json({
          success: false,
          error: ErrorMessages.SUBSCRIPTION_NOT_FOUND,
        });
        return;
      }

      res.status(StatusCode.OK).json({
        success: true,
        data: subscription,
        message: SuccessMessages.SUBSCRIPTION_RETRIEVED,
      });
    } catch (error) {
      const err = error as Error;
      const statusCode = error instanceof CustomError ? error.statusCode : StatusCode.INTERNAL_SERVER_ERROR;
      const message = err.message || ErrorMessages.FAILED_GET_SUBSCRIPTION;
      logger.error(LoggerMessages.GET_SUBSCRIPTION_ERROR, { message, stack: err.stack, adminId: (req as any).user?.id });
      res.status(statusCode).json({
        success: false,
        error: message,
      });
    }
  }

  /**
   * Retries a failed subscription payment.
   * @param req - Express Request object.
   * @param res - Express Response object.
   */
  async retryPayment(req: Request, res: Response): Promise<void> {
    try {
      const communityAdminId = (req as any).user.id;
      const order = await this._subscriptionService.retryPayment(communityAdminId);
      res.status(StatusCode.OK).json({
        success: true,
        data: order,
        message: SuccessMessages.PAYMENT_RETRY_INITIATED,
      });
    } catch (error) {
      const err = error as Error;
      const statusCode = error instanceof CustomError ? error.statusCode : StatusCode.INTERNAL_SERVER_ERROR;
      const message = err.message || ErrorMessages.FAILED_RETRY_PAYMENT;
      logger.error(LoggerMessages.RETRY_PAYMENT_ERROR, { message, stack: err.stack, adminId: (req as any).user?.id });
      res.status(statusCode).json({
        success: false,
        error: message,
      });
    }
  }

  /**
   * Retrieves the time remaining for the current subscription.
   * @param req - Express Request object.
   * @param res - Express Response object.
   */
  async getTimeRemaining(req: Request, res: Response): Promise<void> {
    try {
      const communityAdminId = (req as any).user.id;
      const timeRemaining = await this._subscriptionService.getTimeRemaining(communityAdminId);
      res.status(StatusCode.OK).json({
        success: true,
        data: timeRemaining,
        message: SuccessMessages.TIME_REMAINING_RETRIEVED,
      });
    } catch (error) {
      const err = error as Error;
      logger.error(LoggerMessages.GET_TIME_REMAINING_ERROR, { message: err.message, adminId: (req as any).user?.id });
      res.status(StatusCode.INTERNAL_SERVER_ERROR).json({
        success: false,
        error: ErrorMessages.FAILED_GET_TIME_REMAINING,
      });
    }
  }
}