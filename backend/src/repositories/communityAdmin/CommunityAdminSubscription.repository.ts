import { injectable } from "inversify";
import { ICommunitySubscriptionRepository } from "../../core/interfaces/repositories/communityAdmin/ICommunityAdminSubscription.repository";
import CommunitySubscriptionModel, { ICommunitySubscription } from "../../models/communitySubscription.model";
import CommunityModel from "../../models/community.model";
import { StatusCode } from "../../enums/statusCode.enum";
import { CustomError } from "../../utils/customError";

@injectable()
export class CommunitySubscriptionRepository implements ICommunitySubscriptionRepository {
  async createSubscription(communityId: string): Promise<ICommunitySubscription> {
    const existingSubscription = await CommunitySubscriptionModel.findOne({ communityId });
    if (existingSubscription) {
      throw new CustomError("Subscription already exists for this community", StatusCode.BAD_REQUEST);
    }
    const subscription = new CommunitySubscriptionModel({
      communityId,
      plan: "lifetime",
      status: "pending",
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

  async activateSubscription(communityId: string, paymentId: string, orderId: string): Promise<ICommunitySubscription | null> {
    const subscription = await CommunitySubscriptionModel.findOneAndUpdate(
      { communityId, status: "pending" },
      { status: "active", paymentId, orderId, updatedAt: new Date() },
      { new: true }
    );
    if (subscription) {
      await CommunityModel.findByIdAndUpdate(communityId, {
        isVerified: true,
        subscriptionId: subscription._id,
        settings: {
          allowChainCast: true,
          allowGroupChat: true,
          allowPosts: true,
          allowQuests: true,
        },
      });
    }
    return subscription;
  }
}