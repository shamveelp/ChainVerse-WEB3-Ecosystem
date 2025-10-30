import { injectable } from "inversify";
import { ICommunitySubscriptionRepository } from "../../core/interfaces/repositories/communityAdmin/ICommunityAdminSubscription.repository";
import CommunitySubscriptionModel, { ICommunitySubscription } from "../../models/communitySubscription.model";
import CommunityModel from "../../models/community.model";
import { StatusCode } from "../../enums/statusCode.enum";
import { CustomError } from "../../utils/customError";

@injectable()
export class CommunitySubscriptionRepository implements ICommunitySubscriptionRepository {
  async createSubscription(communityId: string): Promise<ICommunitySubscription> {
    const subscription = new CommunitySubscriptionModel({
      communityId,
      plan: "lifetime",
      status: "pending",
    });
    return await subscription.save();
  }

  async createSubscriptionWithExpiry(communityId: string, expiresAt: Date): Promise<ICommunitySubscription> {
    const subscription = new CommunitySubscriptionModel({
      communityId,
      plan: "lifetime",
      status: "pending",
      expiresAt,
      retryCount: 0
    });
    return await subscription.save();
  }

  async updateSubscription(subscriptionId: string, updateData: Partial<ICommunitySubscription>): Promise<ICommunitySubscription | null> {
    return await CommunitySubscriptionModel.findByIdAndUpdate(
      subscriptionId,
      { ...updateData, updatedAt: new Date() },
      { new: true }
    );
  }

  async findByCommunityId(communityId: string): Promise<ICommunitySubscription | null> {
    return await CommunitySubscriptionModel.findOne({ communityId }).lean();
  }

  async deleteSubscription(subscriptionId: string): Promise<boolean> {
    const result = await CommunitySubscriptionModel.findByIdAndDelete(subscriptionId);
    return !!result;
  }

  async activateSubscription(communityId: string, paymentId: string, orderId: string): Promise<ICommunitySubscription | null> {
    const subscription = await CommunitySubscriptionModel.findOneAndUpdate(
      { communityId, orderId },
      { 
        status: "active", 
        paymentId, 
        updatedAt: new Date(),
        expiresAt: undefined, // Remove expiration once activated
        failedAt: undefined   // Clear failed timestamp
      },
      { new: true }
    );

    if (subscription) {
      // Enable ChainCast and other premium features
      await CommunityModel.findByIdAndUpdate(communityId, {
        isVerified: true,
        subscriptionId: subscription._id,
        'settings.allowChainCast': true,
        'settings.allowQuests': true,
      });
    }
    return subscription;
  }

  async cleanupExpiredSubscriptions(): Promise<number> {
    const result = await CommunitySubscriptionModel.deleteMany({
      status: { $in: ['pending', 'failed'] },
      expiresAt: { $lt: new Date() }
    });
    return result.deletedCount || 0;
  }
}