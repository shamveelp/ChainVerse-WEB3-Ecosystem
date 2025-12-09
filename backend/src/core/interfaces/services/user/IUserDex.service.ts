import { IPayment } from "../../../../models/payment.model";
import { PaginatedPayments } from "../../repositories/IPayment.repository";

export interface IUserDexService {
  getEthPrice(): Promise<number>;
  
  calculateEstimate(
    amount: number,
    currency?: string
  ): Promise<{
    estimatedEth: number;
    platformFee: number;
    otherFees: number;
    totalFees: number;
    actualEthToReceive: number;
    totalFeePercentage: number;
    ethPriceUsed: number;
    currency: string;
  }>;

  createPaymentOrder(
    userId: string,
    walletAddress: string,
    currency: string,
    amountInCurrency: number,
    estimatedEth: number,
    ethPriceAtTime: number
  ): Promise<{
    orderId: string;
    amount: number;
    currency: string;
    paymentId: string;
  }>;

  verifyPayment(
    razorpayOrderId: string,
    razorpayPaymentId: string,
    razorpaySignature: string
  ): Promise<IPayment>;

  getUserPayments(
    userId: string,
    page: number,
    limit: number
  ): Promise<PaginatedPayments>;
}