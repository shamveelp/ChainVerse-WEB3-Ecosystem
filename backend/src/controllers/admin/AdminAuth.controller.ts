import { Request, Response } from "express";
import { injectable, inject } from "inversify";
import { IAdminAuthController } from "../../core/interfaces/controllers/admin/IAuthAdmin.controllers";
import { IAdminAuthService } from "../../core/interfaces/services/admin/IAdminAuthService";
import { IOTPService } from "../../core/interfaces/services/IOtpService";
import { IJwtService } from "../../core/interfaces/services/IJwtService";
import { TYPES } from "../../core/types/types";
import logger from "../../utils/logger";
import { StatusCode } from "../../enums/statusCode.enum";
import { ErrorMessages, SuccessMessages, LoggerMessages } from "../../enums/messages.enum";
import { AdminResponseDto, AdminLoginResponseDto } from "../../dtos/admin/AdminAuth.dto";
import bcrypt from "bcryptjs";

@injectable()
export class AdminAuthController implements IAdminAuthController {
  constructor(
    @inject(TYPES.IAdminAuthService) private _adminAuthService: IAdminAuthService,
    @inject(TYPES.IJwtService) private _jwtService: IJwtService,
    @inject(TYPES.IOtpService) private _otpService: IOTPService,
  ) { }

  async login(req: Request, res: Response): Promise<void> {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        res.status(StatusCode.BAD_REQUEST).json({
          success: false,
          message: ErrorMessages.EMAIL_PASSWORD_REQUIRED,
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

      logger.info(`${SuccessMessages.ADMIN_LOGGED_IN}: ${email}`);
    } catch (error) {
      const err = error as Error;
      logger.error(LoggerMessages.ADMIN_LOGIN_ERROR, err);
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
      logger.info(SuccessMessages.ADMIN_LOGGED_OUT);
    } catch (error) {
      const err = error as Error;
      logger.error(LoggerMessages.ADMIN_LOGOUT_ERROR, err);
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
          message: ErrorMessages.EMAIL_REQUIRED,
        });
        return;
      }

      await this._otpService.requestForgotPasswordOtp(email, 'admin');

      res.status(StatusCode.OK).json({
        success: true,
        message: SuccessMessages.OTP_SENT,
      });

      logger.info(`Forgot password OTP sent to admin: ${email}`);
    } catch (error) {
      const err = error as Error;
      logger.error(LoggerMessages.ADMIN_FORGOT_PASSWORD_ERROR, err);
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
          message: ErrorMessages.EMAIL_OTP_REQUIRED,
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
        message: SuccessMessages.OTP_VERIFIED,
      });

      logger.info(`Forgot password OTP verified for admin: ${email}`);
    } catch (error) {
      const err = error as Error;
      logger.error(LoggerMessages.ADMIN_VERIFY_OTP_ERROR, err);
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
          message: ErrorMessages.EMAIL_PASSWORD_REQUIRED,
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
      logger.error(LoggerMessages.ADMIN_RESET_PASSWORD_ERROR, err);
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
      logger.error(LoggerMessages.GET_ADMIN_PROFILE_ERROR, err);
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
          message: ErrorMessages.CURRENT_NEW_PASSWORD_REQUIRED,
        });
        return;
      }

      await this._adminAuthService.changePassword(adminId, currentPassword, newPassword);

      res.status(StatusCode.OK).json({
        success: true,
        message: SuccessMessages.PASSWORD_CHANGED,
      });

      logger.info(`Password changed for admin: ${adminId}`);
    } catch (error) {
      const err = error as Error;
      logger.error(LoggerMessages.ADMIN_CHANGE_PASSWORD_ERROR, err);
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
          message: ErrorMessages.REFRESH_TOKEN_REQUIRED,
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
          message: ErrorMessages.INVALID_REFRESH_TOKEN,
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
        message: SuccessMessages.TOKEN_REFRESHED,
      });

      logger.info(`Token refreshed for admin: ${admin.email}`);
    } catch (error) {
      const err = error as Error;
      logger.error(LoggerMessages.ADMIN_REFRESH_TOKEN_ERROR, error);
      res.status(StatusCode.UNAUTHORIZED).json({
        success: false,
        message: err.message || ErrorMessages.INVALID_TOKEN,
      });
    }
  }
}