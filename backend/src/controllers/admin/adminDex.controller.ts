import { inject, injectable } from "inversify";
import { Request, Response } from "express";
import { TYPES } from "../../core/types/types";
import { IAdminDexController } from "../../core/interfaces/controllers/admin/IAdminDexController";
import { IAdminDexService } from "../../core/interfaces/services/admin/IAdminDexService";
import { StatusCode } from "../../enums/statusCode.enum";
import logger from "../../utils/logger";
import { CustomError } from "../../utils/customError";
import { PaymentResponseDto } from "../../dtos/payment/Payment.dto";

@injectable()
export class AdminDexController implements IAdminDexController {
  constructor(
    @inject(TYPES.IAdminDexService) private _adminDexService: IAdminDexService
  ) {}

  getAllPayments = async (req: Request, res: Response) => {
    try {
      const { page = 1, limit = 10, status } = req.query as any;
      
      const payments = await this._adminDexService.getAllPayments(
        parseInt(page),
        parseInt(limit),
        status
      );
      
      const response = new PaymentResponseDto("Payments retrieved successfully", payments);
      res.status(StatusCode.OK).json(response);
    } catch (error) {
      logger.error("Error getting all payments:", error);
      res.status(StatusCode.BAD_REQUEST).json({ 
        success: false,
        error: "Failed to retrieve payments" 
      });
    }
  };

  approvePayment = async (req: Request, res: Response) => {
    try {
      const { paymentId, adminNote, transactionHash } = req.body;
      const adminId = (req as any).user.id;
      
      const payment = await this._adminDexService.approvePayment(
        paymentId,
        adminId,
        adminNote,
        transactionHash
      );
      
      const response = new PaymentResponseDto("Payment approved successfully", payment);
      res.status(StatusCode.OK).json(response);
    } catch (error) {
      logger.error("Error approving payment:", error);
      const errorMessage = error instanceof CustomError ? error.message : "Failed to approve payment";
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
      
      const payment = await this._adminDexService.rejectPayment(
        paymentId,
        adminId,
        reason
      );
      
      const response = new PaymentResponseDto("Payment rejected successfully", payment);
      res.status(StatusCode.OK).json(response);
    } catch (error) {
      logger.error("Error rejecting payment:", error);
      const errorMessage = error instanceof CustomError ? error.message : "Failed to reject payment";
      const statusCode = error instanceof CustomError ? error.statusCode : StatusCode.BAD_REQUEST;
      
      res.status(statusCode).json({ 
        success: false,
        error: errorMessage 
      });
    }
  };

  fulfillPayment = async (req: Request, res: Response) => {
    try {
      const { paymentId, transactionHash } = req.body;
      const adminId = (req as any).user.id;
      
      const payment = await this._adminDexService.fulfillPayment(
        paymentId,
        adminId,
        transactionHash
      );
      
      const response = new PaymentResponseDto("Payment fulfilled successfully", payment);
      res.status(StatusCode.OK).json(response);
    } catch (error) {
      logger.error("Error fulfilling payment:", error);
      const errorMessage = error instanceof CustomError ? error.message : "Failed to fulfill payment";
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
      
      const response = new PaymentResponseDto("Payment statistics retrieved successfully", stats);
      res.status(StatusCode.OK).json(response);
    } catch (error) {
      logger.error("Error getting payment stats:", error);
      res.status(StatusCode.BAD_REQUEST).json({ 
        success: false,
        error: "Failed to get payment statistics" 
      });
    }
  };

  getPendingPayments = async (req: Request, res: Response) => {
    try {
      const pendingPayments = await this._adminDexService.getPendingPayments();
      
      const response = new PaymentResponseDto("Pending payments retrieved successfully", pendingPayments);
      res.status(StatusCode.OK).json(response);
    } catch (error) {
      logger.error("Error getting pending payments:", error);
      res.status(StatusCode.BAD_REQUEST).json({ 
        success: false,
        error: "Failed to get pending payments" 
      });
    }
  };
}