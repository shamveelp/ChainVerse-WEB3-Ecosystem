import { injectable, inject } from "inversify";
import { IUserAuthService } from "../../core/interfaces/services/user/IUserAuthService";
import { IUserRepository } from "../../core/interfaces/repositories/IUserRepository";
import { TYPES } from "../../core/types/types";
import bcrypt from "bcrypt";
import { JwtService } from "../../utils/jwt";
import { IUser } from "../../models/user.models";
import { StatusCode } from "../../enums/statusCode.enum";
import { CustomError } from "../../utils/CustomError";
import { IJwtService } from "../../core/interfaces/services/IJwtService";
import { OAuth2Client } from "google-auth-library";
import { ReferralCodeService } from "../../utils/referralCode";
import logger from "../../utils/logger";
import { Types } from "mongoose";

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || "";
const JWT_ACCESS_SECRET = process.env.JWT_ACCESS;

@injectable()
export class UserAuthService implements IUserAuthService {
  private _googleClient: OAuth2Client;
  constructor(
    @inject(TYPES.IUserRepository) private _userRepository: IUserRepository,
    @inject(TYPES.IJwtService) private _jwtService: IJwtService
  ) {
    this._userRepository = _userRepository;
    this._googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
  }

  // Only validate user data and check availability - don't create user yet
  async registerUser(username: string, email: string, password: string, name: string, referralCode?: string): Promise<void> {
    try {
      const existingUserByEmail = await this._userRepository.findByEmail(email);
      if (existingUserByEmail) {
        throw new CustomError("Email already exists", StatusCode.BAD_REQUEST);
      }

      const existingUserByUsername = await this._userRepository.findByUsername(username);
      if (existingUserByUsername) {
        throw new CustomError("Username already exists", StatusCode.BAD_REQUEST);
      }

      // Validate referral code if provided
      if (referralCode && referralCode.trim()) {
        const referrerId = await ReferralCodeService.validateReferralCode(referralCode);
        if (!referrerId) {
          throw new CustomError("Invalid referral code", StatusCode.BAD_REQUEST);
        }
      }

      // Don't create user here - just validate the data
      logger.info("User registration validation successful for:", email);
    } catch (error) {
      logger.error("Error in registerUser:", error);
      throw error instanceof CustomError ? error : new CustomError("Registration validation failed", StatusCode.INTERNAL_SERVER_ERROR);
    }
  }

  // Create the user after OTP verification
  async verifyAndRegisterUser(username: string, email: string, password: string, name: string, referralCode?: string): Promise<{ user: any; accessToken: string; refreshToken: string }> {
    try {
      // Double-check that user doesn't exist (in case someone else registered with same email during OTP verification)
      const existingUserByEmail = await this._userRepository.findByEmail(email);
      if (existingUserByEmail) {
        throw new CustomError("Email already exists", StatusCode.BAD_REQUEST);
      }

      const existingUserByUsername = await this._userRepository.findByUsername(username);
      if (existingUserByUsername) {
        throw new CustomError("Username already exists", StatusCode.BAD_REQUEST);
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const userReferralCode = await ReferralCodeService.generateUniqueReferralCode();

      // Handle referral logic
      let refferedById: string | null = null;
      if (referralCode && referralCode.trim()) {
        refferedById = await ReferralCodeService.validateReferralCode(referralCode);
        if (!refferedById) {
          throw new CustomError("Invalid referral code", StatusCode.BAD_REQUEST);
        }
      }

      const userData = {
        username,
        email,
        password: hashedPassword,
        name,
        refferalCode: userReferralCode, // User's own referral code
        refferedBy: refferedById ? new Types.ObjectId(refferedById) : null, // Who referred this user
        role: "user" as const,
        isEmailVerified: true,
        totalPoints: 0,
      };

      const user = await this._userRepository.createUser(userData);

      // Award 100 points to the referrer if someone referred this user
      if (refferedById) {
        try {
          const referrer = await this._userRepository.findById(refferedById);
          if (referrer) {
            await this._userRepository.updateUser(refferedById, {
              totalPoints: (referrer.totalPoints || 0) + 100,
            });
            logger.info(`Awarded 100 points to referrer ${refferedById} for user ${user._id}`);
          }
        } catch (referralError) {
          logger.error("Error awarding referral points:", referralError);
          // Don't fail registration if referral points fail - just log the error
        }
      }

      const accessToken = this._jwtService.generateAccessToken(user._id.toString(), user.role, user.tokenVersion || 0);
      const refreshToken = this._jwtService.generateRefreshToken(user._id.toString(), user.role, user.tokenVersion || 0);

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
      throw error instanceof CustomError ? error : new CustomError("Verification and registration failed", StatusCode.INTERNAL_SERVER_ERROR);
    }
  }

  async checkUsernameAvailability(username: string): Promise<boolean> {
    const existingUsername = await this._userRepository.findByUsername(username);
    return !existingUsername;
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

  public async resetPassword(email: string, newPassword: string): Promise<void> {
    const user = await this._userRepository.findByEmail(email);
    if (!user) {
      throw new CustomError("User not found", StatusCode.NOT_FOUND);
    }
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await this._userRepository.updateUser(user._id.toString(), {
      password: hashedPassword,
    });
  }

  public async loginUser(email: string, password: string) {
    // Find user by email
    const user = await this._userRepository.findByEmail(email);

    if (!user) {
      throw new CustomError(
        "Incorrect email or password",
        StatusCode.UNAUTHORIZED
      );
    }

    if (!user.password) {
      throw new CustomError(
        "User does not have a password",
        StatusCode.BAD_REQUEST
      );
    }

    if (user.isBanned) {
      throw new CustomError("This user is banned", StatusCode.FORBIDDEN);
    }

    // Compare entered password with hashed password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      throw new CustomError(
        "Incorrect email or password",
        StatusCode.UNAUTHORIZED
      );
    }

    // Generate JWT tokens
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

    return { user, accessToken, refreshToken };
  }

  public async getAllUsers(page: number, limit: number, search: string) {
    return await this._userRepository.findUsers(page, limit, search);
  }

  async getUserById(id: string) {
    return this._userRepository.findById(id);
  }

  async updateUserStatus(id: string, updateData: Partial<IUser>) {
    return await this._userRepository.updateStatus(id, updateData);
  }

  async loginWithGoogle(
    idToken: string
  ): Promise<{ user: IUser; accessToken: string; refreshToken: string }> {
    const ticket = await this._googleClient.verifyIdToken({
      idToken,
      audience: GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    if (!payload) {
      throw new CustomError("Invalid Google ID token", StatusCode.UNAUTHORIZED);
    }

    const { sub: googleId, email, name } = payload;

    if (!googleId || !email) {
      throw new CustomError(
        "Google ID or email is missing",
        StatusCode.BAD_REQUEST
      );
    }

    let user = await this._userRepository.findByGoogleId(googleId);
    if (!user) {
      user = await this._userRepository.findByEmail(email);
    }

    if (!user) {
      const username = email.split("@")[0] + Math.floor(Math.random() * 1000);
      const userReferralCode = await ReferralCodeService.generateUniqueReferralCode();
      
      user = await this._userRepository.createUser({
        name,
        email,
        googleId,
        username,
        refferalCode: userReferralCode,
        isGoogleUser: true,
        isEmailVerified: true,
        totalPoints: 0,
      });
    } else if (!user.googleId) {
      throw new CustomError(
        "User exists but not registered with Google",
        StatusCode.BAD_REQUEST
      );
    }

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

    return { user, accessToken, refreshToken };
  }
}