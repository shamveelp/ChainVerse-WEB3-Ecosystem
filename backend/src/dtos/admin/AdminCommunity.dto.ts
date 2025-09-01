import { IsString, IsOptional, IsNumber, Min } from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { BaseResponseDto, PaginatedResponseDto } from '../base/BaseResponse.dto';

export class GetCommunityRequestsQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'Page must be a number' })
  @Min(1, { message: 'Page must be at least 1' })
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'Limit must be a number' })
  @Min(1, { message: 'Limit must be at least 1' })
  limit?: number = 10;

  @IsOptional()
  @IsString({ message: 'Search must be a string' })
  @Transform(({ value }) => value?.trim())
  search?: string = '';
}

export class RejectCommunityRequestDto {
  @IsString({ message: 'Reason is required' })
  @Transform(({ value }) => value?.trim())
  reason: string | undefined;
}

export class CommunityRequestResponseDto {
  _id: string;
  communityName: string;
  email: string;
  username: string;
  walletAddress: string;
  description: string;
  category: string;
  status: string;
  createdAt: Date;

  constructor(request: any) {
    this._id = request._id;
    this.communityName = request.communityName;
    this.email = request.email;
    this.username = request.username;
    this.walletAddress = request.walletAddress;
    this.description = request.description;
    this.category = request.category;
    this.status = request.status;
    this.createdAt = request.createdAt;
  }
}