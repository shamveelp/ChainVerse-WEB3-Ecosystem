import { IPayment } from '../../../models/payment.model';

export interface PaginatedPayments {
  payments: IPayment[];
  total: number;
  page: number;
  totalPages: number;
}

export interface IPaymentRepository {
  create(item: Partial<IPayment>): Promise<IPayment>;
  findById(id: string): Promise<IPayment | null>;
  findByUserId(userId: string, page: number, limit: number): Promise<PaginatedPayments>;
  findByStatus(status: string, page: number, limit: number): Promise<PaginatedPayments>;
  findByRazorpayOrderId(orderId: string): Promise<IPayment | null>;
  findAllWithPagination(page: number, limit: number, status?: string): Promise<PaginatedPayments>;
  updateStatus(id: string, status: string, updateData?: any): Promise<IPayment | null>;
  countByStatus(status: string): Promise<number>;
  findPendingPayments(): Promise<IPayment[]>;
  count(): Promise<number>;
}