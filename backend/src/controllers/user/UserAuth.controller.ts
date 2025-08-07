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
import { IUserRepository } from "../../core/interfaces/repositories/IUserRepository";
import { IJwtService } from "../../core/interfaces/services/IJwtService";
dotenv.config()

@injectable()
export class UserAuthController implements IUserAuthController {
  private googleClient: OAuth2Client
  constructor(
    @inject(TYPES.IUserAuthService) private userAuthService: IUserAuthService,
    @inject(TYPES.IOtpService) private otpService: IOTPService,
    @inject(TYPES.IJwtService) private jwtService: IJwtService,
    @inject(TYPES.OAuthClient) private oauthClient: OAuth2Client,
    @inject(TYPES.IUserRepository) private userRepo: IUserRepository,
  ) {
    this.googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID)
  }


  requestOtp = async (req: Request, res: Response) => {
    try {
      const { email } = req.body;
      const otpResponse = await this.otpService.requestOtp(email,'user');
      res
        .status(StatusCode.OK)
        .json({ success:true,message: "OTP sent successfully", data: otpResponse });
    } catch (error: any) {
      res
        .status(StatusCode.BAD_REQUEST)
        .json({ message: "Error requesting OTP", error: error.message });
      logger.error("Error requesting OTP", error);
    }
  };

  verifyOtp = async (req: Request, res: Response) => {
    try {
      const { email, otp, name, password } = req.body;
      const isVerified = await this.otpService.verifyOtp(email, otp);
      const { user, accessToken, refreshToken } =
        await this.userAuthService.registerUser(name, email, password);
        //Set cookies
      this.jwtService.setTokens(res, accessToken, refreshToken);
      res.status(StatusCode.CREATED).json({ success: true,user });
    } catch (error) {
      res.status(StatusCode.BAD_REQUEST).json({ error: error });
      logger.error("Error verifying OTP", error);
    }
  };

  forgotPassword = async (req: Request, res: Response) => {
    try {
      const { email } = req.body
      await this.otpService.requestForgotPasswordOtp(email,'user') 
      res.status(StatusCode.OK).json({ message: "OTP sent successfully" }) 
    } catch (error: any) {
      res
        .status(error.statusCode || StatusCode.BAD_REQUEST)
        .json({ message: "Error requesting OTP", error: error.message })
      logger.error("Error requesting forgot password OTP", error)
    }
  }

  verifyForgotPasswordOtp = async (req: Request, res: Response) => {
    try {
      const { email, otp } = req.body 
      await this.otpService.verifyOtp(email, otp)
      res.status(StatusCode.OK).json({ message: "Forgot Password OTP verified successfully"})
    } catch (error: any) {
      res
        .status(StatusCode.BAD_REQUEST)
        .json({ error: error.message})
      logger.error("Error verifying forgot password OTP", error)
    }
  }

  resetPassword = async (req: Request, res: Response) => {
    try {
      const { email, newPassword } = req.body
      await this.userAuthService.resetPassword(email, newPassword)
      res.status(StatusCode.OK).json({ message: "Password reset successfully" })
    } catch (error: any) {
      res.status(StatusCode.BAD_REQUEST).json({ error: error.message })
      logger.error("Error resetting password", error)
    }
  }

  login = async (req: Request, res: Response) => {
    try {
      const { email, password } = req.body;
      const { user, accessToken, refreshToken } = await this.userAuthService.loginUser(email, password);

      this.jwtService.setTokens(res, accessToken, refreshToken);
      res.status(StatusCode.OK).json({ user });
    } catch (error:any) {
      res.status(StatusCode.UNAUTHORIZED).json({ error: error.message });
      logger.error("Error logging in", error);
    }
  };

  resendOtp = async(req: Request, res: Response) => {
      try {
        const { email } = req.body;
        await this.otpService.requestOtp(email,'user')
        res.status(StatusCode.OK).json({ message: "OTP resent successfully" })
      } catch (error:any) {
        res.status(StatusCode.BAD_REQUEST).json({ error: error.message })
      }
  }

  refreshAccessToken = async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.cookies;
    if (!refreshToken) {
      return res
        .status(StatusCode.UNAUTHORIZED)
        .json({ message: "Refresh token is required" });
    }

    const decoded = this.jwtService.verifyRefreshToken(refreshToken) as { id: string, role: string };
    const accessToken = this.jwtService.generateAccessToken(decoded.id, decoded.role);
    const newRefreshToken = this.jwtService.generateRefreshToken(decoded.id, decoded.role);
    this.jwtService.setTokens(res, accessToken, newRefreshToken);
    
    return res.status(StatusCode.OK).json({ accessToken, refreshToken: newRefreshToken });
  } catch (error) {
    logger.error("Error refreshing access token", error);
    return res.status(StatusCode.UNAUTHORIZED).json({ error: error });
  }
};


googleLogin = async (req: Request, res: Response) => {
  try {
    const { token } = req.body;

    if(!token || typeof token !== "string") {
      res.status(StatusCode.BAD_REQUEST).json({ error: "Invalid Google token" });
      return
    }

    const ticket = await this.oauthClient.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID!,
    })

    const payload = ticket.getPayload();
    if(!payload?.email) {
      res.status(StatusCode.BAD_REQUEST).json({ error: "Google Auth Failed" });
      return
    }

    const email = payload.email;
    const name = payload.name || "Google User";

    let user = await this.userRepo.findByEmail(email);
    if(!user) {
      user = await this.userRepo.createUser({
        name,
        email,
        password:""
      });
    }

    res.status(StatusCode.OK).json({ user });
  } catch (error:any) {
    logger.error("Error logging in with Google", error);
    res.status(StatusCode.BAD_REQUEST).json({ error: error.message });
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

}
