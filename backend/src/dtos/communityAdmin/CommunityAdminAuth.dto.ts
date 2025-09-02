import { 
  IsEmail, 
  IsString, 
  MinLength, 
  MaxLength, 
  IsOptional, 
  IsArray,
  IsUrl,
  Length,
  Matches,
  IsObject
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { BaseResponseDto } from '../base/BaseResponse.dto';

export class CreateCommunityDto {
  @IsString({ message: 'Community name is required' })
  @MinLength(3, { message: 'Community name must be at least 3 characters long' })
  @MaxLength(50, { message: 'Community name must be at most 50 characters long' })
  @Transform(({ value }) => value?.trim())
  communityName: string | undefined;

  @IsEmail({}, { message: 'Please provide a valid email address' })
  @Transform(({ value }) => value?.toLowerCase().trim())
  email: string | undefined;

  @IsString({ message: 'Username is required' })
  @MinLength(4, { message: 'Username must be at least 4 characters long' })
  @MaxLength(20, { message: 'Username must be at most 20 characters long' })
  @Matches(/^[a-zA-Z0-9_]+$/, { 
    message: 'Username can only contain letters, numbers, and underscores' 
  })
  @Transform(({ value }) => value?.trim())
  username: string | undefined;

  @IsString({ message: 'Wallet address is required' })
  @Matches(/^0x[a-fA-F0-9]{40}$/, { 
    message: 'Please provide a valid Ethereum wallet address' 
  })
  walletAddress: string | undefined;

  @IsString({ message: 'Description is required' })
  @MinLength(50, { message: 'Description must be at least 50 characters long' })
  @MaxLength(500, { message: 'Description must be at most 500 characters long' })
  @Transform(({ value }) => value?.trim())
  description: string | undefined;

  @IsString({ message: 'Category is required' })
  @MinLength(2, { message: 'Category must be at least 2 characters long' })
  @Transform(({ value }) => value?.trim())
  category: string | undefined;

  @IsString({ message: 'Why choose us section is required' })
  @MinLength(30, { message: 'Why choose us must be at least 30 characters long' })
  @MaxLength(300, { message: 'Why choose us must be at most 300 characters long' })
  @Transform(({ value }) => value?.trim())
  whyChooseUs: string | undefined;

  @IsArray({ message: 'Rules must be an array' })
  @IsString({ each: true, message: 'Each rule must be a string' })
  rules: [string] | undefined;

  @IsObject({ message: 'Social links must be an object' })
  @IsOptional()
  socialLinks?: [Object] | undefined;

  @IsOptional()
  @IsString({ message: 'Logo must be a valid URL string' })
  logo?: string;

  @IsOptional()
  @IsString({ message: 'Banner must be a valid URL string' })
  banner?: string;
}

export class SetPasswordDto {
  @IsEmail({}, { message: 'Please provide a valid email address' })
  @Transform(({ value }) => value?.toLowerCase().trim())
  email: string | undefined;

  @IsString({ message: 'Password must be a string' })
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  @Matches(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
    { 
      message: 'Password must contain at least one uppercase letter, lowercase letter, number, and special character' 
    }
  )
  password: string | undefined;
}

export class CommunityAdminLoginDto {
  @IsEmail({}, { message: 'Please provide a valid email address' })
  @Transform(({ value }) => value?.toLowerCase().trim())
  email: string | undefined;

  @IsString({ message: 'Password is required' })
  @MinLength(1, { message: 'Password cannot be empty' })
  password: string | undefined;
}

export class VerifyOtpDto {
  @IsEmail({}, { message: 'Please provide a valid email address' })
  @Transform(({ value }) => value?.toLowerCase().trim())
  email: string | undefined;

  @IsString({ message: 'OTP is required' })
  @Length(6, 6, { message: 'OTP must be exactly 6 digits' })
  @Matches(/^\d{6}$/, { message: 'OTP must contain only numbers' })
  otp: string | undefined;
}

export class CheckEmailDto {
  @IsEmail({}, { message: 'Please provide a valid email address' })
  @Transform(({ value }) => value?.toLowerCase().trim())
  email: string | undefined;
}

export class CheckUsernameDto {
  @IsString({ message: 'Username is required' })
  @MinLength(4, { message: 'Username must be at least 4 characters long' })
  @MaxLength(20, { message: 'Username must be at most 20 characters long' })
  @Matches(/^[a-zA-Z0-9_]+$/, { 
    message: 'Username can only contain letters, numbers, and underscores' 
  })
  @Transform(({ value }) => value?.trim())
  username: string | undefined;
}

export class ResendOtpDto {
  @IsEmail({}, { message: 'Please provide a valid email address' })
  @Transform(({ value }) => value?.toLowerCase().trim())
  email: string | undefined;
}

// Response DTOs
export class CommunityAdminResponseDto {
  _id: string;
  email: string;
  name: string;
  role: string;
  token?: string;
  communityId?: string;
  isActive: boolean;
  lastLogin?: Date;

  constructor(admin: any) {
    this._id = admin._id.toString();
    this.email = admin.email;
    this.name = admin.name;
    this.role = admin.role;
    this.token = admin.token;
    this.communityId = admin.communityId?.toString();
    this.isActive = admin.isActive;
    this.lastLogin = admin.lastLogin;
  }
}

export class CommunityAdminLoginResponseDto extends BaseResponseDto {
  communityAdmin: CommunityAdminResponseDto;
  token?: string;

  constructor(admin: any, message: string = 'Login successful') {
    super(true, message);
    this.communityAdmin = new CommunityAdminResponseDto(admin);
  }
}

export class CreateCommunityResponseDto extends BaseResponseDto {
  requestId: string;

  constructor(requestId: string, message: string = 'Community application submitted successfully') {
    super(true, message);
    this.requestId = requestId;
  }
}

export class CheckExistenceResponseDto extends BaseResponseDto {
  exists: boolean;

  constructor(exists: boolean, message: string = 'Check completed') {
    super(true, message);
    this.exists = exists;
  }
}

export class CommunityDetailsResponseDto extends BaseResponseDto {
  community: {
    id: string;
    name: string;
    username: string;
    description: string;
    category: string;
    logo?: string;
    banner?: string;
    memberCount: number;
    isVerified: boolean;
    status: string;
  };

  constructor(community: any, memberCount: number = 0) {
    super(true, 'Community details retrieved successfully');
    this.community = {
      id: community._id?.toString(),
      name: community.communityName,
      username: community.username,
      description: community.description,
      category: community.category,
      logo: community.logo,
      banner: community.banner,
      memberCount,
      isVerified: community.isVerified,
      status: community.status
    };
  }
}