import { injectable, inject } from "inversify";
import { TYPES } from "../../core/types/types";
import { ICommunityAdminSubscriptionService } from "../../core/interfaces/services/communityAdmin/ICommunityAdminSubscriptionService";
import { ICommunitySubscriptionRepository } from "../../core/interfaces/repositories/communityAdmin/ICommunityAdminSubscription.repository";
import { ICommunityAdminRepository } from "../../core/interfaces/repositories/ICommunityAdminRepository";
import { CustomError } from "../../utils/customError";
import { StatusCode } from "../../enums/statusCode.enum";
import { CreateSubscriptionDto, SubscriptionResponseDto, RazorpayOrderResponseDto } from "../../dtos/communityAdmin/CommunityAdminSubscription.dto";
import Razorpay from "razorpay";
import logger from "../../utils/logger";

@injectable()
export class CommunityAdminSubscriptionService implements ICommunityAdminSubscriptionService {
  private razorpay: Razorpay;

  constructor(
    @inject(TYPES.ICommunitySubscriptionRepository) private _subscriptionRepository: ICommunitySubscriptionRepository,
    @inject(TYPES.ICommunityAdminRepository) private _adminRepository: ICommunityAdminRepository
  ) {
    this.razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID || "rzp_test_your_key_id",
      key_secret: process.env.RAZORPAY_KEY_SECRET || "your_key_secret",
    });
  }

  async createOrder(communityAdminId: string, createDto: CreateSubscriptionDto): Promise<RazorpayOrderResponseDto> {
    try {
      const admin = await this._adminRepository.findById(communityAdminId);
      if (!admin || !admin.communityId) {
        throw new CustomError("Community admin or community not found", StatusCode.NOT_FOUND);
      }

      const subscription = await this._subscriptionRepository.findByCommunityId(createDto.communityId);
      if (subscription && subscription.status === "active") {
        throw new CustomError("Community already has an active subscription", StatusCode.BAD_REQUEST);
      }

      if (subscription && subscription.status === "pending") {
        await this._subscriptionRepository.updateSubscription(subscription._id!.toString(), { status: "inactive" });
      }

      const newSubscription = await this._subscriptionRepository.createSubscription(createDto.communityId);

      const order = await this.razorpay.orders.create({
        amount: 89900, // ₹899 in paise
        currency: "INR",
        receipt: `sub_${newSubscription._id}`,
      });

      await this._subscriptionRepository.updateSubscription(newSubscription._id!.toString(), { orderId: order.id });

      return {
        orderId: order.id,
        amount: order.amount,
        currency: order.currency,
      };
    } catch (error) {
      logger.error("Create subscription order error:", error);
      throw error instanceof CustomError ? error : new CustomError("Failed to create subscription order", StatusCode.INTERNAL_SERVER_ERROR);
    }
  }

  async verifyPayment(communityAdminId: string, paymentData: {
    razorpay_payment_id: string;
    razorpay_order_id: string;
    razorpay_signature: string;
  }): Promise<SubscriptionResponseDto> {
    try {
      const admin = await this._adminRepository.findById(communityAdminId);
      if (!admin || !admin.communityId) {
        throw new CustomError("Community admin or community not found", StatusCode.NOT_FOUND);
      }

      const subscription = await this._subscriptionRepository.findByCommunityId(admin.communityId.toString());
      if (!subscription || subscription.orderId !== paymentData.razorpay_order_id) {
        throw new CustomError("Invalid order or subscription not found", StatusCode.BAD_REQUEST);
      }

      // Verify Razorpay signature
      const crypto = await import("crypto");
      const generatedSignature = crypto
        .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET || "your_key_secret")
        .update(`${paymentData.razorpay_order_id}|${paymentData.razorpay_payment_id}`)
        .digest("hex");

      if (generatedSignature !== paymentData.razorpay_signature) {
        throw new CustomError("Invalid payment signature", StatusCode.BAD_REQUEST);
      }

      const updatedSubscription = await this._subscriptionRepository.activateSubscription(
        admin.communityId.toString(),
        paymentData.razorpay_payment_id,
        paymentData.razorpay_order_id
      );

      if (!updatedSubscription) {
        throw new CustomError("Failed to activate subscription", StatusCode.INTERNAL_SERVER_ERROR);
      }

      return new SubscriptionResponseDto(updatedSubscription);
    } catch (error) {
      logger.error("Verify payment error:", error);
      throw error instanceof CustomError ? error : new CustomError("Failed to verify payment", StatusCode.INTERNAL_SERVER_ERROR);
    }
  }

  async getSubscription(communityAdminId: string): Promise<SubscriptionResponseDto> {
    try {
      const admin = await this._adminRepository.findById(communityAdminId);
      if (!admin || !admin.communityId) {
        throw new CustomError("Community admin or community not found", StatusCode.NOT_FOUND);
      }

      const subscription = await this._subscriptionRepository.findByCommunityId(admin.communityId.toString());
      if (!subscription) {
        throw new CustomError("Subscription not found", StatusCode.NOT_FOUND);
      }

      return new SubscriptionResponseDto(subscription);
    } catch (error) {
      logger.error("Get subscription error:", error);
      throw error instanceof CustomError ? error : new CustomError("Failed to fetch subscription", StatusCode.INTERNAL_SERVER_ERROR);
    }
  }
}