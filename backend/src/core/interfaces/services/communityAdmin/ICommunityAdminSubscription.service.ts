import { RazorpayOrderResponseDto, SubscriptionResponseDto, CreateSubscriptionDto } from "../../../../dtos/communityAdmin/CommunityAdminSubscription.dto";

export interface ICommunityAdminSubscriptionService {
  createOrder(communityAdminId: string, createDto: CreateSubscriptionDto): Promise<RazorpayOrderResponseDto>;
  verifyPayment(communityAdminId: string, paymentData: {
    razorpay_payment_id: string;
    razorpay_order_id: string;
    razorpay_signature: string;
  }): Promise<SubscriptionResponseDto>;
  getSubscription(communityAdminId: string): Promise<SubscriptionResponseDto | null>;
  retryPayment(communityAdminId: string): Promise<RazorpayOrderResponseDto>;
  getTimeRemaining(communityAdminId: string): Promise<{ minutes: number; seconds: number } | null>;
}