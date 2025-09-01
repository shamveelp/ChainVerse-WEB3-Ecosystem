import { 
  IsString, 
  IsOptional, 
  MinLength, 
  MaxLength, 
  Matches, 
  IsUrl,
  IsPhoneNumber
} from 'class-validator';
import { Transform } from 'class-transformer';
import { BaseResponseDto } from '../base/BaseResponse.dto';

export class UpdateProfileDto {
  @IsOptional()
  @IsString({ message: 'Name must be a string' })
  @MinLength(1, { message: 'Name cannot be empty' })
  @MaxLength(50, { message: 'Name must be at most 50 characters long' })
  @Transform(({ value }) => value?.trim())
  name?: string;

  @IsOptional()
  @IsString({ message: 'Username must be a string' })
  @MinLength(4, { message: 'Username must be at least 4 characters long' })
  @MaxLength(20, { message: 'Username must be at most 20 characters long' })
  @Matches(/^[a-zA-Z0-9_]+$/, { 
    message: 'Username can only contain letters, numbers, and underscores' 
  })
  @Transform(({ value }) => value?.trim())
  username?: string;

  @IsOptional()
  @IsString({ message: 'Phone must be a string' })
  @Matches(/^[\+]?[1-9][\d]{0,15}$/, { 
    message: 'Please provide a valid phone number' 
  })
  @Transform(({ value }) => value?.trim())
  phone?: string;

  @IsOptional()
  @IsUrl({}, { message: 'Profile picture must be a valid URL' })
  profilePic?: string;
}

export class UserProfileResponseDto {
  _id: string;
  username: string;
  name: string;
  email: string;
  phone?: string;
  refferalCode: string;
  profilePic: string;
  totalPoints: number;
  isEmailVerified: boolean;
  isGoogleUser: boolean;
  dailyCheckin: {
    lastCheckIn: Date | null;
    streak: number;
  };
  followersCount: number;
  followingCount: number;
  createdAt: Date;
  updatedAt: Date;

  constructor(user: any) {
    this._id = user._id;
    this.username = user.username;
    this.name = user.name || '';
    this.email = user.email;
    this.phone = user.phone || '';
    this.refferalCode = user.refferalCode || '';
    this.profilePic = user.profilePic || '';
    this.totalPoints = user.totalPoints || 0;
    this.isEmailVerified = user.isEmailVerified || false;
    this.isGoogleUser = user.isGoogleUser || false;
    this.dailyCheckin = {
      lastCheckIn: user.dailyCheckin?.lastCheckIn || null,
      streak: user.dailyCheckin?.streak || 0,
    };
    this.followersCount = user.followersCount || 0;
    this.followingCount = user.followingCount || 0;
    this.createdAt = user.createdAt;
    this.updatedAt = user.updatedAt;
  }
}

export class ProfileResponseDto extends BaseResponseDto {
  data: UserProfileResponseDto;

  constructor(user: any, message: string = 'Profile fetched successfully') {
    super(true, message);
    this.data = new UserProfileResponseDto(user);
  }
}