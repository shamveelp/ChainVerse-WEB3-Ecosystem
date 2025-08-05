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
import { IJwtService } from "../../core/interfaces/services/user/IJwtService";

@injectable()
export class UserAuthService implements IUserAuthService {
  constructor(
    @inject(TYPES.IUserRepository) private userRepository: IUserRepository,
    @inject(TYPES.IJwtService) private jwtService: IJwtService
  ) { }

  public async registerUser( name: string, email: string, password: string) {
    const existingUser = await this.userRepository.findByEmail(email);
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
      user._id.toString(), user.role
    );
    const refreshToken = this.jwtService.generateRefreshToken(
      user._id.toString(), user.role
    );

    return { user, accessToken, refreshToken };
  }

  public async resetPassword(email: string, newPassword: string): Promise<void> {
    const user = await this.userRepository.findByEmail(email)
    if (!user) {
      throw new CustomError("User not found", StatusCode.NOT_FOUND)
    }
    const hashedPassword = await bcrypt.hash(newPassword, 10) // Use newPassword

    await this.userRepository.updateUser(user._id.toString(), {
      password: hashedPassword,
    })
  }

  public async loginUser(email: string, password: string, ) {
    const user = await this.userRepository.findByEmail(email)
    if (!user) {
      throw new CustomError("User not found", StatusCode.NOT_FOUND)
    }
    if (!user.password) throw new Error("User has no password");
    if (user.isBanned) throw new Error("This user is banned")

    const isMatch = await bcrypt.compare(password, user.password)
    if (!isMatch) {
      throw new CustomError("Invalid password", StatusCode.UNAUTHORIZED)
    }
    const accessToken = this.jwtService.generateAccessToken(user._id.toString(), user.role)
    const refreshToken = this.jwtService.generateRefreshToken(user._id.toString(), user.role)
    return { user, accessToken, refreshToken }
  }

  public async getAllUsers( page: number, limit: number, search: string) {
    return await this.userRepository.findUsers(page, limit, search);
  }

  async getUserById(id: string) {
    return this.userRepository.findById(id);
  }

  async updateUserStatus(id: string, updateData: Partial<IUser>) {
    return await this.userRepository.updateStatus(id, updateData);
  }





}
