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

  async registerUser(username: string, email: string, password: string) {
    // Check if email already exists
    console.log("Checking ")
    const existingUser = await this._userRepository.findByEmail(email);
    if (existingUser) {
      throw new CustomError(
        "Email is already registered, please log in",
        StatusCode.BAD_REQUEST
      );
    }

    // Check if username already exists
    const existingUsername =
      await this._userRepository.findByUsername(username);
    if (existingUsername) {
      throw new CustomError(
        "Username is not available",
        StatusCode.BAD_REQUEST
      );
    }
  }

  async verifyAndRegisterUser(
    username: string,
    email: string,
    password: string
  ) {
    // Check if email already exists
    const existingUser = await this._userRepository.findByEmail(email);
    if (existingUser) {
      throw new CustomError(
        "Email is already registered, please log in",
        StatusCode.BAD_REQUEST
      );
    }

    // Check if username already exists
    const existingUsername =
      await this._userRepository.findByUsername(username);
    if (existingUsername) {
      throw new CustomError(
        "Username is not available",
        StatusCode.BAD_REQUEST
      );
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Prepare user data
    const userData: Partial<IUser> = {
      username,
      email,
      password: hashedPassword,
      isEmailVerified: true,
    };

    // Save user to DB
    console.log("mele")
    const user = await this._userRepository.createUser(userData);
    console.log("thazhe")

    // Generate tokens
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

  async checkUsernameAvailability(username: string): Promise<boolean> {
    const existingUsername =
      await this._userRepository.findByUsername(username);
    return !existingUsername;
  }

  async generateUsername(): Promise<string> {
    let username: string;
    let attempts = 0;

    while (attempts < 5) {
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

  public async resetPassword(
    email: string,
    newPassword: string
  ): Promise<void> {
    const user = await this._userRepository.findByEmail(email);
    if (!user) {
      throw new CustomError("User not found", StatusCode.NOT_FOUND);
    }
    const hashedPassword = await bcrypt.hash(newPassword, 10); // Use newPassword

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
      user = await this._userRepository.createUser({
        name,
        email,
        googleId,
        username,
        isGoogleUser: true,
        isEmailVerified: true, // Assuming Google login verifies email
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
