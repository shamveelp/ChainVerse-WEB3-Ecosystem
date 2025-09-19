import { injectable, inject } from "inversify";
import { IUserAuthService } from "../../core/interfaces/services/user/IUserAuthService";
import { IUserRepository } from "../../core/interfaces/repositories/IUserRepository";
import { IReferralHistoryRepository } from "../../core/interfaces/repositories/IReferralHistoryRepository";
import { IPointsHistoryRepository } from "../../core/interfaces/repositories/IPointsHistoryRepository";
import { TYPES } from "../../core/types/types";
import bcrypt from "bcrypt";
import { IUser } from "../../models/user.models";
import { StatusCode } from "../../enums/statusCode.enum";
import { CustomError } from "../../utils/customError";
import { IJwtService } from "../../core/interfaces/services/IJwtService";
import { OAuth2Client } from "google-auth-library";
import { ReferralCodeService } from "../../utils/referralCode";
import logger from "../../utils/logger";
import { Types } from "mongoose";

@injectable()
export class UserAuthService implements IUserAuthService {
  private _googleClient: OAuth2Client;
  
  constructor(
    @inject(TYPES.IUserRepository) private _userRepository: IUserRepository,
    @inject(TYPES.IReferralHistoryRepository) private _referralHistoryRepository: IReferralHistoryRepository,
    @inject(TYPES.IPointsHistoryRepository) private _pointsHistoryRepository: IPointsHistoryRepository,
    @inject(TYPES.IJwtService) private _jwtService: IJwtService
  ) {
    this._googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
  }

  async registerUser(username: string, email: string, password: string, name: string, referralCode?: string): Promise<void> {
    try {
      logger.info(`Validating registration data for: ${email}, username: ${username}`);
      
      const existingUserByEmail = await this._userRepository.findByEmail(email);
      if (existingUserByEmail) {
        throw new CustomError("Email already exists", StatusCode.BAD_REQUEST);
      }

      const existingUserByUsername = await this._userRepository.findByUsername(username);
      if (existingUserByUsername) {
        throw new CustomError("Username already exists", StatusCode.BAD_REQUEST);
      }

      if (referralCode && referralCode.trim()) {
        const referrerId = await ReferralCodeService.validateReferralCode(referralCode);
        if (!referrerId) {
          throw new CustomError("Invalid referral code", StatusCode.BAD_REQUEST);
        }
        logger.info(`Valid referral code provided: ${referralCode} from user: ${referrerId}`);
      }

      logger.info("Registration validation successful for:", email);
    } catch (error) {
      logger.error("Error in registerUser validation:", error);
      throw error instanceof CustomError ? error : new CustomError("Registration validation failed", StatusCode.INTERNAL_SERVER_ERROR);
    }
  }

  async verifyAndRegisterUser(username: string, email: string, password: string, name: string, referralCode?: string): Promise<{ user: any; accessToken: string; refreshToken: string }> {
    try {
      logger.info(`Creating user account after OTP verification: ${email}, username: ${username}`);
      
      const existingUserByEmail = await this._userRepository.findByEmail(email);
      if (existingUserByEmail) {
        throw new CustomError("Email already exists", StatusCode.BAD_REQUEST);
      }

      const existingUserByUsername = await this._userRepository.findByUsername(username);
      if (existingUserByUsername) {
        throw new CustomError("Username already exists", StatusCode.BAD_REQUEST);
      }

      const hashedPassword = await bcrypt.hash(password, 12);
      
      const userReferralCode = await ReferralCodeService.generateUniqueReferralCode();

      let refferedById: string | null = null;
      if (referralCode && referralCode.trim()) {
        refferedById = await ReferralCodeService.validateReferralCode(referralCode);
        if (!refferedById) {
          throw new CustomError("Invalid referral code", StatusCode.BAD_REQUEST);
        }
        logger.info(`Processing referral for new user from: ${refferedById}`);
      }

      const userData = {
        username,
        email,
        password: hashedPassword,
        name,
        refferalCode: userReferralCode,
        refferedBy: refferedById ? new Types.ObjectId(refferedById) : null,
        role: "user" as const,
        isEmailVerified: true,
        totalPoints: 0,
        tokenVersion: 0,
      };

      const user = await this._userRepository.create(userData);
      logger.info(`User created successfully: ${user._id}`);

      if (refferedById) {
        this.processReferralReward(refferedById, user._id.toString(), username, referralCode!);
      }

      const accessToken = this._jwtService.generateAccessToken(
        user._id.toString(), 
        user.role, 
        user.tokenVersion || 0
      );
      const refreshToken = this._jwtService.generateRefreshToken(
        user._id.toString(), 
        user.role, 
        user.tokenVersion || 0
      );

      return {
        user: {
          _id: user._id,
          username: user.username,
          email: user.email,
          name: user.name,
          refferalCode: user.refferalCode,
          totalPoints: user.totalPoints,
        },
        accessToken,
        refreshToken,
      };
    } catch (error) {
      logger.error("Error in verifyAndRegisterUser:", error);
      throw error instanceof CustomError ? error : new CustomError("Account creation failed", StatusCode.INTERNAL_SERVER_ERROR);
    }
  }

  private async processReferralReward(referrerId: string, newUserId: string, newUsername: string, referralCode: string): Promise<void> {
    try {
      logger.info(`Processing referral reward for referrer: ${referrerId}`);
      
      const referrer = await this._userRepository.findById(referrerId);
      if (referrer) {
        const newTotalPoints = (referrer.totalPoints || 0) + 100;
        await this._userRepository.update(referrerId, {
          totalPoints: newTotalPoints,
        });

        await this._referralHistoryRepository.createReferralHistory({
          referrer: referrerId,
          referred: newUserId,
          referralCode: referralCode,
          pointsAwarded: 100,
        });

        await this._pointsHistoryRepository.createPointsHistory({
          userId: referrerId,
          type: 'referral_bonus',
          points: 100,
          description: `Referral bonus for inviting ${newUsername}`,
          relatedId: newUserId,
        });

        logger.info(`Successfully awarded 100 points to referrer ${referrerId} for user ${newUserId}`);
      }
    } catch (referralError) {
      logger.error("Error processing referral reward:", referralError);
    }
  }

  async checkUsernameAvailability(username: string): Promise<boolean> {
    try {
      const existingUsername = await this._userRepository.findByUsername(username);
      return !existingUsername;
    } catch (error) {
      logger.error("Error checking username availability:", error);
      throw new CustomError("Failed to check username availability", StatusCode.INTERNAL_SERVER_ERROR);
    }
  }

  async generateUsername(): Promise<string> {
    let username: string;
    let attempts = 0;
    const maxAttempts = 10;

    while (attempts < maxAttempts) {
      username = `chainverse_user${Math.floor(Math.random() * 100000)}`;

      const existingUser = await this._userRepository.findByUsername(username);
      if (!existingUser) {
        return username;
      }

      attempts++;
    }

    throw new CustomError(
      "Failed to generate a unique username",
      StatusCode.INTERNAL_SERVER_ERROR
    );
  }

  async resetPassword(email: string, newPassword: string): Promise<void> {
    try {
      const user = await this._userRepository.findByEmail(email);
      if (!user) {
        throw new CustomError("User not found", StatusCode.NOT_FOUND);
      }
      
      const hashedPassword = await bcrypt.hash(newPassword, 12);

      await this._userRepository.update(user._id.toString(), {
        password: hashedPassword,
        tokenVersion: (user.tokenVersion || 0) + 1, // Invalidate all existing tokens
      });

      logger.info(`Password reset successfully for user: ${email}`);
    } catch (error) {
      logger.error("Error resetting password:", error);
      throw error instanceof CustomError ? error : new CustomError("Password reset failed", StatusCode.INTERNAL_SERVER_ERROR);
    }
  }

  async loginUser(email: string, password: string) {
    try {
      const user = await this._userRepository.findByEmail(email);

      if (!user) {
        throw new CustomError("Invalid email or password", StatusCode.UNAUTHORIZED);
      }

      if (!user.password) {
        throw new CustomError("Please use Google login for this account", StatusCode.BAD_REQUEST);
      }

      if (user.isBanned) {
        throw new CustomError("Your account has been banned", StatusCode.NOT_FOUND);
      }

      if (!user.isEmailVerified) {
        throw new CustomError("Please verify your email before logging in", StatusCode.UNAUTHORIZED);
      }

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        throw new CustomError("Invalid email or password", StatusCode.UNAUTHORIZED);
      }

      await this._userRepository.updateLastLogin(user._id.toString());

      const accessToken = this._jwtService.generateAccessToken(
        user._id.toString(),
        user.role,
        user.tokenVersion ?? 0
      );
      const refreshToken = this._jwtService.generateRefreshToken(
        user._id.toString(),
        user.role,
        user.tokenVersion ?? 0
      );

      logger.info(`User logged in successfully: ${email}`);
      return { user, accessToken, refreshToken };
    } catch (error) {
      logger.error("Error in loginUser:", error);
      throw error instanceof CustomError ? error : new CustomError("Login failed", StatusCode.INTERNAL_SERVER_ERROR);
    }
  }

  // async getAllUsers(page: number, limit: number, search: string) {
  //   try {
  //     return await this._userRepository.findUsers(page, limit, search);
  //   } catch (error) {
  //     logger.error("Error getting all users:", error);
  //     throw new CustomError("Failed to retrieve users", StatusCode.INTERNAL_SERVER_ERROR);
  //   }
  // }

  async getUserById(id: string) {
    try {
      return await this._userRepository.findById(id);
    } catch (error) {
      logger.error("Error getting user by ID:", error);
      throw new CustomError("User not found", StatusCode.NOT_FOUND);
    }
  }

  async updateUserStatus(id: string, updateData: Partial<IUser>) {
    try {
      return await this._userRepository.updateStatus(id, updateData);
    } catch (error) {
      logger.error("Error updating user status:", error);
      throw new CustomError("Failed to update user status", StatusCode.INTERNAL_SERVER_ERROR);
    }
  }

  async loginWithGoogle(idToken: string): Promise<{ user: IUser; accessToken: string; refreshToken: string }> {
    try {
      const ticket = await this._googleClient.verifyIdToken({
        idToken,
        audience: process.env.GOOGLE_CLIENT_ID,
      });
      
      const payload = ticket.getPayload();
      if (!payload) {
        throw new CustomError("Invalid Google ID token", StatusCode.UNAUTHORIZED);
      }

      const { sub: googleId, email, name, picture } = payload;

      if (!googleId || !email) {
        throw new CustomError("Google ID or email is missing", StatusCode.BAD_REQUEST);
      }

      let user = await this._userRepository.findByGoogleId(googleId);
      if (!user) {
        user = await this._userRepository.findByEmail(email);
      }

      if (!user) {
        const username = email.split("@")[0] + Math.floor(Math.random() * 1000);
        const userReferralCode = await ReferralCodeService.generateUniqueReferralCode();
        
        user = await this._userRepository.create({
          name: name || email.split("@")[0],
          email,
          googleId,
          username,
          refferalCode: userReferralCode,
          isGoogleUser: true,
          isEmailVerified: true,
          totalPoints: 0,
          profilePic: picture,
          role: "user",
          tokenVersion: 0,
        });
        
        logger.info(`New Google user created: ${user._id}`);
      } else if (!user.googleId) {
        // Link existing account with Google
        await this._userRepository.update(user._id.toString(), {
          googleId,
          isGoogleUser: true,
          profilePic: picture || user.profilePic,
        });
        
        logger.info(`Linked existing account with Google: ${user._id}`);
      }

      if (user.isBanned) {
        throw new CustomError("Your account has been banned", StatusCode.FORBIDDEN);
      }

      // Update last login
      await this._userRepository.updateLastLogin(user._id.toString());

      const accessToken = this._jwtService.generateAccessToken(
        user._id.toString(),
        user.role,
        user.tokenVersion ?? 0
      );
      const refreshToken = this._jwtService.generateRefreshToken(
        user._id.toString(),
        user.role,
        user.tokenVersion ?? 0
      );

      logger.info(`Google login successful for: ${email}`);
      return { user, accessToken, refreshToken };
    } catch (error) {
      logger.error("Error in Google login:", error);
      throw error instanceof CustomError ? error : new CustomError("Google login failed", StatusCode.INTERNAL_SERVER_ERROR);
    }
  }
}