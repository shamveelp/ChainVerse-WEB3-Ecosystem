import { injectable, inject } from "inversify";
import bcrypt from "bcryptjs";
import { TYPES } from "../../core/types/types";
import { ICommunityAdminAuthService } from "../../core/interfaces/services/communityAdmin/ICommunityAdminAuth.service";
import { ICommunityAdminRepository } from "../../core/interfaces/repositories/ICommunityAdminRepository";
import { ICommunityRequestRepository } from "../../core/interfaces/repositories/ICommunityRequest.repository";
import { IUserRepository } from "../../core/interfaces/repositories/IUser.repository";
import { IJwtService } from "../../core/interfaces/services/IJwtService";
import { IOTPService } from "../../core/interfaces/services/IOTP.service";
import { IMailService } from "../ITempMail";
import { ICommunityAdmin } from "../../models/communityAdmin.model";
import CommunityModel from "../../models/community.model";
import CommunityMemberModel from "../../models/communityMember.model";
import logger from "../../utils/logger";
import { CustomError } from "../../utils/customError";
import { StatusCode } from "../../enums/statusCode.enum";
import { ErrorMessages, SuccessMessages, LoggerMessages } from "../../enums/messages.enum";
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
  ) { }

  /**
   * Checks if an email is already registered or has a pending application.
   * @param {string} email - The email to check.
   * @returns {Promise<CheckExistenceResponseDto>} Existence status.
   * @throws {CustomError} If the check fails.
   */
  async checkEmailExists(email: string): Promise<CheckExistenceResponseDto> {
    try {
      const [existingRequest, existingAdmin] = await Promise.all([
        this.communityRequestRepo.findByEmail(email),
        this.communityAdminRepo.findByEmail(email),
      ]);

      const exists = !!(existingRequest || existingAdmin);
      return new CheckExistenceResponseDto(exists, SuccessMessages.EMAIL_CHECK_COMPLETED);
    } catch (error) {
      logger.error(LoggerMessages.CHECK_EMAIL_EXISTS_ERROR, error);
      throw new CustomError(
        ErrorMessages.FAILED_CHECK_EMAIL,
        StatusCode.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Checks if a username is already taken.
   * @param {string} username - The username to check.
   * @returns {Promise<CheckExistenceResponseDto>} Existence status.
   * @throws {CustomError} If the check fails.
   */
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
      return new CheckExistenceResponseDto(exists, SuccessMessages.USERNAME_CHECK_COMPLETED);
    } catch (error) {
      logger.error(LoggerMessages.CHECK_USERNAME_EXISTS_ERROR, error);
      throw new CustomError(
        ErrorMessages.FAILED_CHECK_USERNAME,
        StatusCode.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Creates a new community application.
   * @param {CreateCommunityDto} dto - Application data.
   * @returns {Promise<CreateCommunityResponseDto>} Result message.
   * @throws {CustomError} If validation fails or creation errors.
   */
  async createCommunityApplication(
    dto: CreateCommunityDto
  ): Promise<CreateCommunityResponseDto> {
    try {
      // Validate DTO
      if (!dto.email || !dto.communityName || !dto.username) {
        throw new CustomError(
          ErrorMessages.REQUIRED_FIELDS_MISSING,
          StatusCode.BAD_REQUEST
        );
      }

      // Check if email already exists
      const emailCheck = await this.checkEmailExists(dto.email);
      if (emailCheck.exists) {
        throw new CustomError(
          ErrorMessages.APPLICATION_ALREADY_EXISTS,
          StatusCode.BAD_REQUEST
        );
      }

      // Check if username already exists
      const usernameCheck = await this.checkUsernameExists(dto.username);
      if (usernameCheck.exists) {
        throw new CustomError(
          ErrorMessages.USERNAME_TAKEN,
          StatusCode.BAD_REQUEST
        );
      }

      // Transform rules and socialLinks to match ICommunityRequest
      const rules: [string] = [dto.rules.join("; ")]; // Join multiple rules into a single string
      const socialLinks: [object] | undefined = dto.socialLinks
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
        SuccessMessages.APPLICATION_SUBMITTED_SUCCESS
      );
    } catch (error: any) {
      logger.error(LoggerMessages.CREATE_APPLICATION_ERROR, error);
      throw error instanceof CustomError
        ? error
        : new CustomError(error.message || ErrorMessages.FAILED_SUBMIT_APPLICATION, StatusCode.BAD_REQUEST);
    }
  }

  /**
   * Sets the password for a community admin.
   * @param {SetPasswordDto} dto - Password data.
   * @returns {Promise<{ success: boolean; message: string }>} Success message.
   */
  async setPassword(
    dto: SetPasswordDto
  ): Promise<{ success: boolean; message: string }> {
    try {
      if (!dto.email || !dto.password) {
        throw new CustomError(
          ErrorMessages.EMAIL_PASSWORD_REQUIRED,
          StatusCode.BAD_REQUEST
        );
      }

      // Check if community request exists
      const communityRequest = await this.communityRequestRepo.findByEmail(
        dto.email
      );
      if (!communityRequest) {
        throw new CustomError(
          ErrorMessages.APPLICATION_NOT_FOUND,
          StatusCode.NOT_FOUND
        );
      }

      // Check if community admin already exists
      const existingAdmin = await this.communityAdminRepo.findByEmail(
        dto.email
      );
      if (existingAdmin) {
        throw new CustomError(
          ErrorMessages.ACCOUNT_ALREADY_EXISTS,
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
          SuccessMessages.PASSWORD_SET_OTP_SENT,
      };
    } catch (error: any) {
      logger.error(LoggerMessages.SET_PASSWORD_ERROR, error);
      throw error instanceof CustomError
        ? error
        : new CustomError(error.message || ErrorMessages.FAILED_SET_PASSWORD, StatusCode.BAD_REQUEST);
    }
  }

  /**
   * Verifies the OTP for a community admin.
   * @param {VerifyOtpDto} dto - OTP data.
   * @returns {Promise<{ success: boolean; message: string }>} Verification success.
   */
  async verifyOtp(
    dto: VerifyOtpDto
  ): Promise<{ success: boolean; message: string }> {
    try {
      if (!dto.email || !dto.otp) {
        throw new CustomError(
          ErrorMessages.EMAIL_OTP_REQUIRED,
          StatusCode.BAD_REQUEST
        );
      }

      const isValid = await this.otpService.verifyOtp(dto.email, dto.otp);
      if (!isValid) {
        throw new CustomError(ErrorMessages.INVALID_OTP, StatusCode.BAD_REQUEST);
      }

      return {
        success: true,
        message: SuccessMessages.OTP_VERIFIED_APPLICATION_REVIEW,
      };
    } catch (error: any) {
      logger.error(LoggerMessages.VERIFY_OTP_ERROR, error);
      throw error instanceof CustomError
        ? error
        : new CustomError(error.message || ErrorMessages.FAILED_OTP_VERIFICATION, StatusCode.BAD_REQUEST);
    }
  }

  /**
   * Resends the OTP.
   * @param {{ email: string }} dto - Email data.
   * @returns {Promise<{ success: boolean; message: string }>} Success message.
   */
  async resendOtp(dto: {
    email: string;
  }): Promise<{ success: boolean; message: string }> {
    try {
      if (!dto.email) {
        throw new CustomError(ErrorMessages.EMAIL_REQUIRED, StatusCode.BAD_REQUEST);
      }

      // Check if community admin exists
      const communityAdmin = await this.communityAdminRepo.findByEmail(
        dto.email
      );
      if (!communityAdmin) {
        throw new CustomError(
          ErrorMessages.ACCOUNT_NOT_FOUND,
          StatusCode.NOT_FOUND
        );
      }

      // Send new OTP
      await this.otpService.requestOtp(dto.email, "communityAdmin");

      return {
        success: true,
        message: SuccessMessages.OTP_RESENT_SUCCESS,
      };
    } catch (error: any) {
      logger.error(LoggerMessages.RESEND_OTP_ERROR, error);
      throw error instanceof CustomError
        ? error
        : new CustomError(error.message || ErrorMessages.FAILED_RESEND_OTP, StatusCode.BAD_REQUEST);
    }
  }

  /**
   * Logs in a community admin.
   * @param {CommunityAdminLoginDto} dto - Login credentials.
   * @param {Response} res - Express response object.
   * @returns {Promise<CommunityAdminLoginResponseDto>} Login response.
   */
  async loginCommunityAdmin(
    dto: CommunityAdminLoginDto,
    res: Response
  ): Promise<CommunityAdminLoginResponseDto> {
    try {
      if (!dto.email || !dto.password) {
        throw new CustomError(
          ErrorMessages.EMAIL_PASSWORD_REQUIRED,
          StatusCode.BAD_REQUEST
        );
      }

      const communityAdmin = await this.communityAdminRepo.findByEmail(
        dto.email
      );
      if (!communityAdmin) {
        throw new CustomError(ErrorMessages.INVALID_CREDENTIALS, StatusCode.UNAUTHORIZED);
      }

      const communityRequest = await this.communityRequestRepo.findByEmail(
        dto.email
      );
      if (!communityRequest) {
        throw new CustomError(ErrorMessages.APPLICATION_NOT_FOUND, StatusCode.NOT_FOUND);
      }

      if (communityRequest.status === "pending") {
        throw new CustomError(
          ErrorMessages.APPLICATION_UNDER_REVIEW,
          StatusCode.FORBIDDEN
        );
      }

      if (communityRequest.status === "rejected") {
        throw new CustomError(
          ErrorMessages.APPLICATION_REJECTED,
          StatusCode.FORBIDDEN
        );
      }

      if (!communityAdmin.isActive) {
        throw new CustomError(
          ErrorMessages.ACCOUNT_DEACTIVATED,
          StatusCode.FORBIDDEN
        );
      }

      const isPasswordValid = await bcrypt.compare(
        dto.password,
        communityAdmin.password
      );
      if (!isPasswordValid) {
        throw new CustomError(ErrorMessages.INVALID_CREDENTIALS, StatusCode.UNAUTHORIZED);
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
      logger.error(LoggerMessages.COMMUNITY_ADMIN_LOGIN_ERROR, error);
      throw error instanceof CustomError
        ? error
        : new CustomError(error.message || ErrorMessages.FAILED_LOGIN, StatusCode.UNAUTHORIZED);
    }
  }

  /**
   * Initiates forgot password flow.
   * @param {ForgotPasswordDto} dto - Forgot password data.
   * @returns {Promise<{ success: boolean; message: string }>} Result message.
   */
  async forgotPassword(
    dto: ForgotPasswordDto
  ): Promise<{ success: boolean; message: string }> {
    try {
      if (!dto.email) {
        throw new CustomError(ErrorMessages.EMAIL_REQUIRED, StatusCode.BAD_REQUEST);
      }

      // Check if community admin exists
      const communityAdmin = await this.communityAdminRepo.findByEmail(
        dto.email
      );
      if (!communityAdmin) {
        return {
          success: true,
          message:
            SuccessMessages.PASSWORD_RESET_CODE_SENT,
        };
      }

      await this.otpService.requestForgotPasswordOtp(
        dto.email,
        "communityAdmin"
      );

      return {
        success: true,
        message: SuccessMessages.PASSWORD_RESET_CODE_SENT,
      };
    } catch (error: any) {
      logger.error(LoggerMessages.FORGOT_PASSWORD_ERROR, error);
      throw error instanceof CustomError
        ? error
        : new CustomError(error.message || ErrorMessages.FAILED_PROCESS_REQUEST, StatusCode.BAD_REQUEST);
    }
  }

  /**
   * Verifies forgot password OTP.
   * @param {AdminVerifyOtpDto} dto - OTP data.
   * @returns {Promise<{ success: boolean; message: string }>} Verification success.
   */
  async verifyForgotPasswordOtp(
    dto: AdminVerifyOtpDto
  ): Promise<{ success: boolean; message: string }> {
    try {
      if (!dto.email || !dto.otp) {
        throw new CustomError(
          ErrorMessages.EMAIL_OTP_REQUIRED,
          StatusCode.BAD_REQUEST
        );
      }

      const isValid = await this.otpService.verifyOtp(dto.email, dto.otp);
      if (!isValid) {
        throw new CustomError(ErrorMessages.INVALID_OTP, StatusCode.BAD_REQUEST);
      }

      return {
        success: true,
        message: SuccessMessages.OTP_VERIFIED_RESET_PASSWORD
      };
    } catch (error: any) {
      logger.error(LoggerMessages.VERIFY_FORGOT_PASSWORD_OTP_ERROR, error);
      throw error instanceof CustomError
        ? error
        : new CustomError(error.message || ErrorMessages.FAILED_OTP_VERIFICATION, StatusCode.BAD_REQUEST);
    }
  }

  /**
   * Resets password.
   * @param {ResetPasswordDto} dto - Reset password data.
   * @returns {Promise<{ success: boolean; message: string }>} Success message.
   */
  async resetPassword(
    dto: ResetPasswordDto
  ): Promise<{ success: boolean; message: string }> {
    try {
      if (!dto.email || !dto.password) {
        throw new CustomError(
          ErrorMessages.EMAIL_PASSWORD_REQUIRED,
          StatusCode.BAD_REQUEST
        );
      }

      // Check if community admin exists
      const communityAdmin = await this.communityAdminRepo.findByEmail(
        dto.email
      );
      if (!communityAdmin) {
        throw new CustomError(ErrorMessages.ACCOUNT_NOT_FOUND, StatusCode.NOT_FOUND);
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
        message: SuccessMessages.PASSWORD_RESET,
      };
    } catch (error: any) {
      logger.error(LoggerMessages.RESET_PASSWORD_ERROR, error);
      throw error instanceof CustomError
        ? error
        : new CustomError(error.message || ErrorMessages.FAILED_RESET_PASSWORD, StatusCode.BAD_REQUEST);
    }
  }

  /**
   * Refreshes the access token.
   * @param {Request} req - Express request.
   * @param {Response} res - Express response.
   * @returns {Promise<{ success: boolean; accessToken: string; message: string }>} Refresh result.
   */
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
        throw new CustomError(ErrorMessages.INVALID_REFRESH_TOKEN, StatusCode.UNAUTHORIZED);
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
        message: SuccessMessages.TOKEN_REFRESHED,
      };
    } catch (error: any) {
      logger.error(LoggerMessages.REFRESH_TOKEN_ERROR, error);
      throw error instanceof CustomError
        ? error
        : new CustomError(
          ErrorMessages.INVALID_REFRESH_TOKEN,
          StatusCode.UNAUTHORIZED
        );
    }
  }

  /**
   * Logs out a community admin.
   * @param {Response} res - Express response.
   * @returns {Promise<{ success: boolean; message: string }>} Logout result.
   */
  async logout(res: Response): Promise<{ success: boolean; message: string }> {
    this.jwtService.clearTokens(res);
    return {
      success: true,
      message: SuccessMessages.ADMIN_LOGGED_OUT,
    };
  }

  /**
   * Retrieves community admin profile.
   * @param {string} communityAdminId - Admin ID.
   * @returns {Promise<{ success: boolean; communityAdmin: CommunityAdminResponseDto }>} Profile.
   */
  async getProfile(
    communityAdminId: string
  ): Promise<{ success: boolean; communityAdmin: CommunityAdminResponseDto }> {
    try {
      const communityAdmin =
        await this.communityAdminRepo.findById(communityAdminId);

      if (!communityAdmin) {
        throw new CustomError(
          ErrorMessages.COMMUNITY_ADMIN_NOT_FOUND,
          StatusCode.NOT_FOUND
        );
      }

      const responseDto = new CommunityAdminResponseDto(communityAdmin);

      return {
        success: true,
        communityAdmin: responseDto,
      };
    } catch (error: any) {
      logger.error(LoggerMessages.GET_PROFILE_ERROR, error);
      throw error instanceof CustomError
        ? error
        : new CustomError(
          ErrorMessages.FAILED_GET_PROFILE,
          StatusCode.INTERNAL_SERVER_ERROR
        );
    }
  }

  /**
   * Retrieves community details for the admin.
   * @param {string} communityAdminId - Admin ID.
   * @returns {Promise<any>} Community details.
   */
  async getCommunityDetails(communityAdminId: string): Promise<any> {
    try {
      const communityAdmin =
        await this.communityAdminRepo.findById(communityAdminId);

      if (!communityAdmin) {
        throw new CustomError(
          ErrorMessages.COMMUNITY_ADMIN_NOT_FOUND,
          StatusCode.NOT_FOUND
        );
      }

      if (!communityAdmin.communityId) {
        throw new CustomError(
          ErrorMessages.NO_COMMUNITY_ASSOCIATED,
          StatusCode.NOT_FOUND
        );
      }

      const community = await CommunityModel.findById(
        communityAdmin.communityId
      ).lean();

      if (!community) {
        throw new CustomError(ErrorMessages.COMMUNITY_NOT_FOUND, StatusCode.NOT_FOUND);
      }

      const communityPayload = await this._buildCommunityResponse(community);

      return {
        success: true,
        community: communityPayload,
      };
    } catch (error: any) {
      logger.error(LoggerMessages.GET_COMMUNITY_DETAILS_ERROR, error);
      throw error instanceof CustomError
        ? error
        : new CustomError(
          ErrorMessages.FAILED_GET_COMMUNITY_DETAILS,
          StatusCode.INTERNAL_SERVER_ERROR
        );
    }
  }

  /**
   * Updates community details.
   * @param {string} communityAdminId - Community Admin ID.
   * @param {any} updateData - Data to update.
   * @returns {Promise<any>} Updated community details.
   */
  async updateCommunity(
    communityAdminId: string,
    updateData: any
  ): Promise<any> {
    try {
      const communityAdmin =
        await this.communityAdminRepo.findById(communityAdminId);

      if (!communityAdmin) {
        throw new CustomError(
          ErrorMessages.COMMUNITY_ADMIN_NOT_FOUND,
          StatusCode.NOT_FOUND
        );
      }

      if (!communityAdmin.communityId) {
        throw new CustomError(
          ErrorMessages.NO_COMMUNITY_ASSOCIATED,
          StatusCode.NOT_FOUND
        );
      }

      const community = await CommunityModel.findByIdAndUpdate(
        communityAdmin.communityId,
        updateData,
        { new: true, lean: true }
      );

      if (!community) {
        throw new CustomError(ErrorMessages.COMMUNITY_NOT_FOUND, StatusCode.NOT_FOUND);
      }

      const communityPayload = await this._buildCommunityResponse(community);

      return {
        success: true,
        message: SuccessMessages.COMMUNITY_UPDATED_SUCCESS,
        community: communityPayload,
      };
    } catch (error: any) {
      logger.error(LoggerMessages.UPDATE_COMMUNITY_ERROR, error);
      throw error instanceof CustomError
        ? error
        : new CustomError(ErrorMessages.FAILED_UPDATE_COMMUNITY, StatusCode.BAD_REQUEST);
    }
  }

  /**
   * Reapplies for a rejected community application.
   * @param {CreateCommunityDto} dto - Application data.
   * @returns {Promise<CreateCommunityResponseDto>} Result message.
   */
  async reapplyApplication(
    dto: CreateCommunityDto
  ): Promise<CreateCommunityResponseDto> {
    try {
      // Validate DTO
      if (!dto.email || !dto.communityName || !dto.username) {
        throw new CustomError(
          ErrorMessages.EMAIL_COMMUNITY_USERNAME_REQUIRED,
          StatusCode.BAD_REQUEST
        );
      }
      // Check if previous application was rejected
      const existingRequest = await this.communityRequestRepo.findByEmail(
        dto.email
      );
      if (!existingRequest || existingRequest.status !== "rejected") {
        throw new CustomError(
          ErrorMessages.NO_REJECTED_APPLICATION,
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
      const socialLinks: [object] | undefined = dto.socialLinks
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
        SuccessMessages.APPLICATION_RESUBMITTED_SUCCESS
      );
    } catch (error: any) {
      logger.error(LoggerMessages.REAPPLY_APPLICATION_ERROR, error);
      throw error instanceof CustomError
        ? error
        : new CustomError(error.message || ErrorMessages.FAILED_REAPPLY, StatusCode.BAD_REQUEST);
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
          ErrorMessages.COMMUNITY_ADMIN_EXISTS,
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
      logger.error(LoggerMessages.REGISTER_COMMUNITY_ADMIN_ERROR, error);
      throw error instanceof CustomError
        ? error
        : new CustomError(ErrorMessages.FAILED_REGISTER_ADMIN, StatusCode.BAD_REQUEST);
    }
  }

  private async updateLastLogin(id: string): Promise<void> {
    try {
      await this.communityAdminRepo.updateCommunityAdmin(id, {
        lastLogin: new Date(),
      });
    } catch (error: any) {
      logger.error(LoggerMessages.UPDATE_LAST_LOGIN_ERROR, error);
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
      logger.error(LoggerMessages.SEND_EMAIL_ERROR, error);
      // Don't throw error to not break the main flow
    }
  }

  /**
   * Normalizes rules array.
   * @param {any} rules - Rules input.
   * @returns {string[]} Normalized rules.
   */
  private _normalizeRules(rules?: any): string[] {
    if (!Array.isArray(rules)) {
      return [];
    }

    const normalized: string[] = [];

    rules.forEach((rule: any) => {
      if (typeof rule === "string") {
        const parts = rule.split(";").map((part) => part.trim()).filter(Boolean);
        normalized.push(...parts);
      }
    });

    return normalized;
  }

  /**
   * Normalizes social links object.
   * @param {any} socialLinks - Social links input.
   * @returns {Record<string, string>} Normalized social links.
   */
  private _normalizeSocialLinks(socialLinks?: any): Record<string, string> {
    if (Array.isArray(socialLinks) && socialLinks.length > 0) {
      return socialLinks[0];
    }

    if (typeof socialLinks === "object" && socialLinks !== null) {
      return socialLinks;
    }

    return {};
  }

  /**
   * Builds community response payload.
   * @param {any} community - Community object.
   * @returns {Promise<any>} Community payload.
   */
  private async _buildCommunityResponse(community: any) {
    const memberCount = await CommunityMemberModel.countDocuments({
      communityId: community._id,
      isActive: true,
    });

    return {
      id: community._id?.toString(),
      communityName: community.communityName,
      email: community.email,
      username: community.username,
      walletAddress: community.walletAddress,
      description: community.description,
      category: community.category,
      rules: this._normalizeRules(community.rules),
      socialLinks: this._normalizeSocialLinks(community.socialLinks),
      logo: community.logo,
      banner: community.banner,
      settings: community.settings,
      status: community.status,
      isVerified: community.isVerified,
      memberCount,
      createdAt: community.createdAt,
      updatedAt: community.updatedAt,
    };
  }

  /**
   * Creates a community from an approved request.
   * @param {string} requestId - Request ID.
   * @returns {Promise<void>}
   */
  async createCommunityFromRequest(requestId: string): Promise<void> {
    try {
      const request = await this.communityRequestRepo.findById(requestId);
      if (!request) {
        throw new CustomError(
          ErrorMessages.COMMUNITY_REQUEST_NOT_FOUND,
          StatusCode.NOT_FOUND
        );
      }

      if (request.status !== "approved") {
        throw new CustomError(
          ErrorMessages.COMMUNITY_REQUEST_NOT_APPROVED,
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
      logger.error(LoggerMessages.CREATE_COMMUNITY_ERROR, error);
      throw error instanceof CustomError
        ? error
        : new CustomError(ErrorMessages.FAILED_CREATE_COMMUNITY, StatusCode.BAD_REQUEST);
    }
  }

  /**
   * Increments token version for a community admin.
   * @param {string} id - Admin ID.
   * @returns {Promise<void>}
   */
  async incrementTokenVersion(id: string): Promise<void> {
    try {
      const communityAdmin = await this.communityAdminRepo.findById(id);
      if (!communityAdmin) {
        throw new CustomError(ErrorMessages.COMMUNITY_ADMIN_NOT_FOUND, StatusCode.NOT_FOUND);
      }

      await this.communityAdminRepo.updateCommunityAdmin(id, {
        tokenVersion: (communityAdmin.tokenVersion ?? 0) + 1,
      });
    } catch (error: any) {
      logger.error(LoggerMessages.INCREMENT_TOKEN_VERSION_ERROR, error);
      throw error instanceof CustomError
        ? error
        : new CustomError(ErrorMessages.FAILED_UPDATE_TOKEN_VERSION, StatusCode.BAD_REQUEST);
    }
  }
}