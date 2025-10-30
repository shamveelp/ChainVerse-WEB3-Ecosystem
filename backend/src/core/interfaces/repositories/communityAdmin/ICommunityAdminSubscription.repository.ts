import { ICommunitySubscription } from "../../../../models/communitySubscription.model";

export interface ICommunitySubscriptionRepository {
  createSubscription(communityId: string): Promise<ICommunitySubscription>;
  createSubscriptionWithExpiry(communityId: string, expiresAt: Date): Promise<ICommunitySubscription>;
  updateSubscription(subscriptionId: string, updateData: Partial<ICommunitySubscription>): Promise<ICommunitySubscription | null>;
  findByCommunityId(communityId: string): Promise<ICommunitySubscription | null>;
  deleteSubscription(subscriptionId: string): Promise<boolean>;
  activateSubscription(communityId: string, paymentId: string, orderId: string): Promise<ICommunitySubscription | null>;
  cleanupExpiredSubscriptions(): Promise<number>;
}