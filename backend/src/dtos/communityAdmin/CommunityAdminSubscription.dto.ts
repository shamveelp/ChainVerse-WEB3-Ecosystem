import { IsString } from "class-validator";
import { BaseResponseDto } from "../base/BaseResponse.dto";

export class CreateSubscriptionDto {
  @IsString()
  communityId!: string;
}

export class SubscriptionResponseDto extends BaseResponseDto {
  communityId: string;
  plan: "lifetime";
  status: "active" | "inactive" | "pending" | "failed" | "expired";
  paymentId?: string;
  orderId?: string;
  expiresAt?: Date;
  failedAt?: Date;
  retryCount?: number;
  timeRemaining?: {
    minutes: number;
    seconds: number;
  };
  createdAt: Date;
  updatedAt: Date;

  constructor(subscription: any) {
    super(true, "Subscription retrieved successfully");
    this.communityId = subscription.communityId.toString();
    this.plan = subscription.plan;
    this.status = subscription.status;
    this.paymentId = subscription.paymentId;
    this.orderId = subscription.orderId;
    this.expiresAt = subscription.expiresAt;
    this.failedAt = subscription.failedAt;
    this.retryCount = subscription.retryCount;
    this.createdAt = subscription.createdAt;
    this.updatedAt = subscription.updatedAt;
  }
}

export class RazorpayOrderResponseDto {
  orderId!: string;
  amount: string | number | undefined;
  currency!: string;
}