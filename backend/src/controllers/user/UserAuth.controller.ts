import { inject, injectable } from "inversify";
import { Request, Response } from "express";
import { TYPES } from "../../core/types/types";
import { IUserAuthController } from "../../core/interfaces/controllers/user/IUserAuth.controllers";
import { IUserAuthService } from "../../core/interfaces/services/user/IUserAuthService";
import { IOTPService } from "../../core/interfaces/services/IOtpService";
import { StatusCode } from "../../enums/statusCode.enum";
import { JwtService } from "../../utils/jwt";
import logger from "../../utils/logger";
import { IRedisClient } from "../../config/redis";
import { OAuth2Client } from "google-auth-library";
import dotenv from 'dotenv'
import { OAuthClient } from "../../utils/OAuthClient";
dotenv.config()

@injectable()
export class UserAuthController implements IUserAuthController {
  private googleClient: OAuth2Client
  constructor(
    @inject(TYPES.IUserAuthService) private userAuthService: IUserAuthService,
    @inject(TYPES.IOtpService) private otpService: IOTPService,
    @inject(TYPES.JwtService) private jwtService: JwtService,
    @inject(TYPES.OAuthClient) private oauthClient: OAuthClient,
    // @inject(TYPES.IRedisClient) private _redisClient: IRedisClient
  ) {
    this.googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID)
  }


  requestOtp = async (req: Request, res: Response) => {
    try {
      const { email } = req.body;
      const otpResponse = await this.otpService.requestOtp(email);
      res
        .status(StatusCode.OK)
        .json({ message: "OTP sent successfully", data: otpResponse });
    } catch (error) {
      res
        .status(StatusCode.BAD_REQUEST)
        .json({ message: "Error requesting OTP", error: error });
      logger.error("Error requesting OTP", error);
    }
  };

  verifyOtp = async (req: Request, res: Response) => {
    try {
      const { email, otp, name, password } = req.body;
      const isVerified = await this.otpService.verifyOtp(email, otp);
      const { user, accessToken, refreshToken } =
        await this.userAuthService.registerUser(name, email, password);
      this.jwtService.setTokens(res, accessToken, refreshToken);
      res.status(StatusCode.CREATED).json({ user });
    } catch (error) {
      res.status(StatusCode.BAD_REQUEST).json({ error: error });
      logger.error("Error verifying OTP", error);
    }
  };

  forgotPassword = async (req: Request, res: Response) => {
    try {
      const { email } = req.body
      await this.otpService.requestForgotPasswordOtp(email) // OTP is sent via email
      const resetToken = this.jwtService.generateResetToken(email) // Generate a JWT reset token
      res.status(StatusCode.OK).json({ message: "OTP sent successfully", resetToken }) // Send the JWT reset token
    } catch (error: any) {
      res
        .status(error.statusCode || StatusCode.BAD_REQUEST)
        .json({ message: "Error requesting OTP", error: error.message })
      logger.error("Error requesting forgot password OTP", error)
    }
  }

  verifyForgotPasswordOtp = async (req: Request, res: Response) => {
    try {
      const { resetToken, otp } = req.body // Expect resetToken from frontend
      const decoded = this.jwtService.verifyResetToken(resetToken) // Verify the initial reset token
      const email = decoded.email

      await this.otpService.verifyOtp(email, otp) // Verify the OTP for the extracted email

      // If OTP is verified, generate a new token for password reset
      const passwordResetToken = this.jwtService.generatePasswordResetToken(email)
      res.status(StatusCode.OK).json({ message: "Forgot Password OTP verified successfully", passwordResetToken })
    } catch (error: any) {
      res
        .status(error.statusCode || StatusCode.BAD_REQUEST)
        .json({ error: error.message || "An unexpected error occurred." })
      logger.error("Error verifying forgot password OTP", error)
    }
  }

  resetPassword = async (req: Request, res: Response) => {
    try {
      const { passwordResetToken, newPassword } = req.body // Expect passwordResetToken from frontend
      const decoded = this.jwtService.verifyPasswordResetToken(passwordResetToken) // Verify the password reset token
      const email = decoded.email

      await this.userAuthService.resetPassword(email, newPassword)
      res.status(StatusCode.OK).json({ message: "Password reset successfully" })
    } catch (error: any) {
      res.status(error.statusCode || StatusCode.BAD_REQUEST).json({ error: error.message })
      logger.error("Error resetting password", error)
    }
  }

  login = async (req: Request, res: Response) => {
    try {
      const { email, password } = req.body;
      
      const { user, accessToken, refreshToken } = await this.userAuthService.loginUser(email, password);
      // console.log(accessToken, refreshToken);

      this.jwtService.setTokens(res, accessToken, refreshToken);
      res.status(StatusCode.OK).json({ user });
    } catch (error) {
      res.status(StatusCode.UNAUTHORIZED).json({ error: error });
      logger.error("Error logging in", error);
    }
  };

  refreshAccessToken = async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.cookies;
    if (!refreshToken) {
      return res
        .status(StatusCode.UNAUTHORIZED)
        .json({ message: "Refresh token is required" });
    }

    const decoded = this.jwtService.verifyRefreshToken(refreshToken);
    const accessToken = this.jwtService.generateAccessToken(decoded.id);
    this.jwtService.setAccessToken(res, accessToken);
    
    return res.status(StatusCode.OK).json({ accessToken });
  } catch (error) {
    logger.error("Error refreshing access token", error);
    return res.status(StatusCode.UNAUTHORIZED).json({ error: error });
  }
};


getCurrentUser = async (req: Request, res: Response) => {
    try {
      const userId = (req as any).userId // userId is set by authMiddleware
      if (!userId) {
        res.status(StatusCode.UNAUTHORIZED).json({ message: "User ID not found in token" })
      }
      const user = await this.userAuthService.getUserById(userId)
      if (!user) {
        res.status(StatusCode.NOT_FOUND).json({ message: "User not found" })
      }
      res.status(StatusCode.OK).json({ user })
    } catch (error: any) {
      logger.error("Error fetching current user", error)
      res.status(error.statusCode || StatusCode.INTERNAL_SERVER_ERROR).json({ error: error.message })
    }
  }


  logout = async (req: Request, res: Response) => {
    try {
      this.jwtService.clearTokens(res);
      logger.info("User logged out successfully");
      res.status(StatusCode.OK).json({ message: "Logged out successfully" });
    } catch (error) {
      res.status(StatusCode.INTERNAL_SERVER_ERROR).json({ error: error });
      logger.error("Error logging out", error);
    }
  };

  googleAuth = async (req: Request, res: Response): Promise<void> => {
    try {
      const { idToken } = req.body
      if (!idToken) {
        res.status(StatusCode.BAD_REQUEST).json({ message: "Google ID token is required" })
        return
      }

      // Use the injected oauthClient
      const payload = await this.oauthClient.verifyIdToken(idToken)

      if (!payload || !payload.email) {
        res.status(StatusCode.UNAUTHORIZED).json({ message: "Invalid Google ID token" })
        return
      }

      const email = payload.email
      const name = payload.name || payload.email

      let user
      try {
        user = await this.userAuthService.findUserByEmail(email)
      } catch (findError) {
        user = null // User not found
      }

      if (!user) {
        const { user: newUser, accessToken, refreshToken } = await this.userAuthService.registerGoogleUser(name, email)
        this.jwtService.setTokens(res, accessToken, refreshToken)
        res.status(StatusCode.CREATED).json({ user: newUser, message: "Google user registered and logged in" })
        return
      } else {
        const { user: existingUser, accessToken, refreshToken } = await this.userAuthService.loginGoogleUser(email)
        this.jwtService.setTokens(res, accessToken, refreshToken)
        res.status(StatusCode.OK).json({ user: existingUser, message: "Google user logged in" })
        return
      }
    } catch (error: any) {
      logger.error("Google authentication error:", error)
      res
        .status(error.statusCode || StatusCode.UNAUTHORIZED)
        .json({ error: error.message || "Google authentication failed" })
      return
    }
  }


}
