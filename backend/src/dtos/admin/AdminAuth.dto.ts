import { IsBoolean, IsEmail, IsString, MinLength } from 'class-validator';
import { Transform } from 'class-transformer';
import { BaseResponseDto } from '../base/BaseResponse.dto';

export class AdminLoginDto {
  @IsEmail({}, { message: 'Please provide a valid email address' })
  @Transform(({ value }) => value?.toLowerCase().trim())
  email: string | undefined;

  @IsString({ message: 'Password is required' })
  @MinLength(1, { message: 'Password cannot be empty' })
  password: string | undefined;
}

export class AdminChangePasswordDto {
  @IsString({ message: 'Old password is required' })
  @MinLength(1, { message: 'Old password cannot be empty' })
  oldPassword: string | undefined;

  @IsString({ message: 'New password is required' })
  @MinLength(8, { message: 'New password must be at least 8 characters long' })
  newPassword: string | undefined;
}


export class AdminResponseDto {
  _id: string;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
  lastLogin: Date | null;

  constructor(admin: any) {
    this._id = admin._id;
    this.name = admin.name;
    this.email = admin.email;
    this.role = admin.role;
    this.isActive = admin.isActive;
    this.lastLogin = admin.lastLogin;
  }
}

export class AdminLoginResponseDto extends BaseResponseDto {
  admin: AdminResponseDto;

  constructor(admin: any, message: string = 'Admin login successful') {
    super(true, message);
    this.admin = new AdminResponseDto(admin);
  }
}

export class UpdateUserStatusDto {
  @IsBoolean()
  isBanned: boolean | undefined;
}