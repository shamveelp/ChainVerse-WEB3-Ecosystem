import { inject, injectable } from "inversify";
import { Request, Response } from "express";
import { TYPES } from "../../core/types/types";
import { IAdminDexController } from "../../core/interfaces/controllers/admin/IAdminDexController";
import { IAdminDexService } from "../../core/interfaces/services/admin/IAdminDex.service";
import { StatusCode } from "../../enums/statusCode.enum";
import { SuccessMessages, ErrorMessages, LoggerMessages } from "../../enums/messages.enum";
import logger from "../../utils/logger";
import { CustomError } from "../../utils/customError";
import { PaymentResponseDto } from "../../dtos/payment/Payment.dto";
import { AuthenticatedRequest } from "../../middlewares/auth.middleware";

@injectable()
export class AdminDexController implements IAdminDexController {
  constructor(
    @inject(TYPES.IAdminDexService) private _adminDexService: IAdminDexService
  ) { }

  /**
   * Retrieves all payments with pagination and optional status filter.
   * @param req - Express Request object containing query parameters (page, limit, status).
   * @param res - Express Response object.
   */
  getAllPayments = async (req: Request, res: Response) => {
    try {
      const page = req.query.page as string || "1";
      const limit = req.query.limit as string || "10";
      const status = req.query.status as string | undefined;

      const payments = await this._adminDexService.getAllPayments(
        parseInt(page),
        parseInt(limit),
        status
      );

      const response = new PaymentResponseDto(SuccessMessages.PAYMENTS_RETRIEVED, payments);
      res.status(StatusCode.OK).json(response);
    } catch (error) {
      logger.error(LoggerMessages.GET_ALL_PAYMENTS_ERROR, error);
      const errorMessage = error instanceof CustomError ? error.message : ErrorMessages.FAILED_RETRIEVE_PAYMENTS;
      const statusCode = error instanceof CustomError ? error.statusCode : StatusCode.BAD_REQUEST;

      res.status(statusCode).json({
        success: false,
        error: errorMessage
      });
    }
  };

  /**
   * Approves a specific payment.
   * @param req - Express Request object containing paymentId, adminNote, and transactionHash in body.
   * @param res - Express Response object.
   */
  approvePayment = async (req: Request, res: Response) => {
    try {
      const { paymentId, adminNote, transactionHash } = req.body;
      const adminId = (req as AuthenticatedRequest).user?.id;
      if (!adminId) throw new Error("User ID not found in request");

      if (!paymentId) {
        res.status(StatusCode.BAD_REQUEST).json({
          success: false,
          error: ErrorMessages.PAYMENT_ID_REQUIRED
        });
        return;
      }

      const payment = await this._adminDexService.approvePayment(
        paymentId,
        adminId,
        adminNote,
        transactionHash
      );

      const response = new PaymentResponseDto(SuccessMessages.PAYMENT_APPROVED, payment);
      res.status(StatusCode.OK).json(response);
    } catch (error) {
      logger.error(LoggerMessages.APPROVE_PAYMENT_ERROR, error);
      const errorMessage = error instanceof CustomError ? error.message : ErrorMessages.FAILED_APPROVE_PAYMENT;
      const statusCode = error instanceof CustomError ? error.statusCode : StatusCode.BAD_REQUEST;

      res.status(statusCode).json({
        success: false,
        error: errorMessage
      });
    }
  };

  /**
   * Rejects a specific payment.
   * @param req - Express Request object containing paymentId and reason in body.
   * @param res - Express Response object.
   */
  rejectPayment = async (req: Request, res: Response) => {
    try {
      const { paymentId, reason } = req.body;
      const adminId = (req as AuthenticatedRequest).user?.id;
      if (!adminId) throw new Error("User ID not found in request");

      if (!paymentId || !reason) {
        res.status(StatusCode.BAD_REQUEST).json({
          success: false,
          error: ErrorMessages.PAYMENT_ID_REASON_REQUIRED
        });
        return;
      }

      const payment = await this._adminDexService.rejectPayment(
        paymentId,
        adminId,
        reason
      );

      const response = new PaymentResponseDto(SuccessMessages.PAYMENT_REJECTED, payment);
      res.status(StatusCode.OK).json(response);
    } catch (error) {
      logger.error(LoggerMessages.REJECT_PAYMENT_ERROR, error);
      const errorMessage = error instanceof CustomError ? error.message : ErrorMessages.FAILED_REJECT_PAYMENT;
      const statusCode = error instanceof CustomError ? error.statusCode : StatusCode.BAD_REQUEST;

      res.status(statusCode).json({
        success: false,
        error: errorMessage
      });
    }
  };

  /**
   * Fulfills a payment manually.
   * @param req - Express Request object containing paymentId, transactionHash, and adminNote in body.
   * @param res - Express Response object.
   */
  fulfillPayment = async (req: Request, res: Response) => {
    try {
      const { paymentId, transactionHash } = req.body;
      const adminId = (req as AuthenticatedRequest).user?.id;
      if (!adminId) throw new Error("User ID not found in request");

      if (!paymentId || !transactionHash) {
        res.status(StatusCode.BAD_REQUEST).json({
          success: false,
          error: ErrorMessages.PAYMENT_ID_HASH_REQUIRED
        });
        return;
      }

      const payment = await this._adminDexService.fulfillPayment(
        paymentId,
        adminId,
        transactionHash
      );

      const response = new PaymentResponseDto(SuccessMessages.PAYMENT_FULFILLED, payment);
      res.status(StatusCode.OK).json(response);
    } catch (error) {
      logger.error(LoggerMessages.FULFILL_PAYMENT_ERROR, error);
      const errorMessage = error instanceof CustomError ? error.message : ErrorMessages.FAILED_FULFILL_PAYMENT;
      const statusCode = error instanceof CustomError ? error.statusCode : StatusCode.BAD_REQUEST;

      res.status(statusCode).json({
        success: false,
        error: errorMessage
      });
    }
  };

  /**
   * Retrieves statistics for payments.
   * @param req - Express Request object.
   * @param res - Express Response object.
   */
  getPaymentStats = async (req: Request, res: Response) => {
    try {
      const stats = await this._adminDexService.getPaymentStats();

      const response = new PaymentResponseDto(SuccessMessages.PAYMENT_STATS_RETRIEVED, stats);
      res.status(StatusCode.OK).json(response);
    } catch (error) {
      logger.error(LoggerMessages.GET_PAYMENT_STATS_ERROR, error);
      const errorMessage = error instanceof CustomError ? error.message : ErrorMessages.FAILED_GET_PAYMENT_STATS;
      const statusCode = error instanceof CustomError ? error.statusCode : StatusCode.BAD_REQUEST;

      res.status(statusCode).json({
        success: false,
        error: errorMessage
      });
    }
  };

  /**
   * Retrieves all pending payments.
   * @param req - Express Request object.
   * @param res - Express Response object.
   */
  getPendingPayments = async (req: Request, res: Response) => {
    try {
      const pendingPayments = await this._adminDexService.getPendingPayments();

      const response = new PaymentResponseDto(SuccessMessages.PENDING_PAYMENTS_RETRIEVED, pendingPayments);
      res.status(StatusCode.OK).json(response);
    } catch (error) {
      logger.error(LoggerMessages.GET_PENDING_PAYMENTS_ERROR, error);
      const errorMessage = error instanceof CustomError ? error.message : ErrorMessages.FAILED_GET_PENDING_PAYMENTS;
      const statusCode = error instanceof CustomError ? error.statusCode : StatusCode.BAD_REQUEST;

      res.status(statusCode).json({
        success: false,
        error: errorMessage
      });
    }
  };
}