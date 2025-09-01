import { inject, injectable } from "inversify";
import { Request, Response } from "express";
import { TYPES } from "../../core/types/types";
import { IUserAuthController } from "../../core/interfaces/controllers/user/IUserAuth.controllers";
import { IUserAuthService } from "../../core/interfaces/services/user/IUserAuthService";
import { IOTPService } from "../../core/interfaces/services/IOtpService";
import { StatusCode } from "../../enums/statusCode.enum";
import logger from "../../utils/logger";
import { OAuth2Client } from "google-auth-library";
import { IJwtService } from "../../core/interfaces/services/IJwtService";
import { CustomError } from "../../utils/CustomError";
import { 
  UserRegisterDto, 
  UserLoginDto, 
  VerifyOtpDto, 
  CheckUsernameDto, 
  ForgotPasswordDto, 
  ResetPasswordDto,
  RequestOtpDto,
  GoogleLoginDto,
  LoginResponseDto,
  RegisterResponseDto,
  UsernameCheckResponseDto
} from "../../dtos/users/UserAuth.dto";

@injectable()
export class UserAuthController implements IUserAuthController {
  private googleClient: OAuth2Client;
  
  constructor(
    @inject(TYPES.IUserAuthService) private _userAuthService: IUserAuthService,
    @inject(TYPES.IOtpService) private _otpService: IOTPService,
    @inject(TYPES.IJwtService) private _jwtService: IJwtService
  ) {
    this.googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
  }

  register = async (req: Request, res: Response) => {
    try {
      const registerDto = req.body as UserRegisterDto;
      const { username, email, password, name, referralCode } = registerDto;
      
      logger.info(`Starting registration validation for email: ${email}, username: ${username}`);
      
      // Validate registration data and check availability
      await this._userAuthService.registerUser(username!, email!, password!, name!, referralCode);
      
      // Send OTP for email verification
      await this._otpService.requestOtp(email!, "user");
      
      const response = new RegisterResponseDto("Registration data validated. OTP sent to your email.");
      res.status(StatusCode.OK).json(response);
    } catch (error) {
      logger.error("Error in register:", error);
      const errorMessage = error instanceof CustomError ? error.message : "Registration validation failed";
      const statusCode = error instanceof CustomError ? error.statusCode : StatusCode.BAD_REQUEST;
      
      res.status(statusCode).json({ 
        success: false,
        error: errorMessage 
      });
    }
  };

  requestOtp = async (req: Request, res: Response) => {
    try {
      const requestOtpDto = req.body as RequestOtpDto;
      const { email } = requestOtpDto;
      
      await this._otpService.requestOtp(email!, "user");
      res.status(StatusCode.OK).json({ 
        success: true, 
        message: "OTP sent successfully" 
      });
    } catch (error) {
      const errorMessage = error instanceof CustomError ? error.message : "Failed to send OTP";
      res.status(StatusCode.BAD_REQUEST).json({ 
        success: false,
        error: errorMessage 
      });
      logger.error("Error requesting OTP:", error);
    }
  };

  verifyOtp = async (req: Request, res: Response) => {
    try {
      const verifyOtpDto = req.body as VerifyOtpDto;
      const { username, email, password, name, otp, referralCode } = verifyOtpDto;
      
      logger.info(`Verifying OTP for email: ${email}, username: ${username}`);
      
      // First verify the OTP
      await this._otpService.verifyOtp(email!, otp!);
      
      // Then create the user account
      const { user, accessToken, refreshToken } = await this._userAuthService.verifyAndRegisterUser(
        username!,
        email!,
        password!,
        name!,
        referralCode
      );
      
      // Set tokens in cookies
      this._jwtService.setTokens(res, accessToken, refreshToken);
      
      const response = new LoginResponseDto(user, accessToken, "Account created successfully");
      res.status(StatusCode.CREATED).json(response);
    } catch (error) {
      logger.error("Error verifying OTP:", error);
      const errorMessage = error instanceof CustomError ? error.message : "OTP verification failed";
      const statusCode = error instanceof CustomError ? error.statusCode : StatusCode.BAD_REQUEST;
      
      res.status(statusCode).json({ 
        success: false,
        error: errorMessage 
      });
    }
  };

  checkUsername = async (req: Request, res: Response) => {
    try {
      const checkUsernameDto = req.body as CheckUsernameDto;
      const { username } = checkUsernameDto;
      
      const isAvailable = await this._userAuthService.checkUsernameAvailability(username!);
      const response = new UsernameCheckResponseDto(isAvailable);
      res.status(StatusCode.OK).json(response);
    } catch (error) {
      logger.error("Error checking username:", error);
      res.status(StatusCode.BAD_REQUEST).json({ 
        success: false,
        error: "Failed to check username availability" 
      });
    }
  };

  generateUsername = async (req: Request, res: Response) => {
    try {
      const username = await this._userAuthService.generateUsername();
      res.status(StatusCode.OK).json({ 
        success: true,
        username 
      });
    } catch (error) {
      logger.error("Error generating username:", error);
      res.status(StatusCode.BAD_REQUEST).json({ 
        success: false,
        error: "Failed to generate username" 
      });
    }
  };

  forgotPassword = async (req: Request, res: Response) => {
    try {
      const forgotPasswordDto = req.body as ForgotPasswordDto;
      const { email } = forgotPasswordDto;
      
      await this._otpService.requestForgotPasswordOtp(email!, "user");
      res.status(StatusCode.OK).json({ 
        success: true,
        message: "Password reset OTP sent to your email" 
      });
    } catch (error) {
      logger.error("Error requesting forgot password OTP:", error);
      const errorMessage = error instanceof CustomError ? error.message : "Failed to send reset code";
      const statusCode = error instanceof CustomError ? error.statusCode : StatusCode.BAD_REQUEST;
      
      res.status(statusCode).json({ 
        success: false,
        error: errorMessage 
      });
    }
  };

  verifyForgotPasswordOtp = async (req: Request, res: Response) => {
    try {
      const { email, otp } = req.body;
      
      await this._otpService.verifyOtp(email, otp);
      res.status(StatusCode.OK).json({ 
        success: true,
        message: "OTP verified successfully. You can now reset your password." 
      });
    } catch (error) {
      logger.error("Error verifying forgot password OTP:", error);
      const errorMessage = error instanceof CustomError ? error.message : "Invalid or expired OTP";
      
      res.status(StatusCode.BAD_REQUEST).json({ 
        success: false,
        error: errorMessage 
      });
    }
  };

  resetPassword = async (req: Request, res: Response) => {
    try {
      const resetPasswordDto = req.body as ResetPasswordDto;
      const { email, newPassword } = resetPasswordDto;
      
      await this._userAuthService.resetPassword(email!, newPassword!);
      res.status(StatusCode.OK).json({ 
        success: true,
        message: "Password reset successfully" 
      });
    } catch (error) {
      logger.error("Error resetting password:", error);
      const errorMessage = error instanceof CustomError ? error.message : "Password reset failed";
      
      res.status(StatusCode.BAD_REQUEST).json({ 
        success: false,
        error: errorMessage 
      });
    }
  };

  login = async (req: Request, res: Response) => {
    try {
      const loginDto = req.body as UserLoginDto;
      const { email, password } = loginDto;
      
      const { user, accessToken, refreshToken } = await this._userAuthService.loginUser(email!, password!);
      
      this._jwtService.setTokens(res, accessToken, refreshToken);
      
      const response = new LoginResponseDto(user, accessToken, "Login successful");
      res.status(StatusCode.OK).json(response);
    } catch (error) {
      logger.error("Error logging in:", error);
      const errorMessage = error instanceof CustomError ? error.message : "Login failed";
      const statusCode = error instanceof CustomError ? error.statusCode : StatusCode.UNAUTHORIZED;
      
      res.status(statusCode).json({ 
        success: false,
        error: errorMessage 
      });
    }
  };

  resendOtp = async (req: Request, res: Response) => {
    try {
      const { email } = req.body;
      
      await this._otpService.requestOtp(email, "user");
      res.status(StatusCode.OK).json({ 
        success: true,
        message: "OTP resent successfully" 
      });
    } catch (error) {
      logger.error("Error resending OTP:", error);
      res.status(StatusCode.BAD_REQUEST).json({ 
        success: false,
        error: "Failed to resend OTP" 
      });
    }
  };

  refreshAccessToken = async (req: Request, res: Response) => {
    try {
      const { refreshToken } = req.cookies;
      
      if (!refreshToken) {
        return res.status(StatusCode.UNAUTHORIZED).json({ 
          success: false,
          error: "Refresh token is required" 
        });
      }

      const decoded = this._jwtService.verifyRefreshToken(refreshToken) as {
        id: string;
        role: string;
        tokenVersion?: number;
      };
      
      const accessToken = this._jwtService.generateAccessToken(
        decoded.id,
        decoded.role,
        decoded.tokenVersion ?? 0
      );
      const newRefreshToken = this._jwtService.generateRefreshToken(
        decoded.id,
        decoded.role,
        decoded.tokenVersion ?? 0
      );
      
      this._jwtService.setTokens(res, accessToken, newRefreshToken);

      return res.status(StatusCode.OK).json({ 
        success: true,
        accessToken, 
        refreshToken: newRefreshToken 
      });
    } catch (error) {
      logger.error("Error refreshing access token:", error);
      return res.status(StatusCode.UNAUTHORIZED).json({ 
        success: false,
        error: "Invalid refresh token" 
      });
    }
  };

  googleLogin = async (req: Request, res: Response) => {
    try {
      const googleLoginDto = req.body as GoogleLoginDto;
      const { token: idToken } = googleLoginDto;
      
      if (!idToken) {
        res.status(StatusCode.BAD_REQUEST).json({ 
          success: false,
          error: "Google ID token is required" 
        });
      }
      
      const { user, accessToken, refreshToken } = await this._userAuthService.loginWithGoogle(idToken as any);
      this._jwtService.setTokens(res, accessToken, refreshToken);
      
      const response = new LoginResponseDto(user, accessToken, "Google login successful");
      res.status(StatusCode.OK).json(response);
    } catch (error) {
      logger.error("Error logging in with Google:", error);
      const errorMessage = error instanceof CustomError ? error.message : "Google login failed";
      
      res.status(StatusCode.BAD_REQUEST).json({ 
        success: false,
        error: errorMessage 
      });
    }
  };

  logout = async (req: Request, res: Response) => {
    try {
      this._jwtService.clearTokens(res);
      logger.info("User logged out successfully");
      res.status(StatusCode.OK).json({ 
        success: true,
        message: "Logged out successfully" 
      });
    } catch (error) {
      logger.error("Error logging out:", error);
      res.status(StatusCode.INTERNAL_SERVER_ERROR).json({ 
        success: false,
        error: "Logout failed" 
      });
    }
  };
}