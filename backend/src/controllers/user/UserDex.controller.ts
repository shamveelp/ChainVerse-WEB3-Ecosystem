import { inject, injectable } from "inversify";
import { Request, Response } from "express";
import { TYPES } from "../../core/types/types";
import { IUserDexController } from "../../core/interfaces/controllers/user/IUserDex.controller";
import { IUserDexService } from "../../core/interfaces/services/user/IUserDexService";
import { StatusCode } from "../../enums/statusCode.enum";
import logger from "../../utils/logger";
import { CustomError } from "../../utils/customError";
import { 
  CreatePaymentDto, 
  VerifyPaymentDto, 
  GetPaymentsDto,
  PaymentResponseDto 
} from "../../dtos/payment/Payment.dto";

@injectable()
export class UserDexController implements IUserDexController {
  constructor(
    @inject(TYPES.IUserDexService) private _userDexService: IUserDexService
  ) {}

  createPaymentOrder = async (req: Request, res: Response) => {
    try {
      logger.info("Creating payment order ithanne");
      const createPaymentDto = req.body as CreatePaymentDto;
      const userId = (req as any).user.id;
      
      const { walletAddress, currency, amountInCurrency, estimatedEth, ethPriceAtTime } = createPaymentDto;
      
      const { order, payment } = await this._userDexService.createPaymentOrder(
        userId,
        walletAddress,
        currency,
        amountInCurrency,
        estimatedEth,
        ethPriceAtTime
      );
      
      const response = new PaymentResponseDto("Payment order created successfully", {
        orderId: order.id,
        amount: order.amount,
        currency: order.currency,
        paymentId: payment._id
      });
      
      res.status(StatusCode.CREATED).json(response);
    } catch (error) {
      logger.error("Error creating payment order:", error);
      const errorMessage = error instanceof CustomError ? error.message : "Failed to create payment order";
      const statusCode = error instanceof CustomError ? error.statusCode : StatusCode.BAD_REQUEST;
      
      res.status(statusCode).json({ 
        success: false,
        error: errorMessage 
      });
    }
  };

  verifyPayment = async (req: Request, res: Response) => {
    try {
      const verifyPaymentDto = req.body as VerifyPaymentDto;
      const userId = (req as any).user.id;
      
      const { razorpayOrderId, razorpayPaymentId, razorpaySignature } = verifyPaymentDto;
      
      const payment = await this._userDexService.verifyPayment(
        userId,
        razorpayOrderId,
        razorpayPaymentId,
        razorpaySignature
      );
      
      const response = new PaymentResponseDto("Payment verified successfully", {
        paymentId: payment._id,
        status: payment.status,
        actualEthToSend: payment.actualEthToSend
      });
      
      res.status(StatusCode.OK).json(response);
    } catch (error) {
      logger.error("Error verifying payment:", error);
      const errorMessage = error instanceof CustomError ? error.message : "Payment verification failed";
      const statusCode = error instanceof CustomError ? error.statusCode : StatusCode.BAD_REQUEST;
      
      res.status(statusCode).json({ 
        success: false,
        error: errorMessage 
      });
    }
  };

  getUserPayments = async (req: Request, res: Response) => {
    try {
      const { page = 1, limit = 10 } = req.query as any;
      const userId = (req as any).user.id;
      
      const payments = await this._userDexService.getUserPayments(
        userId,
        parseInt(page),
        parseInt(limit)
      );
      
      const response = new PaymentResponseDto("Payments retrieved successfully", payments);
      res.status(StatusCode.OK).json(response);
    } catch (error) {
      logger.error("Error getting user payments:", error);
      res.status(StatusCode.BAD_REQUEST).json({ 
        success: false,
        error: "Failed to retrieve payments" 
      });
    }
  };

  getEthPrice = async (req: Request, res: Response) => {
    try {
      console.log("Hello")
      const ethPrice = await this._userDexService.getEthPrice();
      
      const response = new PaymentResponseDto("ETH price retrieved successfully", {
        price: ethPrice,
        currency: 'INR'
      });
      
      res.status(StatusCode.OK).json(response);
    } catch (error) {
      logger.error("Error getting ETH price:", error);
      res.status(StatusCode.BAD_REQUEST).json({ 
        success: false,
        error: "Failed to get ETH price" 
      });
    }
  };

  calculateEstimate = async (req: Request, res: Response) => {
    try {
      const { amount, currency = 'INR' } = req.body;
      
      if (!amount || amount <= 0) {
        res.status(StatusCode.BAD_REQUEST).json({
          success: false,
          error: "Invalid amount"
        });
        return;
      }

      const ethPrice = await this._userDexService.getEthPrice();
      const estimatedEth = amount / ethPrice;
      const fees = this._userDexService.calculateFees(estimatedEth);
      
      const response = new PaymentResponseDto("Estimate calculated successfully", {
        amountInCurrency: amount,
        currency,
        estimatedEth,
        ethPrice,
        platformFee: fees.platformFee,
        totalFeePercentage: fees.totalFeePercentage,
        actualEthToReceive: fees.actualEthAmount,
        feeBreakdown: {
          platformFeePercentage: 5,
          otherFeesPercentage: 15,
          totalFeePercentage: 20
        }
      });
      
      res.status(StatusCode.OK).json(response);
    } catch (error) {
      logger.error("Error calculating estimate:", error);
      res.status(StatusCode.BAD_REQUEST).json({ 
        success: false,
        error: "Failed to calculate estimate" 
      });
    }
  };
}