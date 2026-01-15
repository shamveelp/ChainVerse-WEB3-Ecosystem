import {
  IsEmail,
  IsString,
  MinLength,
  MaxLength,
  Matches,
  IsOptional,
  Length,
  IsNotEmpty
} from 'class-validator';
import { Transform } from 'class-transformer';
import { BaseResponseDto } from '../base/BaseResponse.dto';

export class UserRegisterDto {
  @IsString({ message: 'Username must be a string' })
  @IsNotEmpty({ message: 'Username is required' })
  @MinLength(4, { message: 'Username must be at least 4 characters long' })
  @MaxLength(20, { message: 'Username must be at most 20 characters long' })
  @Matches(/^[a-zA-Z0-9_]+$/, {
    message: 'Username can only contain letters, numbers, and underscores'
  })
  @Transform(({ value }) => value?.trim())
  username?: string;

  @IsString({ message: 'Name must be a string' })
  @IsNotEmpty({ message: 'Name is required' })
  @MinLength(2, { message: 'Name must be at least 2 characters long' })
  @MaxLength(50, { message: 'Name must be at most 50 characters long' })
  @Transform(({ value }) => value?.trim())
  name?: string;

  @IsEmail({}, { message: 'Please provide a valid email address' })
  @IsNotEmpty({ message: 'Email is required' })
  @Transform(({ value }) => value?.toLowerCase().trim())
  email?: string;

  @IsString({ message: 'Password must be a string' })
  @IsNotEmpty({ message: 'Password is required' })
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  @Matches(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
    {
      message: 'Password must contain at least one uppercase letter, lowercase letter, number, and special character'
    }
  )
  password?: string;

  @IsOptional()
  @IsString({ message: 'Referral code must be a string' })
  @Length(8, 8, { message: 'Referral code must be exactly 8 characters long' })
  @Matches(/^[A-Z0-9]+$/, {
    message: 'Referral code must contain only uppercase letters and numbers'
  })
  @Transform(({ value }) => value ? value.toUpperCase().trim() : undefined)
  referralCode?: string;
}

export class UserLoginDto {
  @IsEmail({}, { message: 'Please provide a valid email address' })
  @IsNotEmpty({ message: 'Email is required' })
  @Transform(({ value }) => value?.toLowerCase().trim())
  email?: string;

  @IsString({ message: 'Password is required' })
  @IsNotEmpty({ message: 'Password is required' })
  @MinLength(1, { message: 'Password cannot be empty' })
  password?: string;
}

export class VerifyOtpDto {
  @IsString({ message: 'Username must be a string' })
  @IsNotEmpty({ message: 'Username is required' })
  @MinLength(4, { message: 'Username must be at least 4 characters long' })
  @MaxLength(20, { message: 'Username must be at most 20 characters long' })
  @Matches(/^[a-zA-Z0-9_]+$/, {
    message: 'Username can only contain letters, numbers, and underscores'
  })
  @Transform(({ value }) => value?.trim())
  username?: string;

  @IsString({ message: 'Name must be a string' })
  @IsNotEmpty({ message: 'Name is required' })
  @MinLength(2, { message: 'Name must be at least 2 characters long' })
  @MaxLength(50, { message: 'Name must be at most 50 characters long' })
  @Transform(({ value }) => value?.trim())
  name?: string;

  @IsEmail({}, { message: 'Please provide a valid email address' })
  @IsNotEmpty({ message: 'Email is required' })
  @Transform(({ value }) => value?.toLowerCase().trim())
  email?: string;

  @IsString({ message: 'Password must be a string' })
  @IsNotEmpty({ message: 'Password is required' })
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  @Matches(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
    {
      message: 'Password must contain at least one uppercase letter, lowercase letter, number, and special character'
    }
  )
  password?: string;

  @IsString({ message: 'OTP is required' })
  @IsNotEmpty({ message: 'OTP is required' })
  @Length(6, 6, { message: 'OTP must be exactly 6 digits' })
  @Matches(/^\d{6}$/, { message: 'OTP must contain only numbers' })
  otp?: string;

  @IsOptional()
  @IsString({ message: 'Referral code must be a string' })
  @Length(8, 8, { message: 'Referral code must be exactly 8 characters long' })
  @Matches(/^[A-Z0-9]+$/, {
    message: 'Referral code must contain only uppercase letters and numbers'
  })
  @Transform(({ value }) => value ? value.toUpperCase().trim() : undefined)
  referralCode?: string;
}

export class CheckUsernameDto {
  @IsString({ message: 'Username must be a string' })
  @IsNotEmpty({ message: 'Username is required' })
  @MinLength(4, { message: 'Username must be at least 4 characters long' })
  @MaxLength(20, { message: 'Username must be at most 20 characters long' })
  @Matches(/^[a-zA-Z0-9_]+$/, {
    message: 'Username can only contain letters, numbers, and underscores'
  })
  @Transform(({ value }) => value?.trim())
  username?: string;
}

export class ForgotPasswordDto {
  @IsEmail({}, { message: 'Please provide a valid email address' })
  @IsNotEmpty({ message: 'Email is required' })
  @Transform(({ value }) => value?.toLowerCase().trim())
  email?: string;
}

export class ResetPasswordDto {
  @IsEmail({}, { message: 'Please provide a valid email address' })
  @IsNotEmpty({ message: 'Email is required' })
  @Transform(({ value }) => value?.toLowerCase().trim())
  email?: string;

  @IsString({ message: 'Password must be a string' })
  @IsNotEmpty({ message: 'New password is required' })
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  @Matches(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
    {
      message: 'Password must contain at least one uppercase letter, lowercase letter, number, and special character'
    }
  )
  newPassword?: string;
}

export class RequestOtpDto {
  @IsEmail({}, { message: 'Please provide a valid email address' })
  @IsNotEmpty({ message: 'Email is required' })
  @Transform(({ value }) => value?.toLowerCase().trim())
  email?: string;
}

export class GoogleLoginDto {
  @IsString({ message: 'Google token is required' })
  @IsNotEmpty({ message: 'Google token is required' })
  @MinLength(1, { message: 'Google token cannot be empty' })
  token?: string;

  @IsOptional()
  @IsString({ message: 'Referral code must be a string' })
  @Length(8, 8, { message: 'Referral code must be exactly 8 characters long' })
  @Matches(/^[A-Z0-9]+$/, {
    message: 'Referral code must contain only uppercase letters and numbers'
  })
  @Transform(({ value }) => value ? value.toUpperCase().trim() : undefined)
  referralCode?: string;
}

// Response DTOs
export class UserResponseDto {
  _id: string;
  username: string;
  email: string;
  name: string;
  refferalCode: string;
  totalPoints: number;
  profilePic?: string;
  role: string;
  isEmailVerified: boolean;
  createdAt: Date;
  lastLogin?: Date;

  constructor(user: any) {
    this._id = user._id;
    this.username = user.username;
    this.email = user.email;
    this.name = user.name;
    this.refferalCode = user.refferalCode;
    this.totalPoints = user.totalPoints || 0;
    this.profilePic = user.profilePic;
    this.role = user.role;
    this.isEmailVerified = user.isEmailVerified;
    this.createdAt = user.createdAt;
    this.lastLogin = user.lastLogin;
  }
}

export class LoginResponseDto extends BaseResponseDto {
  user: UserResponseDto;

  constructor(user: any, message: string = 'Login successful') {
    super(true, message);
    this.user = new UserResponseDto(user);
  }
}

export class RegisterResponseDto extends BaseResponseDto {
  constructor(message: string = 'Registration successful. Please check your email for verification code.') {
    super(true, message);
  }
}

export class UsernameCheckResponseDto extends BaseResponseDto {
  available: boolean;

  constructor(available: boolean) {
    super(true);
    this.available = available;
  }
}

export class OtpResponseDto extends BaseResponseDto {
  constructor(message: string = 'OTP sent successfully') {
    super(true, message);
  }
}

export class GenerateUsernameResponseDto extends BaseResponseDto {
  username: string;

  constructor(username: string) {
    super(true, 'Username generated successfully');
    this.username = username;
  }
}