import { inject, injectable } from "inversify";
import { Request, Response } from "express";
import { TYPES } from "../../core/types/types";
import { IUserAuthController } from "../../core/interfaces/controllers/user/IUserAuth.controllers";
import { IUserAuthService } from "../../core/interfaces/services/user/IUserAuthService";
import { IOTPService } from "../../core/interfaces/services/IOtpService";
import { StatusCode } from "../../enums/statusCode.enum";
import { JwtService } from "../../utils/jwt";
import logger from "../../utils/logger";
import { OAuth2Client } from "google-auth-library";
import { IJwtService } from "../../core/interfaces/services/IJwtService";
import passport from "passport";
import { z } from "zod";
import {
  loginSchema,
  registerSchema,
  verifyOtpSchema,
  checkUsernameSchema,
} from "../../validations/auth.validations";

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
      const validatedData = registerSchema.parse(req.body);
      const { username, email, password } = validatedData;
      await this._userAuthService.registerUser(username, email, password);
      await this._otpService.requestOtp(email, "user");
      res
        .status(StatusCode.OK)
        .json({ success: true, message: "OTP sent successfully" });
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(StatusCode.BAD_REQUEST).json({ error: error.issues });
      } else {
        res
          .status(StatusCode.BAD_REQUEST)
          .json({ error: (error as Error).message });
      }
      logger.error("Error registering user", error);
    }
  };

  requestOtp = async (req: Request, res: Response) => {
    try {
      const { email } = req.body;
      await this._otpService.requestOtp(email, "user");
      res
        .status(StatusCode.OK)
        .json({ success: true, message: "OTP sent successfully" });
    } catch (error) {
      res
        .status(StatusCode.BAD_REQUEST)
        .json({ error: (error as Error).message });
      logger.error("Error requesting OTP", error);
    }
  };

  verifyOtp = async (req: Request, res: Response) => {
    try {
      const validatedData = verifyOtpSchema.parse(req.body);
      const { username, email, password, otp } = validatedData;
      logger.info(
        `username: ${username}, email: ${email}, password: ${password}, otp: ${otp}`
      );
      await this._otpService.verifyOtp(email, otp);
      const { user, accessToken, refreshToken } =
        await this._userAuthService.verifyAndRegisterUser(
          username,
          email,
          password
        );
      // logger.info(`User registered successfully: ${user}, accessToken: ${accessToken}, refreshToken: ${refreshToken}`)
      this._jwtService.setTokens(res, accessToken, refreshToken);
      res.status(StatusCode.CREATED).json({ success: true, user });
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(StatusCode.BAD_REQUEST).json({ error: error.issues });
      } else {
        res
          .status(StatusCode.BAD_REQUEST)
          .json({ error: (error as Error).message });
      }
      logger.error("Error verifying OTP", error);
    }
  };

  checkUsername = async (req: Request, res: Response) => {
    try {
      const { username } = checkUsernameSchema.parse(req.body);
      const isAvailable =
        await this._userAuthService.checkUsernameAvailability(username);
      res.status(StatusCode.OK).json({ available: isAvailable });
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(StatusCode.BAD_REQUEST).json({ error: error.issues });
      } else {
        res
          .status(StatusCode.BAD_REQUEST)
          .json({ error: (error as Error).message });
      }
      logger.error("Error checking username", error);
    }
  };

  generateUsername = async (req: Request, res: Response) => {
    try {
      const username = await this._userAuthService.generateUsername();
      res.status(StatusCode.OK).json({ username });
    } catch (error) {
      res
        .status(StatusCode.BAD_REQUEST)
        .json({ error: (error as Error).message });
      logger.error("Error generating username", error);
    }
  };

  forgotPassword = async (req: Request, res: Response) => {
    try {
      const { email } = req.body;
      await this._otpService.requestForgotPasswordOtp(email, "user");
      res.status(StatusCode.OK).json({ message: "OTP sent successfully" });
    } catch (error: any) {
      res
        .status(error.statusCode || StatusCode.BAD_REQUEST)
        .json({ message: "Error requesting OTP", error: error.message });
      logger.error("Error requesting forgot password OTP", error);
    }
  };

  verifyForgotPasswordOtp = async (req: Request, res: Response) => {
    try {
      const { email, otp } = req.body;
      await this._otpService.verifyOtp(email, otp);
      res
        .status(StatusCode.OK)
        .json({ message: "Forgot Password OTP verified successfully" });
    } catch (error: any) {
      res.status(StatusCode.BAD_REQUEST).json({ error: error.message });
      logger.error("Error verifying forgot password OTP", error);
    }
  };

  resetPassword = async (req: Request, res: Response) => {
    try {
      const { email, newPassword } = req.body;
      await this._userAuthService.resetPassword(email, newPassword);
      res
        .status(StatusCode.OK)
        .json({ message: "Password reset successfully" });
    } catch (error: any) {
      res.status(StatusCode.BAD_REQUEST).json({ error: error.message });
      logger.error("Error resetting password", error);
    }
  };

  login = async (req: Request, res: Response) => {
    try {
      const validatedData = loginSchema.parse(req.body);
      const { email, password } = validatedData;
      const { user, accessToken, refreshToken } =
        await this._userAuthService.loginUser(email, password);
        // console.log("Login successful:", { user, accessToken, refreshToken });
      this._jwtService.setTokens(res, accessToken, refreshToken);
      res.status(StatusCode.OK).json({ user });
    } catch (error: any) {
      res
        .status(error.statusCode || StatusCode.UNAUTHORIZED)
        .json({ error: error.message });
      logger.error("Error logging in", error);
    }
  };

  resendOtp = async (req: Request, res: Response) => {
    try {
      const { email } = req.body;
      await this._otpService.requestOtp(email, "user");
      res.status(StatusCode.OK).json({ message: "OTP resent successfully" });
    } catch (error: any) {
      res.status(StatusCode.BAD_REQUEST).json({ error: error.message });
    }
  };

  refreshAccessToken = async (req: Request, res: Response) => {
    try {
      const { refreshToken } = req.cookies;
      if (!refreshToken) {
        return res
          .status(StatusCode.UNAUTHORIZED)
          .json({ error: "Refresh token is required" });
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

      return res
        .status(StatusCode.OK)
        .json({ accessToken, refreshToken: newRefreshToken });
    } catch (error) {
      logger.error("Error refreshing access token", error);
      return res.status(StatusCode.UNAUTHORIZED).json({ error: error });
    }
  };

  googleLogin = async (req: Request, res: Response) => {
    const { idToken } = req.body;
    if (!idToken) {
      res
        .status(StatusCode.BAD_REQUEST)
        .json({ message: "Id token is required" });
      return;
    }
    try {
      const { user, accessToken, refreshToken } =
        await this._userAuthService.loginWithGoogle(idToken);
      this._jwtService.setTokens(res, accessToken, refreshToken);
      res.status(StatusCode.OK).json({ user });
    } catch (error) {
      res
        .status(StatusCode.BAD_REQUEST)
        .json({ error: error || "Login Failed" });
      logger.error("Error logging in with Google", error);
    }
  };

  googleCallback = (req: Request, res: Response) => {
    passport.authenticate(
      "google",
      { session: false },
      async (error, user, info) => {
        if (error || !user) {
          return res.redirect("http://localhost:3000/signup?error=auth_failed");
        }
        try {
          const { accessToken, refreshToken } =
            await this._userAuthService.loginWithGoogle(user);
          this._jwtService.setTokens(res, accessToken, refreshToken);
          res.redirect(`http://localhost:3000/callback?token=${accessToken}`);
        } catch (error: any) {
          res.redirect(
            `http://localhost:3000/signup?error=${encodeURIComponent(error.message)}`
          );
        }
      }
    )(req, res);
  };

  logout = async (req: Request, res: Response) => {
    try {
      this._jwtService.clearTokens(res);
      logger.info("User logged out successfully");
      res.status(StatusCode.OK).json({ message: "Logged out successfully" });
    } catch (error) {
      res.status(StatusCode.INTERNAL_SERVER_ERROR).json({ error: error });
      logger.error("Error logging out", error);
    }
  };
}
