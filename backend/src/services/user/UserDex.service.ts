import { injectable, inject } from "inversify";
import Razorpay from "razorpay";
import crypto from "crypto";
import axios from "axios";
import { IUserDexService } from "../../core/interfaces/services/user/IUserDex.service";
import { IPaymentRepository } from "../../core/interfaces/repositories/IPayment.repository";
import { TYPES } from "../../core/types/types";
import { IPayment } from "../../models/payment.model";
import { StatusCode } from "../../enums/statusCode.enum";
import { CustomError } from "../../utils/customError";
import logger from "../../utils/logger";
import { Types } from "mongoose";

@injectable()
export class UserDexService implements IUserDexService {
  private razorpay: Razorpay;

  constructor(
    @inject(TYPES.IPaymentRepository) private _paymentRepository: IPaymentRepository
  ) {
    // Initialize Razorpay with proper error handling
    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    if (!keyId || !keySecret) {
      logger.error("Razorpay configuration missing");
      throw new Error("Razorpay configuration is missing. Please check environment variables.");
    }

    this.razorpay = new Razorpay({
      key_id: keyId,
      key_secret: keySecret
    });

    logger.info("Razorpay initialized successfully");
  }

  async getEthPrice(): Promise<number> {
    try {
      // Use multiple price sources for reliability
      const priceAPIs = [
        'https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=inr',
        'https://api.coinpaprika.com/v1/tickers/eth-ethereum'
      ];

      let price = 0;

      // Try CoinGecko first
      try {
        const response = await axios.get(priceAPIs[0], { timeout: 5000 });
        if (response.data?.ethereum?.inr) {
          price = response.data.ethereum.inr;
          logger.info(`ETH price from CoinGecko: ₹${price}`);
          return price;
        }
      } catch (error) {
        logger.warn("CoinGecko API failed, trying alternative");
      }

      // Try CoinPaprika as fallback
      try {
        const response = await axios.get(priceAPIs[1], { timeout: 5000 });
        if (response.data?.quotes?.USD?.price) {
          const usdPrice = response.data.quotes.USD.price;
          // Convert USD to INR (approximate rate)
          price = usdPrice * 83; // 1 USD ≈ 83 INR
          logger.info(`ETH price from CoinPaprika: ₹${price}`);
          return price;
        }
      } catch (error) {
        logger.warn("CoinPaprika API failed");
      }

      // If all APIs fail, use fallback price
      price = 200000; // Fallback price in INR
      logger.warn(`Using fallback ETH price: ₹${price}`);
      return price;

    } catch (error) {
      logger.error("Error fetching ETH price:", error);
      // Return fallback price instead of throwing error
      return 200000;
    }
  }

  async calculateEstimate(amount: number, currency: string = 'INR'): Promise<any> {
    try {
      if (currency !== 'INR') {
        throw new CustomError("Only INR is supported currently", StatusCode.BAD_REQUEST);
      }

      const ethPrice = await this.getEthPrice();
      
      // Calculate basic ETH amount
      const estimatedEth = amount / ethPrice;
      
      // Calculate fees (20% total)
      const platformFeePercentage = 5; // 5%
      const otherFeesPercentage = 15; // 15%
      const totalFeePercentage = 20; // 20% total
      
      const platformFee = (estimatedEth * platformFeePercentage) / 100;
      const otherFees = (estimatedEth * otherFeesPercentage) / 100;
      const totalFees = (estimatedEth * totalFeePercentage) / 100;
      
      // Calculate actual ETH user will receive
      const actualEthToReceive = estimatedEth - totalFees;
      
      const estimate = {
        estimatedEth,
        platformFee,
        otherFees,
        totalFees,
        actualEthToReceive,
        totalFeePercentage,
        ethPriceUsed: ethPrice,
        currency
      };

      logger.info("Estimate calculated:", estimate);
      return estimate;
    } catch (error) {
      logger.error("Error calculating estimate:", error);
      throw error instanceof CustomError ? error : new CustomError("Failed to calculate estimate", StatusCode.INTERNAL_SERVER_ERROR);
    }
  }

  async createPaymentOrder(
    userId: string,
    walletAddress: string,
    currency: 'INR' | 'USD' | 'RIY',
    amountInCurrency: number,
    estimatedEth: number,
    ethPriceAtTime: number
  ): Promise<any> {
    try {
      // Validate input
      if (amountInCurrency < 100) {
        throw new CustomError("Minimum amount is ₹100", StatusCode.BAD_REQUEST);
      }

      // Validate currency
      if (!['INR', 'USD', 'RIY'].includes(currency)) {
        throw new CustomError("Invalid currency. Must be INR, USD, or RIY", StatusCode.BAD_REQUEST);
      }

      // Convert userId to ObjectId
      let objectId: Types.ObjectId;
      try {
        objectId = new Types.ObjectId(userId);
      } catch (error) {
        throw new CustomError("Invalid userId format", StatusCode.BAD_REQUEST);
      }

      // Calculate fees and actual ETH to send
      const totalFeePercentage = 20;
      const platformFee = (estimatedEth * 5) / 100;
      const actualEthToSend = estimatedEth - (estimatedEth * totalFeePercentage) / 100;

      // Create Razorpay order
      const razorpayOrder = await this.razorpay.orders.create({
        amount: amountInCurrency * 100, // Razorpay expects amount in paisa
        currency: currency,
        receipt: `receipt_${Date.now()}`,
        payment_capture: true,
        notes: {
          userId,
          walletAddress,
          ethAmount: actualEthToSend.toString(),
        },
      });

      if (!razorpayOrder.id) {
        throw new CustomError("Failed to create Razorpay order", StatusCode.INTERNAL_SERVER_ERROR);
      }

      // Save payment record in database
      const payment = await this._paymentRepository.create({
        userId: objectId, // Use ObjectId instead of string
        walletAddress,
        currency, // Now properly typed as 'INR' | 'USD' | 'RIY'
        amountInCurrency,
        estimatedEth,
        actualEthToSend,
        platformFee,
        totalFeePercentage,
        razorpayOrderId: razorpayOrder.id,
        status: 'pending',
        ethPriceAtTime,
      });

      logger.info(`Payment order created: ${razorpayOrder.id} for user: ${userId}`);

      return {
        orderId: razorpayOrder.id,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
        paymentId: payment._id,
      };
    } catch (error) {
      logger.error("Error creating payment order:", error);
      throw error instanceof CustomError
        ? error
        : new CustomError("Failed to create payment order", StatusCode.INTERNAL_SERVER_ERROR);
    }
  }

  async verifyPayment(
    razorpayOrderId: string,
    razorpayPaymentId: string,
    razorpaySignature: string
  ): Promise<IPayment> {
    try {
      // Find payment record
      const payment = await this._paymentRepository.findByRazorpayOrderId(razorpayOrderId);
      if (!payment) {
        throw new CustomError("Payment not found", StatusCode.NOT_FOUND);
      }

      // Verify Razorpay signature
      const body = razorpayOrderId + "|" + razorpayPaymentId;
      const expectedSignature = crypto
        .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!)
        .update(body.toString())
        .digest('hex');

      if (expectedSignature !== razorpaySignature) {
        // Mark payment as failed
        await this._paymentRepository.updateStatus(payment._id.toString(), 'failed');
        throw new CustomError("Invalid payment signature", StatusCode.BAD_REQUEST);
      }

      // Verify payment with Razorpay
      try {
        const razorpayPayment = await this.razorpay.payments.fetch(razorpayPaymentId);
        
        if (razorpayPayment.status !== 'captured' && razorpayPayment.status !== 'authorized') {
          await this._paymentRepository.updateStatus(payment._id.toString(), 'failed');
          throw new CustomError("Payment not successful on Razorpay", StatusCode.BAD_REQUEST);
        }
      } catch (razorpayError:unknown) {
        logger.error("Error fetching payment from Razorpay:", razorpayError);
        // Don't fail if we can't fetch from Razorpay, signature verification is sufficient
      }

      // Update payment as successful
      const updatedPayment = await this._paymentRepository.updateStatus(
        payment._id.toString(),
        'success',
        {
          razorpayPaymentId,
          razorpaySignature
        }
      );

      logger.info(`Payment verified successfully: ${razorpayPaymentId}`);
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
      throw new CustomError("Failed to get user payments", StatusCode.INTERNAL_SERVER_ERROR);
    }
  }
}