import { injectable, inject } from "inversify";
import { TYPES } from "../../core/types/types";
import { ICommunityAdminSubscriptionService } from "../../core/interfaces/services/communityAdmin/ICommunityAdminSubscription.service";
import { ICommunitySubscriptionRepository } from "../../core/interfaces/repositories/communityAdmin/ICommunityAdminSubscription.repository";
import { ICommunityAdminRepository } from "../../core/interfaces/repositories/ICommunityAdminRepository";
import { ICommunityRepository } from "../../core/interfaces/repositories/ICommunity.repository";
import { CustomError } from "../../utils/customError";
import { StatusCode } from "../../enums/statusCode.enum";
import { ErrorMessages, SuccessMessages, LoggerMessages } from "../../enums/messages.enum";
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

  /**
   * Creates a new subscription order for a community.
   * @param {string} communityAdminId - Community Admin ID.
   * @param {CreateSubscriptionDto} createDto - Subscription creation data.
   * @returns {Promise<RazorpayOrderResponseDto>} Razorpay order details.
   */
  async createOrder(communityAdminId: string, createDto: CreateSubscriptionDto): Promise<RazorpayOrderResponseDto> {
    try {
      const admin = await this._adminRepository.findById(communityAdminId);
      if (!admin || !admin.communityId) {
        throw new CustomError(ErrorMessages.COMMUNITY_ADMIN_NOT_FOUND, StatusCode.NOT_FOUND);
      }

      const community = await this._communityRepository.findById(admin.communityId.toString());
      if (!community) {
        throw new CustomError(ErrorMessages.COMMUNITY_NOT_FOUND, StatusCode.NOT_FOUND);
      }

      // Check if community already has ChainCast enabled
      if (community.settings?.allowChainCast) {
        throw new CustomError(ErrorMessages.CHAINCAST_ALREADY_ENABLED, StatusCode.BAD_REQUEST);
      }

      let subscription = await this._subscriptionRepository.findByCommunityId(createDto.communityId);

      // If active subscription exists, don't allow new order
      if (subscription && subscription.status === "active") {
        throw new CustomError(ErrorMessages.ACTIVE_SUBSCRIPTION_EXISTS, StatusCode.BAD_REQUEST);
      }

      // Clean up existing expired or failed orders
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
      logger.error(LoggerMessages.CREATE_PAYMENT_ORDER_ERROR, error);
      throw error instanceof CustomError ? error : new CustomError(ErrorMessages.FAILED_CREATE_SUBSCRIPTION_ORDER, StatusCode.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Verifies payment signature and activates subscription.
   * @param {string} communityAdminId - Community Admin ID.
   * @param {object} paymentData - Razorpay payment data.
   * @returns {Promise<SubscriptionResponseDto>} Activated subscription DTO.
   */
  async verifyPayment(communityAdminId: string, paymentData: {
    razorpay_payment_id: string;
    razorpay_order_id: string;
    razorpay_signature: string;
  }): Promise<SubscriptionResponseDto> {
    try {
      const admin = await this._adminRepository.findById(communityAdminId);
      if (!admin || !admin.communityId) {
        throw new CustomError(ErrorMessages.COMMUNITY_ADMIN_NOT_FOUND, StatusCode.NOT_FOUND);
      }

      const subscription = await this._subscriptionRepository.findByCommunityId(admin.communityId.toString());
      if (!subscription || subscription.orderId !== paymentData.razorpay_order_id) {
        throw new CustomError(ErrorMessages.INVALID_ORDER_OR_SUBSCRIPTION, StatusCode.BAD_REQUEST);
      }

      // Check if order has expired
      if (subscription.expiresAt && new Date() > subscription.expiresAt) {
        await this._subscriptionRepository.updateSubscription(subscription._id!.toString(), {
          status: "expired"
        });
        throw new CustomError(ErrorMessages.PAYMENT_WINDOW_EXPIRED, StatusCode.BAD_REQUEST);
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
        throw new CustomError(ErrorMessages.INVALID_PAYMENT_SIGNATURE, StatusCode.BAD_REQUEST);
      }

      // Activate subscription and enable ChainCast
      const updatedSubscription = await this._subscriptionRepository.activateSubscription(
        admin.communityId.toString(),
        paymentData.razorpay_payment_id,
        paymentData.razorpay_order_id
      );

      if (!updatedSubscription) {
        throw new CustomError(ErrorMessages.FAILED_ACTIVATE_SUBSCRIPTION, StatusCode.INTERNAL_SERVER_ERROR);
      }

      // Enable ChainCast for the community
      await this._communityRepository.updateCommunity(admin.communityId.toString(), {
        isVerified: true,
        subscriptionId: updatedSubscription._id as mongoose.Types.ObjectId,
        settings: { allowChainCast: true }
      });

      logger.info(`ChainCast enabled for community ${admin.communityId} after successful payment`);

      return new SubscriptionResponseDto(updatedSubscription);
    } catch (error) {
      logger.error(LoggerMessages.VERIFY_PAYMENT_ERROR, error);
      throw error instanceof CustomError ? error : new CustomError(ErrorMessages.FAILED_VERIFY_PAYMENT, StatusCode.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Retrieves the current subscription.
   * @param {string} communityAdminId - Community Admin ID.
   * @returns {Promise<SubscriptionResponseDto | null>} Subscription DTO or null.
   */
  async getSubscription(communityAdminId: string): Promise<SubscriptionResponseDto | null> {
    try {
      const admin = await this._adminRepository.findById(communityAdminId);
      if (!admin || !admin.communityId) {
        throw new CustomError(ErrorMessages.COMMUNITY_ADMIN_NOT_FOUND, StatusCode.NOT_FOUND);
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
          return new SubscriptionResponseDto({ ...subscription, status: 'expired' });
        }
      }

      return new SubscriptionResponseDto(subscription);
    } catch (error) {
      logger.error(LoggerMessages.GET_SUBSCRIPTION_ERROR, error);
      throw error instanceof CustomError ? error : new CustomError(ErrorMessages.FAILED_GET_SUBSCRIPTION, StatusCode.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Retries a failed or pending payment.
   * @param {string} communityAdminId - Community Admin ID.
   * @returns {Promise<RazorpayOrderResponseDto>} New order details for retry.
   */
  async retryPayment(communityAdminId: string): Promise<RazorpayOrderResponseDto> {
    try {
      const admin = await this._adminRepository.findById(communityAdminId);
      if (!admin || !admin.communityId) {
        throw new CustomError(ErrorMessages.COMMUNITY_ADMIN_NOT_FOUND, StatusCode.NOT_FOUND);
      }

      const subscription = await this._subscriptionRepository.findByCommunityId(admin.communityId.toString());
      if (!subscription || !['pending', 'failed'].includes(subscription.status)) {
        throw new CustomError(ErrorMessages.NO_RETRYABLE_SUBSCRIPTION, StatusCode.BAD_REQUEST);
      }

      // Check if still within retry window
      if (subscription.expiresAt && new Date() > subscription.expiresAt) {
        await this._subscriptionRepository.updateSubscription(subscription._id!.toString(), {
          status: "expired"
        });
        throw new CustomError(ErrorMessages.RETRY_WINDOW_EXPIRED, StatusCode.BAD_REQUEST);
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
      logger.error(LoggerMessages.RETRY_PAYMENT_ERROR, error);
      throw error instanceof CustomError ? error : new CustomError(ErrorMessages.FAILED_RETRY_PAYMENT, StatusCode.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Gets time remaining for a pending subscription payment.
   * @param {string} communityAdminId - Community Admin ID.
   * @returns {Promise<{ minutes: number; seconds: number } | null>} Time remaining.
   */
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
      logger.error(LoggerMessages.GET_TIME_REMAINING_ERROR, error);
      return null;
    }
  }
}