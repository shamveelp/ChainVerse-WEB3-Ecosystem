import { injectable, inject } from "inversify";
import { IAdminDexService } from "../../core/interfaces/services/admin/IAdminDexService";
import { IPaymentRepository } from "../../core/interfaces/repositories/IPaymentRepository";
import { TYPES } from "../../core/types/types";
import { IPayment } from "../../models/payment.model";
import { StatusCode } from "../../enums/statusCode.enum";
import { CustomError } from "../../utils/customError";
import logger from "../../utils/logger";

@injectable()
export class AdminDexService implements IAdminDexService {
  constructor(
    @inject(TYPES.IPaymentRepository) private _paymentRepository: IPaymentRepository
  ) {}

  async getAllPayments(page: number = 1, limit: number = 10, status?: string) {
    try {
      return await this._paymentRepository.findAllWithPagination(page, limit, status);
    } catch (error) {
      logger.error("Error getting all payments:", error);
      throw new CustomError("Failed to retrieve payments", StatusCode.INTERNAL_SERVER_ERROR);
    }
  }

  async approvePayment(
    paymentId: string,
    adminId: string,
    adminNote?: string,
    transactionHash?: string
  ): Promise<IPayment> {
    try {
      const payment = await this._paymentRepository.findById(paymentId);
      if (!payment) {
        throw new CustomError("Payment not found", StatusCode.NOT_FOUND);
      }

      if (payment.status !== 'success') {
        throw new CustomError("Only successful payments can be approved", StatusCode.BAD_REQUEST);
      }

      const updatedPayment = await this._paymentRepository.updateStatus(
        paymentId,
        'fulfilled',
        {
          approvedBy: adminId,
          approvedAt: new Date(),
          adminNote,
          transactionHash
        }
      );

      logger.info(`Payment approved: ${paymentId} by admin: ${adminId}`);
      return updatedPayment!;
    } catch (error) {
      logger.error("Error approving payment:", error);
      throw error instanceof CustomError ? error : new CustomError("Failed to approve payment", StatusCode.INTERNAL_SERVER_ERROR);
    }
  }

  async rejectPayment(
    paymentId: string,
    adminId: string,
    reason: string
  ): Promise<IPayment> {
    try {
      const payment = await this._paymentRepository.findById(paymentId);
      if (!payment) {
        throw new CustomError("Payment not found", StatusCode.NOT_FOUND);
      }

      if (payment.status !== 'success') {
        throw new CustomError("Only successful payments can be rejected", StatusCode.BAD_REQUEST);
      }

      const updatedPayment = await this._paymentRepository.updateStatus(
        paymentId,
        'rejected',
        {
          approvedBy: adminId,
          rejectedAt: new Date(),
          adminNote: reason
        }
      );

      logger.info(`Payment rejected: ${paymentId} by admin: ${adminId}`);
      return updatedPayment!;
    } catch (error) {
      logger.error("Error rejecting payment:", error);
      throw error instanceof CustomError ? error : new CustomError("Failed to reject payment", StatusCode.INTERNAL_SERVER_ERROR);
    }
  }

  async fulfillPayment(
    paymentId: string,
    adminId: string,
    transactionHash: string
  ): Promise<IPayment> {
    try {
      const payment = await this._paymentRepository.findById(paymentId);
      if (!payment) {
        throw new CustomError("Payment not found", StatusCode.NOT_FOUND);
      }

      if (payment.status !== 'success') {
        throw new CustomError("Only successful payments can be fulfilled", StatusCode.BAD_REQUEST);
      }

      const updatedPayment = await this._paymentRepository.updateStatus(
        paymentId,
        'fulfilled',
        {
          approvedBy: adminId,
          fulfilledAt: new Date(),
          transactionHash,
          adminNote: 'Payment fulfilled and crypto sent'
        }
      );

      logger.info(`Payment fulfilled: ${paymentId} by admin: ${adminId}`);
      return updatedPayment!;
    } catch (error) {
      logger.error("Error fulfilling payment:", error);
      throw error instanceof CustomError ? error : new CustomError("Failed to fulfill payment", StatusCode.INTERNAL_SERVER_ERROR);
    }
  }

  async getPaymentStats() {
    try {
      const [
        totalPayments,
        pendingCount,
        successCount,
        failedCount,
        fulfilledCount,
        rejectedCount
      ] = await Promise.all([
        this._paymentRepository.count(),
        this._paymentRepository.countByStatus('pending'),
        this._paymentRepository.countByStatus('success'),
        this._paymentRepository.countByStatus('failed'),
        this._paymentRepository.countByStatus('fulfilled'),
        this._paymentRepository.countByStatus('rejected')
      ]);

      return {
        totalPayments,
        pendingCount,
        successCount,
        failedCount,
        fulfilledCount,
        rejectedCount
      };
    } catch (error) {
      logger.error("Error getting payment stats:", error);
      throw new CustomError("Failed to get payment statistics", StatusCode.INTERNAL_SERVER_ERROR);
    }
  }

  async getPendingPayments(): Promise<IPayment[]> {
    try {
      return await this._paymentRepository.findPendingPayments();
    } catch (error) {
      logger.error("Error getting pending payments:", error);
      throw new CustomError("Failed to get pending payments", StatusCode.INTERNAL_SERVER_ERROR);
    }
  }
}