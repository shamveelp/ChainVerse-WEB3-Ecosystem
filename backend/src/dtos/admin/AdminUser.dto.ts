import { IsString, IsOptional, IsBoolean, IsNumber, Min } from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { PaginatedResponseDto } from '../base/BaseResponse.dto';
import { IUser } from '../../models/user.models';

export class GetUsersQueryDto {
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

export class UpdateUserStatusDto {
  @IsOptional()
  @IsBoolean({ message: 'isBanned must be a boolean' })
  isBanned?: boolean;

  @IsOptional()
  @IsBoolean({ message: 'isBlocked must be a boolean' })
  isBlocked?: boolean;

  @IsOptional()
  @IsBoolean({ message: 'isActive must be a boolean' })
  isActive?: boolean;
}

export class UserResponseDto {
  _id: string;
  username?: string;
  name: string;
  email: string;
  phone?: string;
  totalPoints?: number;
  isBlocked?: boolean;
  isBanned?: boolean;
  isEmailVerified?: boolean;
  isGoogleUser?: boolean;
  createdAt: Date;
  updatedAt: Date;
  refferalCode?: string;
  refferedBy?: string | null;

  constructor(user: IUser) {
    this._id = user._id.toString();
    this.username = user.username;
    this.name = user.name || '';
    this.email = user.email || '';
    this.phone = user.phone;
    this.totalPoints = user.totalPoints;
    this.isBlocked = user.isBlocked;
    this.isBanned = user.isBanned;
    this.isEmailVerified = user.isEmailVerified;
    this.isGoogleUser = user.isGoogleUser;
    this.createdAt = user.createdAt;
    this.updatedAt = user.updatedAt;
    this.refferalCode = user.refferalCode;
    // Handle refferedBy being populated or ObjectId or string
    const refferedBy = user.refferedBy;
    if (refferedBy && typeof refferedBy === 'object' && '_id' in refferedBy) {
      this.refferedBy = (refferedBy as { _id: { toString(): string } })._id.toString();
    } else {
      this.refferedBy = refferedBy ? refferedBy.toString() : null;
    }
  }
}

export class GetUsersResponseDto extends PaginatedResponseDto<UserResponseDto> {
  constructor(
    users: IUser[],
    total: number,
    page: number,
    limit: number,
    message?: string
  ) {
    const userDtos = users.map(user => new UserResponseDto(user));
    super(userDtos, total, page, limit, true, message);
  }
}