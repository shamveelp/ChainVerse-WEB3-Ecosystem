import { IPayment } from "../../../../models/payment.model";
import { PaginatedPayments } from "../../repositories/IPayment.repository";

export interface IAdminDexService {
  getAllPayments(
    page: number,
    limit: number,
    status?: string
  ): Promise<PaginatedPayments>;
  
  approvePayment(
    paymentId: string,
    adminId: string,
    adminNote?: string,
    transactionHash?: string
  ): Promise<IPayment>;
  
  rejectPayment(
    paymentId: string,
    adminId: string,
    reason: string
  ): Promise<IPayment>;
  
  fulfillPayment(
    paymentId: string,
    adminId: string,
    transactionHash: string
  ): Promise<IPayment>;
  
  getPaymentStats(): Promise<{
    totalPayments: number;
    pendingCount: number;
    successCount: number;
    failedCount: number;
    fulfilledCount: number;
    rejectedCount: number;
  }>;
  
  getPendingPayments(): Promise<IPayment[]>;
}