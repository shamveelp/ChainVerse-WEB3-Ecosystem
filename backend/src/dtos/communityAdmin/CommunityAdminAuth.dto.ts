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
  IsObject,
  ValidateNested,
  ArrayMinSize,
  ArrayMaxSize
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { BaseResponseDto } from '../base/BaseResponse.dto';

class SocialLinksDto {
  @IsOptional()
  @IsString({ message: 'Twitter handle must be a string' })
  twitter?: string;

  @IsOptional()
  @IsString({ message: 'Discord link must be a string' })
  discord?: string;

  @IsOptional()
  @IsString({ message: 'Telegram link must be a string' })
  telegram?: string;

  @IsOptional()
  @IsString({ message: 'Website URL must be a string' })
  website?: string;
}

export class CreateCommunityDto {
  @IsString({ message: 'Community name is required' })
  @MinLength(3, { message: 'Community name must be at least 3 characters long' })
  @MaxLength(50, { message: 'Community name must be at most 50 characters long' })
  @Transform(({ value }) => typeof value === 'string' ? value.trim() : value)
  communityName!: string;

  @IsEmail({}, { message: 'Please provide a valid email address' })
  @Transform(({ value }) => typeof value === 'string' ? value.toLowerCase().trim() : value)
  email!: string;

  @IsString({ message: 'Username is required' })
  @MinLength(4, { message: 'Username must be at least 4 characters long' })
  @MaxLength(20, { message: 'Username must be at most 20 characters long' })
  @Matches(/^[a-zA-Z0-9_]+$/, {
    message: 'Username can only contain letters, numbers, and underscores'
  })
  @Transform(({ value }) => typeof value === 'string' ? value.trim() : value)
  username!: string;

  @IsString({ message: 'Wallet address is required' })
  @Matches(/^0x[a-fA-F0-9]{40}$/, {
    message: 'Please provide a valid Ethereum wallet address'
  })
  walletAddress!: string;

  @IsString({ message: 'Description is required' })
  @MinLength(50, { message: 'Description must be at least 50 characters long' })
  @MaxLength(500, { message: 'Description must be at most 500 characters long' })
  @Transform(({ value }) => typeof value === 'string' ? value.trim() : value)
  description!: string;

  @IsString({ message: 'Category is required' })
  @MinLength(2, { message: 'Category must be at least 2 characters long' })
  @Transform(({ value }) => typeof value === 'string' ? value.trim() : value)
  category!: string;

  @IsString({ message: 'Why choose us section is required' })
  @MinLength(30, { message: 'Why choose us must be at least 30 characters long' })
  @MaxLength(300, { message: 'Why choose us must be at most 300 characters long' })
  @Transform(({ value }) => typeof value === 'string' ? value.trim() : value)
  whyChooseUs!: string;

  @IsArray({ message: 'Rules must be an array' })
  @ArrayMinSize(1, { message: 'At least one rule is required' })
  @ArrayMaxSize(10, { message: 'Maximum 10 rules allowed' })
  @IsString({ each: true, message: 'Each rule must be a string' })
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      try {
        const parsed = JSON.parse(value);
        return Array.isArray(parsed) ? parsed.filter((rule: string) => rule && rule.trim() !== '') : [value];
      } catch {
        return [value];
      }
    }
    return Array.isArray(value) ? value.filter((rule: string) => rule && rule.trim() !== '') : [];
  })
  rules!: string[];

  @IsOptional()
  @ValidateNested()
  @Type(() => SocialLinksDto)
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      try {
        return JSON.parse(value);
      } catch {
        return {};
      }
    }
    return value || {};
  })
  socialLinks?: SocialLinksDto;

  @IsOptional()
  @IsString({ message: 'Logo must be a valid string' })
  logo?: string;

  @IsOptional()
  @IsString({ message: 'Banner must be a valid string' })
  banner?: string;
}

export class SetPasswordDto {
  @IsEmail({}, { message: 'Please provide a valid email address' })
  @Transform(({ value }) => typeof value === 'string' ? value.toLowerCase().trim() : value)
  email!: string;

  @IsString({ message: 'Password must be a string' })
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  @Matches(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
    {
      message: 'Password must contain at least one uppercase letter, lowercase letter, number, and special character'
    }
  )
  password!: string;
}

export class CommunityAdminLoginDto {
  @IsEmail({}, { message: 'Please provide a valid email address' })
  @Transform(({ value }) => typeof value === 'string' ? value.toLowerCase().trim() : value)
  email!: string;

  @IsString({ message: 'Password is required' })
  @MinLength(1, { message: 'Password cannot be empty' })
  password!: string;
}

export class VerifyOtpDto {
  @IsEmail({}, { message: 'Please provide a valid email address' })
  @Transform(({ value }) => typeof value === 'string' ? value.toLowerCase().trim() : value)
  email!: string;

  @IsString({ message: 'OTP is required' })
  @Length(6, 6, { message: 'OTP must be exactly 6 digits' })
  @Matches(/^\d{6}$/, { message: 'OTP must contain only numbers' })
  otp!: string;
}

export class CheckEmailDto {
  @IsEmail({}, { message: 'Please provide a valid email address' })
  @Transform(({ value }) => typeof value === 'string' ? value.toLowerCase().trim() : value)
  email!: string;
}

export class CheckUsernameDto {
  @IsString({ message: 'Username is required' })
  @MinLength(4, { message: 'Username must be at least 4 characters long' })
  @MaxLength(20, { message: 'Username must be at most 20 characters long' })
  @Matches(/^[a-zA-Z0-9_]+$/, {
    message: 'Username can only contain letters, numbers, and underscores'
  })
  @Transform(({ value }) => typeof value === 'string' ? value.trim() : value)
  username!: string;
}

export class ResendOtpDto {
  @IsEmail({}, { message: 'Please provide a valid email address' })
  @Transform(({ value }) => typeof value === 'string' ? value.toLowerCase().trim() : value)
  email!: string;
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