import { inject, injectable } from "inversify";
import { Request, Response } from "express";
import { TYPES } from "../../core/types/types";
import { IUserAuthController } from "../../core/interfaces/controllers/user/IUserAuth.controllers";
import { IUserAuthService } from "../../core/interfaces/services/user/IUserAuth.service";
import { IOTPService } from "../../core/interfaces/services/IOTP.service";
import { StatusCode } from "../../enums/statusCode.enum";
import logger from "../../utils/logger";
import { OAuth2Client } from "google-auth-library";
import { IJwtService } from "../../core/interfaces/services/IJwtService";
import { CustomError } from "../../utils/customError";
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
import { SuccessMessages, ErrorMessages, LoggerMessages } from "../../enums/messages.enum";

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

  /**
   * Registers a new user.
   * @param req - Express Request object containing registration details.
   * @param res - Express Response object.
   */
  register = async (req: Request, res: Response) => {
    try {
      const registerDto = req.body as UserRegisterDto;
      const { username, email, password, name, referralCode } = registerDto;

      logger.info(`Starting registration validation for email: ${email}, username: ${username}`);

      await this._userAuthService.registerUser(username!, email!, password!, name!, referralCode);

      await this._otpService.requestOtp(email!, "user");

      const response = new RegisterResponseDto(SuccessMessages.REGISTRATION_INITIATED);
      res.status(StatusCode.OK).json(response);
    } catch (error) {
      logger.error(LoggerMessages.REGISTER_ERROR, error);
      const errorMessage = error instanceof CustomError ? error.message : ErrorMessages.VALIDATION_ERROR;
      const statusCode = error instanceof CustomError ? error.statusCode : StatusCode.BAD_REQUEST;

      res.status(statusCode).json({
        success: false,
        error: errorMessage
      });
    }
  };

  /**
   * Requests an OTP for generic purposes.
   * @param req - Express Request object containing email.
   * @param res - Express Response object.
   */
  requestOtp = async (req: Request, res: Response) => {
    try {
      const requestOtpDto = req.body as RequestOtpDto;
      const { email } = requestOtpDto;

      await this._otpService.requestOtp(email!, "user");
      res.status(StatusCode.OK).json({
        success: true,
        message: SuccessMessages.OTP_SENT
      });
    } catch (error) {
      const errorMessage = error instanceof CustomError ? error.message : ErrorMessages.FAILED_RESEND_OTP;
      res.status(StatusCode.BAD_REQUEST).json({
        success: false,
        error: errorMessage
      });
      logger.error(LoggerMessages.REQUEST_OTP_ERROR, error);
    }
  };

  /**
   * Verifies OTP and completes value-sensitive operations.
   * @param req - Express Request object containing OTP and other details.
   * @param res - Express Response object.
   */
  verifyOtp = async (req: Request, res: Response) => {
    try {
      const verifyOtpDto = req.body as VerifyOtpDto;
      const { username, email, password, name, otp, referralCode } = verifyOtpDto;

      logger.info(`Verifying OTP for email: ${email}, username: ${username}`);

      await this._otpService.verifyOtp(email!, otp!);

      const { user, accessToken, refreshToken } = await this._userAuthService.verifyAndRegisterUser(
        username!,
        email!,
        password!,
        name!,
        referralCode
      );

      this._jwtService.setTokens(res, accessToken, refreshToken);

      const response = new LoginResponseDto(user, accessToken, SuccessMessages.USER_REGISTERED);
      res.status(StatusCode.CREATED).json(response);
    } catch (error) {
      logger.error(LoggerMessages.VERIFY_OTP_ERROR, error);
      const errorMessage = error instanceof CustomError ? error.message : ErrorMessages.FAILED_OTP_VERIFICATION;
      const statusCode = error instanceof CustomError ? error.statusCode : StatusCode.BAD_REQUEST;

      res.status(statusCode).json({
        success: false,
        error: errorMessage
      });
    }
  };

  /**
   * Checks if a username is available.
   * @param req - Express Request object containing username in body.
   * @param res - Express Response object.
   */
  checkUsername = async (req: Request, res: Response) => {
    try {

      const checkUsernameDto = req.body as CheckUsernameDto;
      const { username } = checkUsernameDto;

      const isAvailable = await this._userAuthService.checkUsernameAvailability(username!);
      const response = new UsernameCheckResponseDto(isAvailable);
      res.status(StatusCode.OK).json(response);
    } catch (error) {
      logger.error(LoggerMessages.CHECK_USERNAME_AVAILABILITY_ERROR, error);
      res.status(StatusCode.BAD_REQUEST).json({
        success: false,
        error: ErrorMessages.FAILED_CHECK_USERNAME
      });
    }
  };

  /**
   * Generates a random username.
   * @param req - Express Request object.
   * @param res - Express Response object.
   */
  generateUsername = async (req: Request, res: Response) => {
    try {
      const username = await this._userAuthService.generateUsername();

      res.status(StatusCode.OK).json({
        success: true,
        username
      });
    } catch (error) {
      logger.error(LoggerMessages.GENERATE_USERNAME_ERROR, error);
      res.status(StatusCode.BAD_REQUEST).json({
        success: false,
        error: ErrorMessages.FAILED_GENERATE_USERNAME
      });
    }
  };

  /**
   * Initiates the forgot password process.
   * @param req - Express Request object containing email.
   * @param res - Express Response object.
   */
  forgotPassword = async (req: Request, res: Response) => {
    try {
      const forgotPasswordDto = req.body as ForgotPasswordDto;
      const { email } = forgotPasswordDto;

      await this._otpService.requestForgotPasswordOtp(email!, "user");
      res.status(StatusCode.OK).json({
        success: true,
        message: SuccessMessages.PASSWORD_RESET_OTP_SENT
      });
    } catch (error) {
      logger.error(LoggerMessages.FORGOT_PASSWORD_OTP_ERROR, error);
      const errorMessage = error instanceof CustomError ? error.message : ErrorMessages.FAILED_RESET_CODE;
      const statusCode = error instanceof CustomError ? error.statusCode : StatusCode.BAD_REQUEST;

      res.status(statusCode).json({
        success: false,
        error: errorMessage
      });
    }
  };

  /**
   * Verifies the OTP for forgot password.
   * @param req - Express Request object containing email and otp.
   * @param res - Express Response object.
   */
  verifyForgotPasswordOtp = async (req: Request, res: Response) => {
    try {
      const { email, otp } = req.body;

      await this._otpService.verifyOtp(email, otp);
      res.status(StatusCode.OK).json({
        success: true,
        message: SuccessMessages.OTP_VERIFIED
      });
    } catch (error) {
      logger.error(LoggerMessages.VERIFY_FORGOT_PASSWORD_OTP_ERROR, error);
      const errorMessage = error instanceof CustomError ? error.message : ErrorMessages.INVALID_OTP;

      res.status(StatusCode.BAD_REQUEST).json({
        success: false,
        error: errorMessage
      });
    }
  };

  /**
   * Resets the user's password.
   * @param req - Express Request object containing email and new password.
   * @param res - Express Response object.
   */
  resetPassword = async (req: Request, res: Response) => {
    try {
      const resetPasswordDto = req.body as ResetPasswordDto;
      const { email, newPassword } = resetPasswordDto;

      await this._userAuthService.resetPassword(email!, newPassword!);
      res.status(StatusCode.OK).json({
        success: true,
        message: SuccessMessages.PASSWORD_RESET
      });
    } catch (error) {
      logger.error(LoggerMessages.RESET_PASSWORD_ERROR, error);
      const errorMessage = error instanceof CustomError ? error.message : ErrorMessages.FAILED_RESET_PASSWORD;

      res.status(StatusCode.BAD_REQUEST).json({
        success: false,
        error: errorMessage
      });
    }
  };

  /**
   * Logs in a user.
   * @param req - Express Request object containing login credentials.
   * @param res - Express Response object.
   */
  login = async (req: Request, res: Response) => {
    try {
      const loginDto = req.body as UserLoginDto;
      const { email, password } = loginDto;

      const { user, accessToken, refreshToken } = await this._userAuthService.loginUser(email!, password!);

      this._jwtService.setTokens(res, accessToken, refreshToken);

      const response = new LoginResponseDto(user, accessToken, SuccessMessages.USER_LOGGED_IN);
      res.status(StatusCode.OK).json(response);
    } catch (error) {
      logger.error(LoggerMessages.LOGIN_ERROR, error);
      const errorMessage = error instanceof CustomError ? error.message : ErrorMessages.FAILED_LOGIN;
      const statusCode = error instanceof CustomError ? error.statusCode : StatusCode.UNAUTHORIZED;

      res.status(statusCode).json({
        success: false,
        error: errorMessage
      });
    }
  };

  /**
   * Resends the OTP.
   * @param req - Express Request object containing email.
   * @param res - Express Response object.
   */
  resendOtp = async (req: Request, res: Response) => {
    try {
      const { email } = req.body;

      await this._otpService.requestOtp(email, "user");
      res.status(StatusCode.OK).json({
        success: true,
        message: SuccessMessages.OTP_RESENT
      });
    } catch (error) {
      logger.error(LoggerMessages.RESEND_OTP_ERROR, error);
      res.status(StatusCode.BAD_REQUEST).json({
        success: false,
        error: ErrorMessages.FAILED_RESEND_OTP
      });
    }
  };

  /**
   * Refreshes the access token using a refresh token.
   * @param req - Express Request object containing cookies.
   * @param res - Express Response object.
   */
  refreshAccessToken = async (req: Request, res: Response) => {
    try {
      const { refreshToken } = req.cookies;

      if (!refreshToken) {
        return res.status(StatusCode.UNAUTHORIZED).json({
          success: false,
          error: ErrorMessages.REFRESH_TOKEN_REQUIRED
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
      logger.error(LoggerMessages.REFRESH_TOKEN_ERROR, error);
      return res.status(StatusCode.UNAUTHORIZED).json({
        success: false,
        error: ErrorMessages.INVALID_REFRESH_TOKEN
      });
    }
  };

  /**
   * Logs in a user using Google OAuth.
   * @param req - Express Request object containing Google ID token.
   * @param res - Express Response object.
   */
  googleLogin = async (req: Request, res: Response) => {
    try {
      const googleLoginDto = req.body as GoogleLoginDto;
      const { token: idToken, referralCode } = googleLoginDto;

      if (!idToken) {
        res.status(StatusCode.BAD_REQUEST).json({
          success: false,
          error: ErrorMessages.GOOGLE_ID_TOKEN_REQUIRED
        });
      }

      const { user, accessToken, refreshToken } = await this._userAuthService.loginWithGoogle(idToken as any, referralCode);
      this._jwtService.setTokens(res, accessToken, refreshToken);

      const response = new LoginResponseDto(user, accessToken, SuccessMessages.GOOGLE_LOGIN_SUCCESS);
      res.status(StatusCode.OK).json(response);
    } catch (error) {
      logger.error(LoggerMessages.GOOGLE_LOGIN_ERROR, error);
      const errorMessage = error instanceof CustomError ? error.message : ErrorMessages.GOOGLE_LOGIN_FAILED;

      res.status(StatusCode.BAD_REQUEST).json({
        success: false,
        error: errorMessage
      });
    }
  };

  /**
   * Logs out the user.
   * @param req - Express Request object.
   * @param res - Express Response object.
   */
  logout = async (req: Request, res: Response) => {
    try {
      this._jwtService.clearTokens(res);
      logger.info("User logged out successfully");
      res.status(StatusCode.OK).json({
        success: true,
        message: SuccessMessages.USER_LOGGED_OUT
      });
    } catch (error) {
      logger.error(LoggerMessages.LOGOUT_ERROR, error);
      res.status(StatusCode.INTERNAL_SERVER_ERROR).json({
        success: false,
        error: ErrorMessages.FAILED_LOGOUT
      });
    }
  };
}