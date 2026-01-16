import { injectable, inject } from "inversify";
import { Types } from "mongoose";
import { IAdminDexService } from "../../core/interfaces/services/admin/IAdminDex.service";
import { PaginatedPayments } from "../../core/interfaces/repositories/IPayment.repository";
import { IPaymentRepository } from "../../core/interfaces/repositories/IPayment.repository";
import { TYPES } from "../../core/types/types";
import { IPayment } from "../../models/payment.model";
import { StatusCode } from "../../enums/statusCode.enum";
import { CustomError } from "../../utils/customError";
import logger from "../../utils/logger";
import { ErrorMessages, LoggerMessages } from "../../enums/messages.enum";

@injectable()
export class AdminDexService implements IAdminDexService {
  constructor(
    @inject(TYPES.IPaymentRepository) private _paymentRepository: IPaymentRepository
  ) { }

  /**
   * 
   * @param page 
   * @param limit 
   * @param status 
   * @returns 
   */
  async getAllPayments(page: number = 1, limit: number = 10, status?: string): Promise<PaginatedPayments> {
    try {
      return await this._paymentRepository.findAllWithPagination(page, limit, status);
    } catch (error) {
      logger.error(LoggerMessages.GET_ALL_PAYMENTS_ERROR, error);
      throw new CustomError(ErrorMessages.FAILED_RETRIEVE_PAYMENTS, StatusCode.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Approves a payment.
   * @param {string} paymentId - Payment ID.
   * @param {string} adminId - Admin ID.
   * @param {string} [adminNote] - Optional note.
   * @param {string} [transactionHash] - Optional transaction hash.
   * @returns {Promise<IPayment>} Updated payment.
   * @throws {CustomError} If payment not found, invalid status, or update fails.
   */
  async approvePayment(
    paymentId: string,
    adminId: string,
    adminNote?: string,
    transactionHash?: string
  ): Promise<IPayment> {
    try {
      const payment = await this._paymentRepository.findById(paymentId);
      if (!payment) {
        throw new CustomError(ErrorMessages.PAYMENT_NOT_FOUND, StatusCode.NOT_FOUND);
      }

      if (payment.status !== 'success') {
        throw new CustomError(ErrorMessages.INVALID_PAYMENT_STATUS, StatusCode.BAD_REQUEST);
      }

      const updatedPayment = await this._paymentRepository.updateStatus(
        paymentId,
        'fulfilled',
        {
          approvedBy: new Types.ObjectId(adminId),
          approvedAt: new Date(),
          adminNote,
          transactionHash
        }
      );

      logger.info(`Payment approved: ${paymentId} by admin: ${adminId}`);
      return updatedPayment!;
    } catch (error) {
      logger.error(LoggerMessages.APPROVE_PAYMENT_ERROR, error);
      throw error instanceof CustomError ? error : new CustomError(ErrorMessages.FAILED_APPROVE_PAYMENT, StatusCode.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Rejects a payment.
   * @param {string} paymentId - Payment ID.
   * @param {string} adminId - Admin ID.
   * @param {string} reason - Rejection reason.
   * @returns {Promise<IPayment>} Updated payment.
   * @throws {CustomError} If payment not found, invalid status, or update fails.
   */
  async rejectPayment(
    paymentId: string,
    adminId: string,
    reason: string
  ): Promise<IPayment> {
    try {
      const payment = await this._paymentRepository.findById(paymentId);
      if (!payment) {
        throw new CustomError(ErrorMessages.PAYMENT_NOT_FOUND, StatusCode.NOT_FOUND);
      }

      if (payment.status !== 'success') {
        throw new CustomError(ErrorMessages.INVALID_PAYMENT_STATUS, StatusCode.BAD_REQUEST);
      }

      const updatedPayment = await this._paymentRepository.updateStatus(
        paymentId,
        'rejected',
        {
          approvedBy: new Types.ObjectId(adminId),
          rejectedAt: new Date(),
          adminNote: reason
        }
      );

      logger.info(`Payment rejected: ${paymentId} by admin: ${adminId}`);
      return updatedPayment!;
    } catch (error) {
      logger.error(LoggerMessages.REJECT_PAYMENT_ERROR, error);
      throw error instanceof CustomError ? error : new CustomError(ErrorMessages.FAILED_REJECT_PAYMENT, StatusCode.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Fulfills a payment.
   * @param {string} paymentId - Payment ID.
   * @param {string} adminId - Admin ID.
   * @param {string} transactionHash - Transaction hash.
   * @returns {Promise<IPayment>} Updated payment.
   * @throws {CustomError} If payment not found, invalid status, or update fails.
   */
  async fulfillPayment(
    paymentId: string,
    adminId: string,
    transactionHash: string
  ): Promise<IPayment> {
    try {
      const payment = await this._paymentRepository.findById(paymentId);
      if (!payment) {
        throw new CustomError(ErrorMessages.PAYMENT_NOT_FOUND, StatusCode.NOT_FOUND);
      }

      if (payment.status !== 'success') {
        throw new CustomError(ErrorMessages.INVALID_PAYMENT_STATUS, StatusCode.BAD_REQUEST);
      }

      const updatedPayment = await this._paymentRepository.updateStatus(
        paymentId,
        'fulfilled',
        {
          approvedBy: new Types.ObjectId(adminId),
          fulfilledAt: new Date(),
          transactionHash,
          adminNote: 'Payment fulfilled and crypto sent'
        }
      );

      logger.info(`Payment fulfilled: ${paymentId} by admin: ${adminId}`);
      return updatedPayment!;
    } catch (error) {
      logger.error(LoggerMessages.FULFILL_PAYMENT_ERROR, error);
      throw error instanceof CustomError ? error : new CustomError(ErrorMessages.FAILED_FULFILL_PAYMENT, StatusCode.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * 
   * @returns 
   */
  async getPaymentStats(): Promise<{
    totalPayments: number;
    pendingCount: number;
    successCount: number;
    failedCount: number;
    fulfilledCount: number;
    rejectedCount: number;
  }> {
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
      logger.error(LoggerMessages.GET_PAYMENT_STATS_ERROR, error);
      throw new CustomError(ErrorMessages.FAILED_GET_PAYMENT_STATS, StatusCode.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Retrieves all pending payments.
   * @returns {Promise<IPayment[]>} List of pending payments.
   * @throws {CustomError} If retrieval fails.
   */
  async getPendingPayments(): Promise<IPayment[]> {
    try {
      return await this._paymentRepository.findPendingPayments();
    } catch (error) {
      logger.error(LoggerMessages.GET_PENDING_PAYMENTS_ERROR, error);
      throw new CustomError(ErrorMessages.FAILED_GET_PENDING_PAYMENTS, StatusCode.INTERNAL_SERVER_ERROR);
    }
  }
}