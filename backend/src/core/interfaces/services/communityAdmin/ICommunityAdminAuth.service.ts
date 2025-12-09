import { ICommunityAdmin } from "../../../../models/communityAdmin.model";
import { Request, Response } from "express";
import {
  CreateCommunityDto,
  SetPasswordDto,
  CommunityAdminLoginDto,
  VerifyOtpDto,
  CommunityAdminResponseDto,
  CommunityAdminLoginResponseDto,
  CreateCommunityResponseDto,
  CheckExistenceResponseDto
} from "../../../../dtos/communityAdmin/CommunityAdminAuth.dto";
import { ForgotPasswordDto, VerifyOtpDto as AdminVerifyOtpDto, ResetPasswordDto } from "../../../../dtos/ForgotPassword.dto";

export interface ICommunityAdminAuthService {
    // Validation
    checkEmailExists(email: string): Promise<CheckExistenceResponseDto>;
    checkUsernameExists(username: string): Promise<CheckExistenceResponseDto>;

    // Application flow
    createCommunityApplication(dto: CreateCommunityDto): Promise<CreateCommunityResponseDto>;
    setPassword(dto: SetPasswordDto): Promise<{ success: boolean; message: string }>;
    verifyOtp(dto: VerifyOtpDto): Promise<{ success: boolean; message: string }>;
    resendOtp(dto: { email: string }): Promise<{ success: boolean; message: string }>;
    reapplyApplication(dto: CreateCommunityDto): Promise<CreateCommunityResponseDto>;

    // Authentication
    loginCommunityAdmin(dto: CommunityAdminLoginDto, res: Response): Promise<CommunityAdminLoginResponseDto>;
    logout(res: Response): Promise<{ success: boolean; message: string }>;
    refreshToken(req: Request, res: Response): Promise<{ success: boolean; accessToken: string; message: string }>;

    // Password reset
    forgotPassword(dto: ForgotPasswordDto): Promise<{ success: boolean; message: string }>;
    verifyForgotPasswordOtp(dto: AdminVerifyOtpDto): Promise<{ success: boolean; message: string }>;
    resetPassword(dto: ResetPasswordDto): Promise<{ success: boolean; message: string }>;

    // Profile & Community management
    getProfile(communityAdminId: string): Promise<{ success: boolean; communityAdmin: CommunityAdminResponseDto }>;
    getCommunityDetails(communityAdminId: string): Promise<any>;
    updateCommunity(communityAdminId: string, updateData: any): Promise<any>;

    // Admin operations
    createCommunityFromRequest(requestId: string): Promise<void>;
    incrementTokenVersion(id: string): Promise<void>;
}