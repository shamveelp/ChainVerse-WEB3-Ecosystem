import { injectable, inject } from "inversify";
import { IUserDexService } from "../../core/interfaces/services/user/IUserDexService";
import { IPaymentRepository } from "../../core/interfaces/repositories/IPaymentRepository";
import { TYPES } from "../../core/types/types";
import { IPayment } from "../../models/payment.model";
import { StatusCode } from "../../enums/statusCode.enum";
import { CustomError } from "../../utils/customError";
import logger from "../../utils/logger";
import Razorpay from "razorpay";
import crypto from "crypto";
import axios from "axios";
import { Types } from "mongoose";

@injectable()
export class UserDexService implements IUserDexService {
  private razorpay: Razorpay;

  constructor(
    @inject(TYPES.IPaymentRepository) private _paymentRepository: IPaymentRepository
  ) {
    this.razorpay = new Razorpay({
      key_id: 'rzp_test_RIWXl802XaTvlw',
      key_secret: 'X170fnyIQ5snVRsl94Bv4oD2',
    });
  }

  async createPaymentOrder(
    userId: string,
    walletAddress: string,
    currency: string,
    amountInCurrency: number,
    estimatedEth: number,
    ethPriceAtTime: number
  ): Promise<{ order: any; payment: IPayment }> {
    try {
      logger.info(`Creating payment order for user: ${userId}, amount: ${amountInCurrency} ${currency}`);

      // Validate currency
      if (currency !== 'INR') {
        throw new CustomError("Only INR payments are currently supported", StatusCode.BAD_REQUEST);
      }


      const fees = this.calculateFees(estimatedEth);

      const options = {
        amount: Math.round(amountInCurrency * 100), 
        currency: currency,
        receipt: `order_${Date.now()}`,
      };

      const razorpayOrder = await this.razorpay.orders.create(options);


      const paymentData: Partial<IPayment> = {
        userId: new Types.ObjectId(userId),
        walletAddress,
        currency: currency as 'INR',
        amountInCurrency,
        estimatedEth,
        actualEthToSend: fees.actualEthAmount,
        platformFee: fees.platformFee,
        totalFeePercentage: fees.totalFeePercentage,
        razorpayOrderId: razorpayOrder.id,
        ethPriceAtTime,
        status: 'pending',
      };

      const payment = await this._paymentRepository.create(paymentData);

      logger.info(`Payment order created: ${payment._id}`);

      return {
        order: razorpayOrder,
        payment
      };
    } catch (error) {
      logger.error("Error creating payment order:", error);
      throw error instanceof CustomError ? error : new CustomError("Failed to create payment order", StatusCode.INTERNAL_SERVER_ERROR);
    }
  }

  async verifyPayment(
    userId: string,
    razorpayOrderId: string,
    razorpayPaymentId: string,
    razorpaySignature: string
  ): Promise<IPayment> {
    try {
      logger.info(`Verifying payment: ${razorpayPaymentId} for order: ${razorpayOrderId}`);

      // Find payment record
      const payment = await this._paymentRepository.findByRazorpayOrderId(razorpayOrderId);
      if (!payment) {
        throw new CustomError("Payment record not found", StatusCode.NOT_FOUND);
      }

      if (payment.userId.toString() !== userId) {
        throw new CustomError("Unauthorized payment verification", StatusCode.UNAUTHORIZED);
      }

      // Verify signature
      const body = razorpayOrderId + "|" + razorpayPaymentId;
      const expectedSignature = crypto
        .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET!)
        .update(body.toString())
        .digest("hex");

      if (expectedSignature !== razorpaySignature) {
        // Update payment as failed
        await this._paymentRepository.updateStatus(payment._id.toString(), 'failed');
        throw new CustomError("Payment signature verification failed", StatusCode.BAD_REQUEST);
      }

      // Update payment as successful
      const updatedPayment = await this._paymentRepository.updateStatus(
        payment._id.toString(),
        'success',
        {
          razorpayPaymentId,
          razorpaySignature,
        }
      );

      logger.info(`Payment verified successfully: ${payment._id}`);

      return updatedPayment!;
    } catch (error) {
      logger.error("Error verifying payment:", error);
      throw error instanceof CustomError ? error : new CustomError("Payment verification failed", StatusCode.INTERNAL_SERVER_ERROR);
    }
  }

  async getUserPayments(userId: string, page: number = 1, limit: number = 10) {
    try {
      return await this._paymentRepository.findByUserId(userId, page, limit);
    } catch (error) {
      logger.error("Error getting user payments:", error);
      throw new CustomError("Failed to retrieve payments", StatusCode.INTERNAL_SERVER_ERROR);
    }
  }

  async getEthPrice(): Promise<number> {
    try {
      // Get ETH price from CoinGecko API
      const response = await axios.get(
        'https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=inr,usd,sar'
      );

      return response.data.ethereum.inr;
    } catch (error) {
      logger.error("Error fetching ETH price:", error);
      // Fallback price (you should set this to a reasonable default)
      return 200000; // 2 Lakh INR as fallback
    }
  }

  calculateFees(estimatedEth: number): {
    platformFee: number;
    totalFeePercentage: number;
    actualEthAmount: number;
  } {
    const totalFeePercentage = 20; // 20% total fees
    const platformFeePercentage = 5; // 5% platform fee
    
    const platformFee = (estimatedEth * platformFeePercentage) / 100;
    const totalFees = (estimatedEth * totalFeePercentage) / 100;
    const actualEthAmount = estimatedEth - totalFees;

    return {
      platformFee,
      totalFeePercentage,
      actualEthAmount
    };
  }
}