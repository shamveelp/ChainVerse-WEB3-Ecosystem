export interface Subscription {
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
}

export interface RazorpayOrder {
    orderId: string;
    amount: number;
    currency: string;
}

export interface VerifyPaymentData {
    razorpay_payment_id: string;
    razorpay_order_id: string;
    razorpay_signature: string;
}
