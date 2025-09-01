import { 
  IsEmail, 
  IsString, 
  MinLength, 
  MaxLength, 
  IsOptional, 
  IsArray,
  IsUrl,
  Length,
  Matches
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
  rules: string[] | undefined;

  @IsArray({ message: 'Social links must be an array' })
  socialLinks: object[] | undefined;

  @IsOptional()
  @IsUrl({}, { message: 'Logo must be a valid URL' })
  logo?: string;

  @IsOptional()
  @IsUrl({}, { message: 'Banner must be a valid URL' })
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

export class CommunityAdminResponseDto {
  _id: string;
  email: string;
  name: string;
  role: string;
  communityId?: string;
  isActive: boolean;
  lastLogin?: Date;

  constructor(admin: any) {
    this._id = admin._id;
    this.email = admin.email;
    this.name = admin.name;
    this.role = admin.role;
    this.communityId = admin.communityId;
    this.isActive = admin.isActive;
    this.lastLogin = admin.lastLogin;
  }
}

export class CommunityAdminLoginResponseDto extends BaseResponseDto {
  communityAdmin: CommunityAdminResponseDto;

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