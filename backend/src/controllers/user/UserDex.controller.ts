import { inject, injectable } from "inversify";
import { Request, Response } from "express";
import { TYPES } from "../../core/types/types";
import { IUserDexController } from "../../core/interfaces/controllers/user/IUserDex.controller";
import { IUserDexService } from "../../core/interfaces/services/user/IUserDexService";
import { StatusCode } from "../../enums/statusCode.enum";
import logger from "../../utils/logger";
import { CustomError } from "../../utils/customError";
import { PaymentResponseDto } from "../../dtos/payment/Payment.dto";

@injectable()
export class UserDexController implements IUserDexController {
  constructor(
    @inject(TYPES.IUserDexService) private _userDexService: IUserDexService
  ) {}

  getEthPrice = async (req: Request, res: Response) => {
    try {
      const price = await this._userDexService.getEthPrice();
      
      const response = new PaymentResponseDto("ETH price retrieved successfully", { price });
      res.status(StatusCode.OK).json(response);
    } catch (error) {
      logger.error("Error getting ETH price:", error);
      const errorMessage = error instanceof CustomError ? error.message : "Failed to get ETH price";
      const statusCode = error instanceof CustomError ? error.statusCode : StatusCode.BAD_REQUEST;

      res.status(statusCode).json({
        success: false,
        error: errorMessage
      });
    }
  };

  calculateEstimate = async (req: Request, res: Response) => {
    try {
      const { amount, currency } = req.body;

      if (!amount || amount < 100) {
        res.status(StatusCode.BAD_REQUEST).json({
          success: false,
          error: "Amount must be at least 100"
        });
        return;
      }

      const estimate = await this._userDexService.calculateEstimate(amount, currency);

      const response = new PaymentResponseDto("Estimate calculated successfully", estimate);
      res.status(StatusCode.OK).json(response);
    } catch (error) {
      logger.error("Error calculating estimate:", error);
      const errorMessage = error instanceof CustomError ? error.message : "Failed to calculate estimate";
      const statusCode = error instanceof CustomError ? error.statusCode : StatusCode.BAD_REQUEST;

      res.status(statusCode).json({
        success: false,
        error: errorMessage
      });
    }
  };

  createPaymentOrder = async (req: Request, res: Response) => {
    try {
      const { walletAddress, currency, amountInCurrency, estimatedEth, ethPriceAtTime } = req.body;
      const userId = (req as any).user.id;

      if (!walletAddress || !currency || !amountInCurrency || !estimatedEth || !ethPriceAtTime) {
        res.status(StatusCode.BAD_REQUEST).json({
          success: false,
          error: "All fields are required"
        });
        return;
      }

      if (amountInCurrency < 100) {
        res.status(StatusCode.BAD_REQUEST).json({
          success: false,
          error: "Minimum amount is 100 INR"
        });
        return;
      }

      const order = await this._userDexService.createPaymentOrder(
        userId,
        walletAddress,
        currency,
        amountInCurrency,
        estimatedEth,
        ethPriceAtTime
      );

      const response = new PaymentResponseDto("Payment order created successfully", order);
      res.status(StatusCode.OK).json(response);
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
      const { razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body;

      if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
        res.status(StatusCode.BAD_REQUEST).json({
          success: false,
          error: "All payment details are required"
        });
        return;
      }

      const payment = await this._userDexService.verifyPayment(
        razorpayOrderId,
        razorpayPaymentId,
        razorpaySignature
      );

      const response = new PaymentResponseDto("Payment verified successfully", payment);
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

      const response = new PaymentResponseDto("User payments retrieved successfully", payments);
      res.status(StatusCode.OK).json(response);
    } catch (error) {
      logger.error("Error getting user payments:", error);
      const errorMessage = error instanceof CustomError ? error.message : "Failed to get user payments";
      const statusCode = error instanceof CustomError ? error.statusCode : StatusCode.BAD_REQUEST;

      res.status(statusCode).json({
        success: false,
        error: errorMessage
      });
    }
  };
}