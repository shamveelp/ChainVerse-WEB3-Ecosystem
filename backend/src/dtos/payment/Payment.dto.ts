import { IsString, IsNumber, IsEnum, IsOptional, Min, Max } from 'class-validator';

export class CreatePaymentDto {
  @IsString()
  walletAddress!: string;

  @IsEnum(['INR', 'USD', 'RIY'])
  currency!: 'INR' | 'USD' | 'RIY';

  @IsNumber()
  @Min(100)
  @Max(1000000)
  amountInCurrency!: number;

  @IsNumber()
  estimatedEth!: number;

  @IsNumber()
  ethPriceAtTime!: number;
}

export class VerifyPaymentDto {
  @IsString()
  razorpayOrderId!: string;

  @IsString()
  razorpayPaymentId!: string;

  @IsString()
  razorpaySignature!: string;
}

export class AdminApprovePaymentDto {
  @IsString()
  paymentId!: string;

  @IsOptional()
  @IsString()
  adminNote?: string;

  @IsOptional()
  @IsString()
  transactionHash?: string;
}

export class GetPaymentsDto {
  @IsOptional()
  @IsNumber()
  page?: number = 1;

  @IsOptional()
  @IsNumber()
  limit?: number = 10;

  @IsOptional()
  @IsEnum(['pending', 'success', 'failed', 'fulfilled', 'rejected'])
  status?: 'pending' | 'success' | 'failed' | 'fulfilled' | 'rejected';
}

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