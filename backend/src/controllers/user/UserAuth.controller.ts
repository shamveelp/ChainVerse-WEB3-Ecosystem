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


@injectable()
export class UserAuthController implements IUserAuthController {
  private googleClient: OAuth2Client
  constructor(
    @inject(TYPES.IUserAuthService) private _userAuthService: IUserAuthService,
    @inject(TYPES.IOtpService) private _otpService: IOTPService,
    @inject(TYPES.IJwtService) private _jwtService: IJwtService,
  ) {
    this.googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID)
  }


  requestOtp = async (req: Request, res: Response) => {
    try {
      const { email } = req.body;
      const otpResponse = await this._otpService.requestOtp(email,'user');
      res
        .status(StatusCode.OK)
        .json({ success:true,message: "OTP sent successfully", data: otpResponse });
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
      const isVerified = await this._otpService.verifyOtp(email, otp);
      const { user, accessToken, refreshToken } =
        await this._userAuthService.registerUser(name, email, password);
        //Set cookies
      this._jwtService.setTokens(res, accessToken, refreshToken);
      res.status(StatusCode.CREATED).json({ success: true,user });
    } catch (error) {
      res.status(StatusCode.BAD_REQUEST).json({ error: error });
      logger.error("Error verifying OTP", error);
    }
  };

  forgotPassword = async (req: Request, res: Response) => {
    try {
      const { email } = req.body
      await this._otpService.requestForgotPasswordOtp(email,'user') 
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
      await this._otpService.verifyOtp(email, otp)
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
      await this._userAuthService.resetPassword(email, newPassword)
      res.status(StatusCode.OK).json({ message: "Password reset successfully" })
    } catch (error: any) {
      res.status(StatusCode.BAD_REQUEST).json({ error: error.message })
      logger.error("Error resetting password", error)
    }
  }

  login = async (req: Request, res: Response) => {
    try {
      const { email, password } = req.body;
      const { user, accessToken, refreshToken } = await this._userAuthService.loginUser(email, password);

      this._jwtService.setTokens(res, accessToken, refreshToken);
      res.status(StatusCode.OK).json({ user });
    } catch (error:any) {
      res.status(StatusCode.UNAUTHORIZED).json({ error: error.message });
      logger.error("Error logging in", error);
    }
  };

  resendOtp = async(req: Request, res: Response) => {
      try {
        const { email } = req.body;
        await this._otpService.requestOtp(email,'user')
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

    const decoded = this._jwtService.verifyRefreshToken(refreshToken) as { id: string, role: string, tokenVersion?: number };
    const accessToken = this._jwtService.generateAccessToken(decoded.id, decoded.role, decoded.tokenVersion ?? 0);
    const newRefreshToken = this._jwtService.generateRefreshToken(decoded.id, decoded.role, decoded.tokenVersion ?? 0);
    this._jwtService.setTokens(res, accessToken, newRefreshToken);
    
    return res.status(StatusCode.OK).json({ accessToken, refreshToken: newRefreshToken });
  } catch (error) {
    logger.error("Error refreshing access token", error);
    return res.status(StatusCode.UNAUTHORIZED).json({ error: error });
  }
};


 googleLogin = async (req: Request, res: Response) => {
  const { idToken } = req.body;
  if(!idToken) {
    res.status(StatusCode.BAD_REQUEST).json({ message: "Id token is required" });
    return;
  }
  try {
    const { user, accessToken, refreshToken } = await this._userAuthService.loginWithGoogle(idToken)
    this._jwtService.setTokens(res, accessToken, refreshToken);
    res.status(StatusCode.OK).json({ user });
  } catch (error) {
    res.status(StatusCode.BAD_REQUEST).json({ error: error || "Login Failed" });
    logger.error("Error logging in with Google", error);
  }
 }

 googleCallback = (req: Request, res: Response) => {
  passport.authenticate('google', { session: false }, async (error, user, info) => {
    if (error || !user) {
      return res.redirect("http://localhost:3000/signup?error=auth_failed")
    }
    try {
      const { accessToken, refreshToken } = await this._userAuthService.loginWithGoogle(user);
      this._jwtService.setTokens(res, accessToken, refreshToken);
      res.redirect(`http://localhost:3000/callback?token=${accessToken}`);
    } catch (error: any) {
      res.redirect(`http://localhost:3000/signup?error=${encodeURIComponent(error.message)}`);
    }
  })(req, res);
 }



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
