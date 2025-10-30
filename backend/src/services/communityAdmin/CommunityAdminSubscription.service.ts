import { injectable, inject } from "inversify";
import { TYPES } from "../../core/types/types";
import { ICommunityAdminSubscriptionService } from "../../core/interfaces/services/communityAdmin/ICommunityAdminSubscriptionService";
import { ICommunitySubscriptionRepository } from "../../core/interfaces/repositories/communityAdmin/ICommunityAdminSubscription.repository";
import { ICommunityAdminRepository } from "../../core/interfaces/repositories/ICommunityAdminRepository";
import { ICommunityRepository } from "../../core/interfaces/repositories/ICommunityRepository";
import { CustomError } from "../../utils/customError";
import { StatusCode } from "../../enums/statusCode.enum";
import { CreateSubscriptionDto, SubscriptionResponseDto, RazorpayOrderResponseDto } from "../../dtos/communityAdmin/CommunityAdminSubscription.dto";     
import Razorpay from "razorpay";
import logger from "../../utils/logger";
import mongoose from "mongoose";

@injectable()
export class CommunityAdminSubscriptionService implements ICommunityAdminSubscriptionService {
  private razorpay: Razorpay;

  constructor(
    @inject(TYPES.ICommunitySubscriptionRepository) private _subscriptionRepository: ICommunitySubscriptionRepository,
    @inject(TYPES.ICommunityAdminRepository) private _adminRepository: ICommunityAdminRepository,
    @inject(TYPES.ICommunityRepository) private _communityRepository: ICommunityRepository
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

      const community = await this._communityRepository.findById(admin.communityId.toString());
      if (!community) {
        throw new CustomError("Community not found", StatusCode.NOT_FOUND);
      }

      // Check if community already has ChainCast enabled
      if (community.settings?.allowChainCast) {
        throw new CustomError("Community already has ChainCast enabled", StatusCode.BAD_REQUEST);
      }

      let subscription = await this._subscriptionRepository.findByCommunityId(createDto.communityId);
      
      // If active subscription exists, don't allow new order
      if (subscription && subscription.status === "active") {
        throw new CustomError("Community already has an active subscription", StatusCode.BAD_REQUEST);
      }

      // Clean up any existing expired or failed orders
      if (subscription && ['pending', 'failed', 'expired'].includes(subscription.status)) {
        await this._subscriptionRepository.deleteSubscription(subscription._id!.toString());
      }

      // Create new subscription order with 10-minute expiration
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now
      const newSubscription = await this._subscriptionRepository.createSubscriptionWithExpiry(
        createDto.communityId, 
        expiresAt
      );

      const order = await this.razorpay.orders.create({
        amount: 89900, // ₹899 in paise
        currency: "INR",
        receipt: `sub_${newSubscription._id}`,
        notes: {
          communityId: createDto.communityId,
          subscriptionId: newSubscription._id!.toString()
        }
      });

      await this._subscriptionRepository.updateSubscription(newSubscription._id!.toString(), { 
        orderId: order.id 
      });

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

      // Check if order has expired
      if (subscription.expiresAt && new Date() > subscription.expiresAt) {
        await this._subscriptionRepository.updateSubscription(subscription._id!.toString(), { 
          status: "expired" 
        });
        throw new CustomError("Payment window has expired. Please create a new order", StatusCode.BAD_REQUEST);
      }

      // Verify Razorpay signature
      const crypto = await import("crypto");
      const generatedSignature = crypto
        .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET || "your_key_secret")
        .update(`${paymentData.razorpay_order_id}|${paymentData.razorpay_payment_id}`)
        .digest("hex");

      if (generatedSignature !== paymentData.razorpay_signature) {
        // Mark payment as failed but keep the order active for retry
        await this._subscriptionRepository.updateSubscription(subscription._id!.toString(), {
          status: "failed",
          failedAt: new Date(),
          retryCount: (subscription.retryCount || 0) + 1
        });
        throw new CustomError("Invalid payment signature", StatusCode.BAD_REQUEST);
      }

      // Activate subscription and enable ChainCast
      const updatedSubscription = await this._subscriptionRepository.activateSubscription(
        admin.communityId.toString(),
        paymentData.razorpay_payment_id,
        paymentData.razorpay_order_id
      );

      if (!updatedSubscription) {
        throw new CustomError("Failed to activate subscription", StatusCode.INTERNAL_SERVER_ERROR);
      }

      // Enable ChainCast for the community
      await this._communityRepository.updateCommunity(admin.communityId.toString(), {
        isVerified: true,
        subscriptionId: updatedSubscription._id as  mongoose.Types.ObjectId,
        settings: { allowChainCast: true } as any
      });

      logger.info(`ChainCast enabled for community ${admin.communityId} after successful payment`);

      return new SubscriptionResponseDto(updatedSubscription);
    } catch (error) {
      logger.error("Verify payment error:", error);
      throw error instanceof CustomError ? error : new CustomError("Failed to verify payment", StatusCode.INTERNAL_SERVER_ERROR);
    }
  }

  async getSubscription(communityAdminId: string): Promise<SubscriptionResponseDto | null> {
    try {
      const admin = await this._adminRepository.findById(communityAdminId);
      if (!admin || !admin.communityId) {
        throw new CustomError("Community admin or community not found", StatusCode.NOT_FOUND);
      }

      const subscription = await this._subscriptionRepository.findByCommunityId(admin.communityId.toString());
      if (!subscription) {
        return null; // No subscription found, return null instead of throwing error
      }

      // Check if pending/failed order has expired
      if (subscription.status === 'pending' || subscription.status === 'failed') {
        if (subscription.expiresAt && new Date() > subscription.expiresAt) {
          await this._subscriptionRepository.updateSubscription(subscription._id!.toString(), { 
            status: "expired" 
          });
          return new SubscriptionResponseDto({...subscription, status: 'expired'});
        }
      }

      return new SubscriptionResponseDto(subscription);
    } catch (error) {
      logger.error("Get subscription error:", error);
      throw error instanceof CustomError ? error : new CustomError("Failed to fetch subscription", StatusCode.INTERNAL_SERVER_ERROR);
    }
  }

  async retryPayment(communityAdminId: string): Promise<RazorpayOrderResponseDto> {
    try {
      const admin = await this._adminRepository.findById(communityAdminId);
      if (!admin || !admin.communityId) {
        throw new CustomError("Community admin or community not found", StatusCode.NOT_FOUND);
      }

      const subscription = await this._subscriptionRepository.findByCommunityId(admin.communityId.toString());
      if (!subscription || !['pending', 'failed'].includes(subscription.status)) {
        throw new CustomError("No retryable subscription found", StatusCode.BAD_REQUEST);
      }

      // Check if still within retry window
      if (subscription.expiresAt && new Date() > subscription.expiresAt) {
        await this._subscriptionRepository.updateSubscription(subscription._id!.toString(), { 
          status: "expired" 
        });
        throw new CustomError("Retry window has expired. Please create a new subscription", StatusCode.BAD_REQUEST);
      }

      // Update retry count
      await this._subscriptionRepository.updateSubscription(subscription._id!.toString(), {
        retryCount: (subscription.retryCount || 0) + 1,
        status: 'pending' // Reset to pending for retry
      });

      return {
        orderId: subscription.orderId!,
        amount: 89900,
        currency: "INR",
      };
    } catch (error) {
      logger.error("Retry payment error:", error);
      throw error instanceof CustomError ? error : new CustomError("Failed to retry payment", StatusCode.INTERNAL_SERVER_ERROR);
    }
  }

  async getTimeRemaining(communityAdminId: string): Promise<{ minutes: number; seconds: number } | null> {
    try {
      const admin = await this._adminRepository.findById(communityAdminId);
      if (!admin || !admin.communityId) {
        return null;
      }

      const subscription = await this._subscriptionRepository.findByCommunityId(admin.communityId.toString());
      if (!subscription || !['pending', 'failed'].includes(subscription.status) || !subscription.expiresAt) {
        return null;
      }

      const now = new Date();
      const expiresAt = new Date(subscription.expiresAt);
      
      if (now >= expiresAt) {
        return { minutes: 0, seconds: 0 };
      }

      const diffMs = expiresAt.getTime() - now.getTime();
      const minutes = Math.floor(diffMs / 60000);
      const seconds = Math.floor((diffMs % 60000) / 1000);

      return { minutes, seconds };
    } catch (error) {
      logger.error("Get time remaining error:", error);
      return null;
    }
  }
}