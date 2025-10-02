export class PaymentResponseDto {
  success: boolean;
  message: string;
  data?: any;

  constructor(message: string, data?: any) {
    this.success = true;
    this.message = message;
    this.data = data;
  }
}

export class CreatePaymentOrderDto {
  walletAddress!: string;
  currency!: string;
  amountInCurrency!: number;
  estimatedEth!: number;
  ethPriceAtTime!: number;
}

export class VerifyPaymentDto {
  razorpayOrderId!: string;
  razorpayPaymentId!: string;
  razorpaySignature!: string;
}

export class CalculateEstimateDto {
  amount!: number;
  currency?: string;
}

export class FulfillPaymentDto {
  paymentId!: string;
  transactionHash!: string;
  adminNote?: string;
}

export class RejectPaymentDto {
  paymentId!: string;
  reason!: string;
}