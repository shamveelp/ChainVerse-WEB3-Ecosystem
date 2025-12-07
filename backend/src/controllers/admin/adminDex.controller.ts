import { inject, injectable } from "inversify";
import { Request, Response } from "express";
import { TYPES } from "../../core/types/types";
import { IAdminDexController } from "../../core/interfaces/controllers/admin/IAdminDexController";
import { IAdminDexService } from "../../core/interfaces/services/admin/IAdminDexService";
import { StatusCode } from "../../enums/statusCode.enum";
import { SuccessMessages, ErrorMessages, LoggerMessages } from "../../enums/messages.enum";
import logger from "../../utils/logger";
import { CustomError } from "../../utils/customError";
import { PaymentResponseDto } from "../../dtos/payment/Payment.dto";

@injectable()
export class AdminDexController implements IAdminDexController {
  constructor(
    @inject(TYPES.IAdminDexService) private _adminDexService: IAdminDexService
  ) { }

  getAllPayments = async (req: Request, res: Response) => {
    try {
      const { page = 1, limit = 10, status } = req.query as any;

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

  approvePayment = async (req: Request, res: Response) => {
    try {
      const { paymentId, adminNote, transactionHash } = req.body;
      const adminId = (req as any).user.id;

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

  rejectPayment = async (req: Request, res: Response) => {
    try {
      const { paymentId, reason } = req.body;
      const adminId = (req as any).user.id;

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

  fulfillPayment = async (req: Request, res: Response) => {
    try {
      const { paymentId, transactionHash, adminNote } = req.body;
      const adminId = (req as any).user.id;

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