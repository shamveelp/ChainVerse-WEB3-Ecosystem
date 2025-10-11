import { injectable, inject } from "inversify";
import bcrypt from "bcryptjs";
import { TYPES } from "../../core/types/types";
import { ICommunityAdminAuthService } from "../../core/interfaces/services/communityAdmin/ICommunityAdminAuthService";
import { ICommunityAdminRepository } from "../../core/interfaces/repositories/ICommunityAdminRepository";
import { ICommunityRequestRepository } from "../../core/interfaces/repositories/ICommunityRequestRepository";
import { IUserRepository } from "../../core/interfaces/repositories/IUserRepository";
import { IJwtService } from "../../core/interfaces/services/IJwtService";
import { IOTPService } from "../../core/interfaces/services/IOtpService";
import { IMailService } from "../ITempMail";
import { ICommunityAdmin } from "../../models/communityAdmin.model";
import CommunityModel from "../../models/community.model";
import logger from "../../utils/logger";
import { CustomError } from "../../utils/customError";
import { StatusCode } from "../../enums/statusCode.enum";
import { Response, Request } from "express";
import {
  CreateCommunityDto,
  SetPasswordDto,
  CommunityAdminLoginDto,
  VerifyOtpDto,
  CommunityAdminResponseDto,
  CommunityAdminLoginResponseDto,
  CreateCommunityResponseDto,
  CheckExistenceResponseDto,
} from "../../dtos/communityAdmin/CommunityAdminAuth.dto";
import {
  ForgotPasswordDto,
  VerifyOtpDto as AdminVerifyOtpDto,
  ResetPasswordDto,
} from "../../dtos/ForgotPassword.dto";

@injectable()
export class CommunityAdminAuthService implements ICommunityAdminAuthService {
  constructor(
    @inject(TYPES.ICommunityAdminRepository)
    private communityAdminRepo: ICommunityAdminRepository,
    @inject(TYPES.ICommunityRequestRepository)
    private communityRequestRepo: ICommunityRequestRepository,
    @inject(TYPES.IUserRepository) private userRepo: IUserRepository,
    @inject(TYPES.IJwtService) private jwtService: IJwtService,
    @inject(TYPES.IOtpService) private otpService: IOTPService,
    @inject(TYPES.IMailService) private mailService: IMailService
  ) {}

  async checkEmailExists(email: string): Promise<CheckExistenceResponseDto> {
    try {
      const [existingRequest, existingAdmin] = await Promise.all([
        this.communityRequestRepo.findByEmail(email),
        this.communityAdminRepo.findByEmail(email),
      ]);

      const exists = !!(existingRequest || existingAdmin);
      return new CheckExistenceResponseDto(exists, "Email check completed");
    } catch (error) {
      logger.error("Error checking email existence:", error);
      throw new CustomError(
        "Failed to check email availability",
        StatusCode.INTERNAL_SERVER_ERROR
      );
    }
  }

  async checkUsernameExists(
    username: string
  ): Promise<CheckExistenceResponseDto> {
    try {
      const [existingRequest, existingUser, existingCommunity] =
        await Promise.all([
          this.communityRequestRepo.findByUsername(username),
          this.userRepo.findByUsername(username),
          CommunityModel.findOne({ username }),
        ]);

      const exists = !!(existingRequest || existingUser || existingCommunity);
      return new CheckExistenceResponseDto(exists, "Username check completed");
    } catch (error) {
      logger.error("Error checking username existence:", error);
      throw new CustomError(
        "Failed to check username availability",
        StatusCode.INTERNAL_SERVER_ERROR
      );
    }
  }

  async createCommunityApplication(
    dto: CreateCommunityDto
  ): Promise<CreateCommunityResponseDto> {
    try {
      // Validate DTO
      if (!dto.email || !dto.communityName || !dto.username) {
        throw new CustomError(
          "Required fields missing",
          StatusCode.BAD_REQUEST
        );
      }

      // Check if email already exists
      const emailCheck = await this.checkEmailExists(dto.email);
      if (emailCheck.exists) {
        throw new CustomError(
          "Application already exists for this email",
          StatusCode.BAD_REQUEST
        );
      }

      // Check if username already exists
      const usernameCheck = await this.checkUsernameExists(dto.username);
      if (usernameCheck.exists) {
        throw new CustomError(
          "Username is already taken",
          StatusCode.BAD_REQUEST
        );
      }

      // Transform rules and socialLinks to match ICommunityRequest
      const rules: [string] = [dto.rules.join("; ")]; // Join multiple rules into a single string
      const socialLinks: [Object] | undefined = dto.socialLinks
        ? [dto.socialLinks]
        : undefined;

      // Create community request with uploaded URLs (logo and banner are already URLs from controller)
      const communityRequest = await this.communityRequestRepo.create({
        communityName: dto.communityName,
        email: dto.email,
        username: dto.username,
        walletAddress: dto.walletAddress,
        description: dto.description,
        category: dto.category,
        whyChooseUs: dto.whyChooseUs,
        rules,
        socialLinks,
        logo: dto.logo || '',
        banner: dto.banner || '',
        status: "pending",
      });

      // Send application submitted email
      await this.sendApplicationEmail(
        dto.email,
        dto.communityName,
        "submitted"
      );

      return new CreateCommunityResponseDto(
        communityRequest._id.toString(),
        "Community application submitted successfully"
      );
    } catch (error: any) {
      logger.error("Error creating community application:", error);
      throw error instanceof CustomError
        ? error
        : new CustomError(error.message || "Failed to create application", StatusCode.BAD_REQUEST);
    }
  }

  async setPassword(
    dto: SetPasswordDto
  ): Promise<{ success: boolean; message: string }> {
    try {
      if (!dto.email || !dto.password) {
        throw new CustomError(
          "Email and password are required",
          StatusCode.BAD_REQUEST
        );
      }

      // Check if community request exists
      const communityRequest = await this.communityRequestRepo.findByEmail(
        dto.email
      );
      if (!communityRequest) {
        throw new CustomError(
          "No application found for this email",
          StatusCode.NOT_FOUND
        );
      }

      // Check if community admin already exists
      const existingAdmin = await this.communityAdminRepo.findByEmail(
        dto.email
      );
      if (existingAdmin) {
        throw new CustomError(
          "Account already exists for this email",
          StatusCode.BAD_REQUEST
        );
      }

      // Register community admin
      await this.registerCommunityAdmin({
        email: dto.email,
        password: dto.password,
        name: communityRequest.username,
        role: "communityAdmin",
      });

      // Send OTP
      await this.otpService.requestOtp(dto.email, "communityAdmin");

      return {
        success: true,
        message:
          "Password set successfully. OTP sent to your email for verification.",
      };
    } catch (error: any) {
      logger.error("Error setting password:", error);
      throw error instanceof CustomError
        ? error
        : new CustomError(error.message || "Failed to set password", StatusCode.BAD_REQUEST);
    }
  }

  async verifyOtp(
    dto: VerifyOtpDto
  ): Promise<{ success: boolean; message: string }> {
    try {
      if (!dto.email || !dto.otp) {
        throw new CustomError(
          "Email and OTP are required",
          StatusCode.BAD_REQUEST
        );
      }

      const isValid = await this.otpService.verifyOtp(dto.email, dto.otp);
      if (!isValid) {
        throw new CustomError("Invalid or expired OTP", StatusCode.BAD_REQUEST);
      }

      return {
        success: true,
        message: "OTP verified successfully. Your application is under review.",
      };
    } catch (error: any) {
      logger.error("Error verifying OTP:", error);
      throw error instanceof CustomError
        ? error
        : new CustomError(error.message || "OTP verification failed", StatusCode.BAD_REQUEST);
    }
  }

  async resendOtp(dto: {
    email: string;
  }): Promise<{ success: boolean; message: string }> {
    try {
      if (!dto.email) {
        throw new CustomError("Email is required", StatusCode.BAD_REQUEST);
      }

      // Check if community admin exists
      const communityAdmin = await this.communityAdminRepo.findByEmail(
        dto.email
      );
      if (!communityAdmin) {
        throw new CustomError(
          "No account found for this email",
          StatusCode.NOT_FOUND
        );
      }

      // Send new OTP
      await this.otpService.requestOtp(dto.email, "communityAdmin");

      return {
        success: true,
        message: "OTP resent successfully",
      };
    } catch (error: any) {
      logger.error("Error resending OTP:", error);
      throw error instanceof CustomError
        ? error
        : new CustomError(error.message || "Failed to resend OTP", StatusCode.BAD_REQUEST);
    }
  }

  async loginCommunityAdmin(
    dto: CommunityAdminLoginDto,
    res: Response
  ): Promise<CommunityAdminLoginResponseDto> {
    try {
      if (!dto.email || !dto.password) {
        throw new CustomError(
          "Email and password are required",
          StatusCode.BAD_REQUEST
        );
      }

      const communityAdmin = await this.communityAdminRepo.findByEmail(
        dto.email
      );
      if (!communityAdmin) {
        throw new CustomError("Invalid credentials", StatusCode.UNAUTHORIZED);
      }

      const communityRequest = await this.communityRequestRepo.findByEmail(
        dto.email
      );
      if (!communityRequest) {
        throw new CustomError("No application found", StatusCode.NOT_FOUND);
      }

      if (communityRequest.status === "pending") {
        throw new CustomError(
          "Your application is still under review",
          StatusCode.FORBIDDEN
        );
      }

      if (communityRequest.status === "rejected") {
        throw new CustomError(
          "Your application has been rejected. Please reapply.",
          StatusCode.FORBIDDEN
        );
      }

      if (!communityAdmin.isActive) {
        throw new CustomError(
          "Account has been deactivated",
          StatusCode.FORBIDDEN
        );
      }

      const isPasswordValid = await bcrypt.compare(
        dto.password,
        communityAdmin.password
      );
      if (!isPasswordValid) {
        throw new CustomError("Invalid credentials", StatusCode.UNAUTHORIZED);
      }

      // Update last login
      await this.updateLastLogin(communityAdmin._id.toString());

      // Generate tokens
      const accessToken = this.jwtService.generateAccessToken(
        communityAdmin._id.toString(),
        "communityAdmin",
        communityAdmin.tokenVersion ?? 0
      );
      const refreshToken = this.jwtService.generateRefreshToken(
        communityAdmin._id.toString(),
        "communityAdmin",
        communityAdmin.tokenVersion ?? 0
      );

      this.jwtService.setTokens(res, accessToken, refreshToken);

      // Map to response DTO
      const responseDto = new CommunityAdminLoginResponseDto(communityAdmin);
      responseDto.communityAdmin = {
        ...responseDto.communityAdmin,
        token: accessToken,
      };

      return responseDto;
    } catch (error: any) {
      logger.error("Error in community admin login:", error);
      throw error instanceof CustomError
        ? error
        : new CustomError(error.message || "Login failed", StatusCode.UNAUTHORIZED);
    }
  }

  async forgotPassword(
    dto: ForgotPasswordDto
  ): Promise<{ success: boolean; message: string }> {
    try {
      if (!dto.email) {
        throw new CustomError("Email is required", StatusCode.BAD_REQUEST);
      }

      // Check if community admin exists
      const communityAdmin = await this.communityAdminRepo.findByEmail(
        dto.email
      );
      if (!communityAdmin) {
        return {
          success: true,
          message:
            "If an account exists with this email, you'll receive a password reset code",
        };
      }

      await this.otpService.requestForgotPasswordOtp(
        dto.email,
        "communityAdmin"
      );

      return {
        success: true,
        message: "Password reset code sent to your email",
      };
    } catch (error: any) {
      logger.error("Error in forgot password:", error);
      throw error instanceof CustomError
        ? error
        : new CustomError(error.message || "Failed to process request", StatusCode.BAD_REQUEST);
    }
  }

  async verifyForgotPasswordOtp(
    dto: AdminVerifyOtpDto
  ): Promise<{ success: boolean; message: string }> {
    try {
      if (!dto.email || !dto.otp) {
        throw new CustomError(
          "Email and OTP are required",
          StatusCode.BAD_REQUEST
        );
      }

      const isValid = await this.otpService.verifyOtp(dto.email, dto.otp);
      if (!isValid) {
        throw new CustomError("Invalid or expired OTP", StatusCode.BAD_REQUEST);
      }

      return {
        success: true,
        message: "OTP verified. You can now reset your password.",
      };
    } catch (error: any) {
      logger.error("Error verifying forgot password OTP:", error);
      throw error instanceof CustomError
        ? error
        : new CustomError(error.message || "OTP verification failed", StatusCode.BAD_REQUEST);
    }
  }

  async resetPassword(
    dto: ResetPasswordDto
  ): Promise<{ success: boolean; message: string }> {
    try {
      if (!dto.email || !dto.password) {
        throw new CustomError(
          "Email and password are required",
          StatusCode.BAD_REQUEST
        );
      }

      // Check if community admin exists
      const communityAdmin = await this.communityAdminRepo.findByEmail(
        dto.email
      );
      if (!communityAdmin) {
        throw new CustomError("Account not found", StatusCode.NOT_FOUND);
      }

      const hashedPassword = await bcrypt.hash(dto.password, 12);

      // Increment token version to invalidate existing sessions
      await this.communityAdminRepo.updateCommunityAdmin(
        communityAdmin._id.toString(),
        {
          password: hashedPassword,
          tokenVersion: (communityAdmin.tokenVersion ?? 0) + 1,
        }
      );

      return {
        success: true,
        message: "Password reset successfully",
      };
    } catch (error: any) {
      logger.error("Error resetting password:", error);
      throw error instanceof CustomError
        ? error
        : new CustomError(error.message || "Password reset failed", StatusCode.BAD_REQUEST);
    }
  }

  async refreshToken(
    req: Request,
    res: Response
  ): Promise<{ success: boolean; accessToken: string; message: string }> {
    try {
      const refreshToken = req.cookies?.refreshToken;

      if (!refreshToken) {
        throw new CustomError(
          "Refresh token is required",
          StatusCode.UNAUTHORIZED
        );
      }

      const decoded = this.jwtService.verifyRefreshToken(refreshToken);

      // Verify community admin exists and token version matches
      const communityAdmin = await this.communityAdminRepo.findById(decoded.id);
      if (
        !communityAdmin ||
        communityAdmin.tokenVersion !== decoded.tokenVersion
      ) {
        throw new CustomError("Invalid refresh token", StatusCode.UNAUTHORIZED);
      }

      const newAccessToken = this.jwtService.generateAccessToken(
        communityAdmin._id.toString(),
        "communityAdmin",
        communityAdmin.tokenVersion ?? 0
      );

      this.jwtService.setAccessToken(res, newAccessToken);

      return {
        success: true,
        accessToken: newAccessToken,
        message: "Token refreshed successfully",
      };
    } catch (error: any) {
      logger.error("Error refreshing token:", error);
      throw error instanceof CustomError
        ? error
        : new CustomError(
            "Invalid or expired refresh token",
            StatusCode.UNAUTHORIZED
          );
    }
  }

  async logout(res: Response): Promise<{ success: boolean; message: string }> {
    this.jwtService.clearTokens(res);
    return {
      success: true,
      message: "Logged out successfully",
    };
  }

  async getProfile(
    communityAdminId: string
  ): Promise<{ success: boolean; communityAdmin: CommunityAdminResponseDto }> {
    try {
      const communityAdmin =
        await this.communityAdminRepo.findById(communityAdminId);

      if (!communityAdmin) {
        throw new CustomError(
          "Community admin not found",
          StatusCode.NOT_FOUND
        );
      }

      const responseDto = new CommunityAdminResponseDto(communityAdmin);

      return {
        success: true,
        communityAdmin: responseDto,
      };
    } catch (error: any) {
      logger.error("Error getting profile:", error);
      throw error instanceof CustomError
        ? error
        : new CustomError(
            "Failed to get profile",
            StatusCode.INTERNAL_SERVER_ERROR
          );
    }
  }

  async getCommunityDetails(communityAdminId: string): Promise<any> {
    try {
      const communityAdmin =
        await this.communityAdminRepo.findById(communityAdminId);

      if (!communityAdmin) {
        throw new CustomError(
          "Community admin not found",
          StatusCode.NOT_FOUND
        );
      }

      if (!communityAdmin.communityId) {
        throw new CustomError(
          "No community associated with this admin",
          StatusCode.NOT_FOUND
        );
      }

      const community = await CommunityModel.findById(
        communityAdmin.communityId
      );

      if (!community) {
        throw new CustomError("Community not found", StatusCode.NOT_FOUND);
      }

      return {
        success: true,
        community: {
          id: community._id,
          name: community.communityName,
          username: community.username,
          description: community.description,
          category: community.category,
          logo: community.logo,
          banner: community.banner,
          memberCount: community.members.length,
          isVerified: community.isVerified,
          status: community.status,
          settings: community.settings,
        },
      };
    } catch (error: any) {
      logger.error("Error getting community details:", error);
      throw error instanceof CustomError
        ? error
        : new CustomError(
            "Failed to get community details",
            StatusCode.INTERNAL_SERVER_ERROR
          );
    }
  }

  async updateCommunity(
    communityAdminId: string,
    updateData: any
  ): Promise<any> {
    try {
      const communityAdmin =
        await this.communityAdminRepo.findById(communityAdminId);

      if (!communityAdmin) {
        throw new CustomError(
          "Community admin not found",
          StatusCode.NOT_FOUND
        );
      }

      if (!communityAdmin.communityId) {
        throw new CustomError(
          "No community associated with this admin",
          StatusCode.NOT_FOUND
        );
      }

      const community = await CommunityModel.findByIdAndUpdate(
        communityAdmin.communityId,
        updateData,
        { new: true }
      );

      return {
        success: true,
        message: "Community updated successfully",
        community: updateData,
      };
    } catch (error: any) {
      logger.error("Error updating community:", error);
      throw error instanceof CustomError
        ? error
        : new CustomError("Failed to update community", StatusCode.BAD_REQUEST);
    }
  }

  async reapplyApplication(
    dto: CreateCommunityDto
  ): Promise<CreateCommunityResponseDto> {
    try {
      // Validate DTO
      if (!dto.email || !dto.communityName || !dto.username) {
        throw new CustomError(
          "Email, community name, and username are required",
          StatusCode.BAD_REQUEST
        );
      }
      // Check if previous application was rejected
      const existingRequest = await this.communityRequestRepo.findByEmail(
        dto.email
      );
      if (!existingRequest || existingRequest.status !== "rejected") {
        throw new CustomError(
          "No rejected application found for reapply",
          StatusCode.BAD_REQUEST
        );
      }

      // Delete existing community admin if exists
      const existingAdmin = await this.communityAdminRepo.findByEmail(
        dto.email
      );
      if (existingAdmin) {
        await this.communityAdminRepo.delete(existingAdmin._id.toString());
      }

      // Transform rules and socialLinks to match ICommunityRequest
      const rules: [string] = [dto.rules.join("; ")]; // Join multiple rules into a single string
      const socialLinks: [Object] | undefined = dto.socialLinks
        ? [dto.socialLinks]
        : undefined;

      // Update the existing request with new data
      const updatedRequest = await this.communityRequestRepo.update(
        existingRequest._id.toString(),
        {
          communityName: dto.communityName,
          username: dto.username,
          walletAddress: dto.walletAddress,
          description: dto.description,
          category: dto.category,
          whyChooseUs: dto.whyChooseUs,
          rules,
          socialLinks,
          logo: dto.logo || '',
          banner: dto.banner || '',
          status: "pending",
        }
      );

      // Send reapplication email
      await this.sendApplicationEmail(
        dto.email,
        dto.communityName,
        "resubmitted"
      );

      return new CreateCommunityResponseDto(
        updatedRequest!._id.toString(),
        "Community application resubmitted successfully"
      );
    } catch (error: any) {
      logger.error("Error reapplying application:", error);
      throw error instanceof CustomError
        ? error
        : new CustomError(error.message || "Failed to reapply", StatusCode.BAD_REQUEST);
    }
  }

  // Private helper methods
  private async registerCommunityAdmin(
    data: Partial<ICommunityAdmin>
  ): Promise<ICommunityAdmin> {
    try {
      const existingAdmin = await this.communityAdminRepo.findByEmail(
        data.email!
      );
      if (existingAdmin) {
        throw new CustomError(
          "Community admin already exists with this email",
          StatusCode.BAD_REQUEST
        );
      }

      const hashedPassword = await bcrypt.hash(data.password!, 12);
      const communityAdminData = {
        ...data,
        password: hashedPassword,
        role: "communityAdmin" as const,
        isActive: true,
        tokenVersion: 0,
      };

      return await this.communityAdminRepo.createCommunityAdmin(
        communityAdminData
      );
    } catch (error: any) {
      logger.error("Error registering community admin:", error);
      throw error instanceof CustomError
        ? error
        : new CustomError("Failed to register admin", StatusCode.BAD_REQUEST);
    }
  }

  private async updateLastLogin(id: string): Promise<void> {
    try {
      await this.communityAdminRepo.updateCommunityAdmin(id, {
        lastLogin: new Date(),
      });
    } catch (error: any) {
      logger.error("Error updating last login:", error);
      // Don't throw error as this is not critical for login flow
    }
  }

  private async sendApplicationEmail(
    email: string,
    communityName: string,
    status: "submitted" | "approved" | "rejected" | "resubmitted",
    reason?: string
  ): Promise<void> {
    try {
      let subject = "";
      let content = "";

      switch (status) {
        case "submitted":
          subject = `ChainVerse - Community Application Submitted`;
          content = `
                        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                            <h2 style="color: #2563eb;">Application Submitted Successfully</h2>
                            <p>Dear Community Admin,</p>
                            <p>Your application for <strong>${communityName}</strong> has been submitted successfully.</p>
                            <p>Our team will review your application within 48 hours and notify you of the decision.</p>
                            <p>Thank you for choosing ChainVerse!</p>
                        </div>
                    `;
          break;
        case "resubmitted":
          subject = `ChainVerse - Community Application Resubmitted`;
          content = `
                        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                            <h2 style="color: #2563eb;">Application Resubmitted Successfully</h2>
                            <p>Dear Community Admin,</p>
                            <p>Your updated application for <strong>${communityName}</strong> has been resubmitted successfully.</p>
                            <p>Our team will review your updated application within 48 hours.</p>
                            <p>Thank you for your continued interest in ChainVerse!</p>
                        </div>
                    `;
          break;
        case "approved":
          subject = `🎉 ChainVerse - Community Application Approved`;
          content = `
                        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                            <h2 style="color: #16a34a;">Congratulations! Your Application is Approved</h2>
                            <p>Dear Community Admin,</p>
                            <p>Great news! Your application for <strong>${communityName}</strong> has been approved.</p>
                            <p>You can now log in to your community admin dashboard and start building your Web3 community.</p>
                            <p>Welcome to ChainVerse!</p>
                        </div>
                    `;
          break;
        case "rejected":
          subject = `ChainVerse - Community Application Update`;
          content = `
                        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                            <h2 style="color: #dc2626;">Application Update Required</h2>
                            <p>Dear Community Admin,</p>
                            <p>Thank you for your interest in ChainVerse. Unfortunately, your application for <strong>${communityName}</strong> requires some updates.</p>
                            ${reason ? `<p><strong>Reason:</strong> ${reason}</p>` : ""}
                            <p>Don't worry! You can reapply with the updated information. Please address the feedback and submit a new application.</p>
                            <p>We look forward to welcoming you to ChainVerse!</p>
                        </div>
                    `;
          break;
      }

      await this.mailService.sendMail(email, subject, content);
    } catch (error) {
      logger.error("Failed to send application email:", error);
      // Don't throw error to not break the main flow
    }
  }

  async createCommunityFromRequest(requestId: string): Promise<void> {
    try {
      const request = await this.communityRequestRepo.findById(requestId);
      if (!request) {
        throw new CustomError(
          "Community request not found",
          StatusCode.NOT_FOUND
        );
      }

      if (request.status !== "approved") {
        throw new CustomError(
          "Community request is not approved",
          StatusCode.BAD_REQUEST
        );
      }

      const community = new CommunityModel({
        communityName: request.communityName,
        email: request.email,
        username: request.username,
        walletAddress: request.walletAddress,
        description: request.description,
        category: request.category,
        rules: request.rules, // Already in [string] format
        logo: request.logo,
        banner: request.banner,
        socialLinks: request.socialLinks, // Already in [Object] format
        status: "approved",
        isVerified: false,
        members: [],
        communityAdmins: [],
        settings: {
          allowChainCast: false,
          allowGroupChat: true,
          allowPosts: true,
          allowQuests: false,
        },
      });

      const savedCommunity = await community.save();

      // Update community admin with community ID
      const communityAdmin = await this.communityAdminRepo.findByEmail(
        request.email
      );
      if (communityAdmin) {
        await this.communityAdminRepo.updateCommunityAdmin(
          communityAdmin._id.toString(),
          { communityId: savedCommunity._id }
        );

        // Add admin to community
        savedCommunity.communityAdmins.push(communityAdmin._id);
        await savedCommunity.save();
      }

      // Send approval email
      await this.sendApplicationEmail(
        request.email,
        request.communityName,
        "approved"
      );

      logger.info(`Community created from request: ${requestId}`);
    } catch (error: any) {
      logger.error("Error creating community from request:", error);
      throw error instanceof CustomError
        ? error
        : new CustomError("Failed to create community", StatusCode.BAD_REQUEST);
    }
  }

  async incrementTokenVersion(id: string): Promise<void> {
    try {
      const communityAdmin = await this.communityAdminRepo.findById(id);
      if (!communityAdmin) {
        throw new CustomError("Community admin not found", StatusCode.NOT_FOUND);
      }

      await this.communityAdminRepo.updateCommunityAdmin(id, {
        tokenVersion: (communityAdmin.tokenVersion ?? 0) + 1,
      });
    } catch (error: any) {
      logger.error("Error incrementing token version:", error);
      throw error instanceof CustomError
        ? error
        : new CustomError("Failed to update token version", StatusCode.BAD_REQUEST);
    }
  }
}