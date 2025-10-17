import { Request, Response } from "express";
import { injectable, inject } from "inversify";
import { IAdminAuthController } from "../../core/interfaces/controllers/admin/IAuthAdmin.controllers";
import { IAdminAuthService } from "../../core/interfaces/services/admin/IAdminAuthService";
import { IOTPService } from "../../core/interfaces/services/IOtpService";
import { IJwtService } from "../../core/interfaces/services/IJwtService";
import { TYPES } from "../../core/types/types";
import logger from "../../utils/logger";
import { StatusCode } from "../../enums/statusCode.enum";
import { ErrorMessages, SuccessMessages } from "../../enums/messages.enum";
import { AdminResponseDto, AdminLoginResponseDto } from "../../dtos/admin/AdminAuth.dto";
import bcrypt from "bcryptjs";

@injectable()
export class AdminAuthController implements IAdminAuthController {
  constructor(
    @inject(TYPES.IAdminAuthService) private _adminAuthService: IAdminAuthService,
    @inject(TYPES.IJwtService) private _jwtService: IJwtService,
    @inject(TYPES.IOtpService) private _otpService: IOTPService,
  ) {}

  async login(req: Request, res: Response): Promise<void> {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      res.status(StatusCode.BAD_REQUEST).json({
        success: false,
        message: "Email and password are required",
      });
      return;
    }

    const result = await this._adminAuthService.login(email, password);
    
    this._jwtService.setTokens(res, result.accessToken, result.refreshToken);
    
    const response = new AdminLoginResponseDto(result.admin, SuccessMessages.ADMIN_LOGGED_IN);
    res.status(StatusCode.OK).json({
      ...response,
      accessToken: result.accessToken,
    });
    
    logger.info(`Admin logged in successfully: ${email}`);
  } catch (error) {
    const err = error as Error;
    logger.error("Admin login error:", err);
    res.status(StatusCode.UNAUTHORIZED).json({
      success: false,
      message: err.message || ErrorMessages.INVALID_CREDENTIALS,
    });
  }
}

  async logout(req: Request, res: Response): Promise<void> {
    try {
      this._jwtService.clearTokens(res);

      await this._adminAuthService.incrementTokenVersion((req as any).user.id);
      res.status(StatusCode.OK).json({
        success: true,
        message: SuccessMessages.ADMIN_LOGGED_OUT,
      });
      logger.info("Admin logged out successfully");
    } catch (error) {
      const err = error as Error;
      logger.error("Admin logout error:", err);
      res.status(StatusCode.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: ErrorMessages.SERVER_ERROR,
      });
    }
  }

  async forgotPassword(req: Request, res: Response): Promise<void> {
    try {
      const { email } = req.body;
      
      if (!email) {
        res.status(StatusCode.BAD_REQUEST).json({
          success: false,
          message: "Email is required",
        });
        return;
      }

      await this._otpService.requestForgotPasswordOtp(email, 'admin');
      
      res.status(StatusCode.OK).json({
        success: true,
        message: "OTP sent to your email for password reset",
      });
      
      logger.info(`Forgot password OTP sent to admin: ${email}`);
    } catch (error) {
      const err = error as Error;
      logger.error("Admin forgot password error:", err);
      res.status(StatusCode.BAD_REQUEST).json({
        success: false,
        message: err.message || ErrorMessages.SERVER_ERROR,
      });
    }
  }

  async verifyForgotPasswordOtp(req: Request, res: Response): Promise<void> {
    try {
      const { email, otp } = req.body;
      
      if (!email || !otp) {
        res.status(StatusCode.BAD_REQUEST).json({
          success: false,
          message: "Email and OTP are required",
        });
        return;
      }

      const isValid = await this._otpService.verifyOtp(email, otp);
      if (!isValid) {
        res.status(StatusCode.BAD_REQUEST).json({
          success: false,
          message: ErrorMessages.INVALID_OTP,
        });
        return;
      }

      res.status(StatusCode.OK).json({
        success: true,
        message: "OTP verified. You can now reset your password.",
      });
      
      logger.info(`Forgot password OTP verified for admin: ${email}`);
    } catch (error) {
      const err = error as Error;
      logger.error("Admin verify forgot password OTP error:", err);
      res.status(StatusCode.BAD_REQUEST).json({
        success: false,
        message: err.message || ErrorMessages.SERVER_ERROR,
      });
    }
  }

  async resetPassword(req: Request, res: Response): Promise<void> {
    try {
      const { email, password } = req.body;
      
      if (!email || !password) {
        res.status(StatusCode.BAD_REQUEST).json({
          success: false,
          message: "Email and password are required",
        });
        return;
      }

      await this._adminAuthService.resetPassword(email, password);
      
      res.status(StatusCode.OK).json({
        success: true,
        message: SuccessMessages.PASSWORD_RESET,
      });
      
      logger.info(`Password reset successful for admin: ${email}`);
    } catch (error) {
      const err = error as Error;
      logger.error("Admin reset password error:", err);
      res.status(StatusCode.BAD_REQUEST).json({
        success: false,
        message: err.message || ErrorMessages.SERVER_ERROR,
      });
    }
  }

  async getProfile(req: Request, res: Response): Promise<void> {
    try {
      const adminId = (req as any).user.id;
      const admin = await this._adminAuthService.getAdminById(adminId);
      
      if (!admin) {
        res.status(StatusCode.NOT_FOUND).json({
          success: false,
          message: ErrorMessages.ADMIN_NOT_FOUND,
        });
        return;
      }

      const response = new AdminResponseDto(admin);
      res.status(StatusCode.OK).json({
        success: true,
        admin: response,
      });
    } catch (error) {
      const err = error as Error;
      logger.error("Get admin profile error:", err);
      res.status(StatusCode.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: ErrorMessages.SERVER_ERROR,
      });
    }
  }

  async changePassword(req: Request, res: Response): Promise<void> {
    try {
      const adminId = (req as any).user.id;
      const { currentPassword, newPassword } = req.body;
      
      if (!currentPassword || !newPassword) {
        res.status(StatusCode.BAD_REQUEST).json({
          success: false,
          message: "Current password and new password are required",
        });
        return;
      }

      await this._adminAuthService.changePassword(adminId, currentPassword, newPassword);
      
      res.status(StatusCode.OK).json({
        success: true,
        message: "Password changed successfully",
      });
      
      logger.info(`Password changed for admin: ${adminId}`);
    } catch (error) {
      const err = error as Error;
      logger.error("Admin change password error:", err);
      res.status(StatusCode.BAD_REQUEST).json({
        success: false,
        message: err.message || ErrorMessages.SERVER_ERROR,
      });
    }
  }

  async refreshToken(req: Request, res: Response): Promise<void> {
  try {
    const refreshToken = req.cookies?.refreshToken;
    if (!refreshToken) {
      res.status(StatusCode.UNAUTHORIZED).json({
        success: false,
        message: "Refresh token is required",
      });
      return;
    }

    const decoded = this._jwtService.verifyRefreshToken(refreshToken);
    const admin = await this._adminAuthService.getAdminById(decoded.id);

    if (!admin) {
      res.status(StatusCode.UNAUTHORIZED).json({
        success: false,
        message: ErrorMessages.ADMIN_NOT_FOUND,
      });
      return;
    }

    if (decoded.tokenVersion !== admin.tokenVersion) {
      res.status(StatusCode.UNAUTHORIZED).json({
        success: false,
        message: "Invalid refresh token",
      });
      return;
    }

    const newAccessToken = this._jwtService.generateAccessToken(
      admin._id.toString(),
      admin.role,
      admin.tokenVersion ?? 0
    );

    this._jwtService.setAccessToken(res, newAccessToken);

    res.status(StatusCode.OK).json({
      success: true,
      accessToken: newAccessToken,
      message: "Token refreshed successfully",
    });

    logger.info(`Token refreshed for admin: ${admin.email}`);
  } catch (error) {
    const err = error as Error;
    logger.error("Admin refresh token error:", error);
    res.status(StatusCode.UNAUTHORIZED).json({
      success: false,
      message: err.message || ErrorMessages.INVALID_TOKEN,
    });
  }
}
}