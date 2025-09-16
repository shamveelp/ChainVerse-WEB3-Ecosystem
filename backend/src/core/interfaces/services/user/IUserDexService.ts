import { IPayment } from "../../../../models/payment.model";
import { PaginatedPayments } from "../../repositories/IPaymentRepository";

export interface IUserDexService {
  createPaymentOrder(
    userId: string,
    walletAddress: string,
    currency: string,
    amountInCurrency: number,
    estimatedEth: number,
    ethPriceAtTime: number
  ): Promise<{ order: any; payment: IPayment }>;
  
  verifyPayment(
    userId: string,
    razorpayOrderId: string,
    razorpayPaymentId: string,
    razorpaySignature: string
  ): Promise<IPayment>;
  
  getUserPayments(
    userId: string,
    page: number,
    limit: number
  ): Promise<PaginatedPayments>;
  
  getEthPrice(): Promise<number>;
  
  calculateFees(amount: number): {
    platformFee: number;
    totalFeePercentage: number;
    actualEthAmount: number;
  };
}