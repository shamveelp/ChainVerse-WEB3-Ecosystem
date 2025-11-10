import { IsNumber, IsString, IsOptional, IsEthereumAddress, Min, Max } from 'class-validator';
import { Transform, Type } from 'class-transformer';

export class CreateConversionDto {
  @Type(() => Number)
  @IsNumber({}, { message: 'Points to convert must be a number' })
  @Min(1, { message: 'Points must be at least 1' })
  pointsToConvert!: number;
}

export class ClaimCVCDto {
  @IsString({ message: 'Conversion ID must be a string' })
  conversionId!: string;

  @IsEthereumAddress({ message: 'Invalid wallet address' })
  walletAddress!: string;

  @IsString({ message: 'Transaction hash must be a string' })
  transactionHash!: string;
}

export class ValidateConversionDto {
  @Type(() => Number)
  @IsNumber({}, { message: 'Points to convert must be a number' })
  @Min(1, { message: 'Points must be at least 1' })
  pointsToConvert!: number;
}

export class GetConversionsQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'Page must be a number' })
  @Min(1, { message: 'Page must be at least 1' })
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'Limit must be a number' })
  @Min(1, { message: 'Limit must be at least 1' })
  @Max(100, { message: 'Limit cannot exceed 100' })
  limit?: number;
}

export class ApproveConversionDto {
  @IsOptional()
  @IsString({ message: 'Admin note must be a string' })
  adminNote?: string;
}

export class RejectConversionDto {
  @IsString({ message: 'Reason must be a string' })
  reason!: string;
}

export class UpdateConversionRateDto {
  @Type(() => Number)
  @IsNumber({}, { message: 'Points per CVC must be a number' })
  @Min(1, { message: 'Points per CVC must be at least 1' })
  pointsPerCVC!: number;

  @Type(() => Number)
  @IsNumber({}, { message: 'Minimum points must be a number' })
  @Min(1, { message: 'Minimum points must be at least 1' })
  minimumPoints!: number;

  @Type(() => Number)
  @IsNumber({}, { message: 'Minimum CVC must be a number' })
  @Min(0.01, { message: 'Minimum CVC must be at least 0.01' })
  minimumCVC!: number;

  @IsString({ message: 'Claim fee ETH must be a string' })
  claimFeeETH!: string;

  @IsOptional()
  @Transform(({ value }) => value ? new Date(value) : undefined)
  effectiveFrom?: Date;
}

export class GetConversionsAdminQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'Page must be a number' })
  @Min(1, { message: 'Page must be at least 1' })
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'Limit must be a number' })
  @Min(1, { message: 'Limit must be at least 1' })
  @Max(100, { message: 'Limit cannot exceed 100' })
  limit?: number;

  @IsOptional()
  @IsString({ message: 'Status must be a string' })
  status?: string;
}