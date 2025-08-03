import { injectable, inject } from "inversify";
import { IUserAuthService } from "../../core/interfaces/services/user/IUserAuthService";
import { IBaseRepository } from "../../core/interfaces/repositories/IBaseRepository";
import { IUserRepository } from "../../core/interfaces/repositories/IUserRepository";
import { TYPES } from "../../core/types/types";
import bcrypt from "bcrypt";
import { JwtService } from "../../utils/jwt";
import { IUser } from "../../models/user.models";
import { StatusCode } from "../../enums/statusCode.enum";
import { CustomError } from "../../utils/CustomError";

@injectable()
export class UserAuthService implements IUserAuthService {
  constructor(
    @inject(TYPES.IUserRepository) private userRepository: IUserRepository,
    @inject(TYPES.JwtService) private jwtService: JwtService
  ) {}

  public async registerUser(
    name: string,
    email: string,
    password: string
  ): Promise<{ user: IUser; accessToken: string; refreshToken: string }> {
    const existingUser = await this.userRepository.findUserByEmail(email);
    if (existingUser) {
      throw new Error("User already exists");
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    // Generate username from email
    const username = email.split("@")[0] + Math.floor(Math.random() * 1000);

    const userData: Partial<IUser> = {
      name,
      email,
      password: hashedPassword,
      username,
      isEmailVerified: true, // Since OTP is verified
    };
    const user = await this.userRepository.createUser(userData);

    const accessToken = this.jwtService.generateAccessToken(
      user._id.toString()
    );
    const refreshToken = this.jwtService.generateRefreshToken(
      user._id.toString()
    );

    return { user, accessToken, refreshToken };
  }

  public async resetPassword(email: string, newPassword: string): Promise<void> {
    const user = await this.userRepository.findUserByEmail(email)
    if (!user) {
      throw new CustomError("User not found", StatusCode.NOT_FOUND)
    }
    const hashedPassword = await bcrypt.hash(newPassword, 10) // Use newPassword
    await this.userRepository.updateUser(user._id.toString(), {
      password: hashedPassword,
    })
  }

  public async loginUser(
    email: string,
    password: string,
  ): Promise<{ user: IUser; accessToken: string; refreshToken: string }> {
    const user = await this.userRepository.findUserByEmail(email)
    if (!user) {
      throw new CustomError("User not found", StatusCode.NOT_FOUND)
    }
    // If user is a Google user, they don't have a password set
    if (user.isGoogleUser) {
      throw new CustomError(
        "This email is registered with Google. Please sign in with Google.",
        StatusCode.UNAUTHORIZED,
      )
    }
    const isPasswordValid = await bcrypt.compare(password, user.password || "") // Handle optional password
    if (!isPasswordValid) {
      throw new CustomError("Invalid password", StatusCode.UNAUTHORIZED)
    }
    const accessToken = this.jwtService.generateAccessToken(user._id.toString())
    const refreshToken = this.jwtService.generateRefreshToken(user._id.toString())
    return { user, accessToken, refreshToken }
  }

  public async getAllUsers(
    page: number,
    limit: number
  ): Promise<{ users: IUser[]; total: number }> {
    const skip = (page - 1) * limit;
    const users = await this.userRepository.findAll(skip, limit);
    const total = await this.userRepository.count();
    return { users, total };
  }

  public async updateUserStatus(
    id: string,
    isPrivate: boolean
  ): Promise<IUser | null> {
    return await this.userRepository.updateStatus(id, isPrivate);
  }

  public async getUserById(id: string): Promise<IUser | null> {
    return await this.userRepository.findById(id);
  }

  public async findUserByEmail(email: string): Promise<IUser | null> {
    return this.userRepository.findUserByEmail(email)
  }

  public async registerGoogleUser(
    name: string,
    email: string,
  ): Promise<{ user: IUser; accessToken: string; refreshToken: string }> {
    const existingUser = await this.userRepository.findUserByEmail(email)
    if (existingUser) {
      throw new CustomError("User with this email already exists", StatusCode.CONFLICT)
    }

    const username = email.split("@")[0] + Math.floor(Math.random() * 1000) // Generate a unique username

    const newUser = await this.userRepository.createUser({
      name,
      email,
      username,
      isEmailVerified: true, // Google users are considered email verified
      isGoogleUser: true, // Mark as Google user
    })

    const accessToken = this.jwtService.generateAccessToken(newUser._id.toString())
    const refreshToken = this.jwtService.generateRefreshToken(newUser._id.toString())

    return { user: newUser, accessToken, refreshToken }
  }

  public async loginGoogleUser(email: string): Promise<{ user: IUser; accessToken: string; refreshToken: string }> {
    const user = await this.userRepository.findUserByEmail(email)
    if (!user) {
      throw new CustomError("Google user not found. Please register.", StatusCode.NOT_FOUND)
    }
    // For Google users, no password verification is needed. Just generate tokens.
    const accessToken = this.jwtService.generateAccessToken(user._id.toString())
    const refreshToken = this.jwtService.generateRefreshToken(user._id.toString())
    return { user, accessToken, refreshToken }
  }


}
