import { injectable, inject } from "inversify";
import { IUserAuthService } from "../../core/interfaces/services/user/IUserAuthService";
import { IBaseRepository } from "../../core/interfaces/repositories/iBase.repository";
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
    @inject(TYPES.IUserRepository) private userRepository: IUserRepository,
    @inject(TYPES.IJwtService) private jwtService: IJwtService
  ) { 
    this.userRepository = userRepository;
    this._googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
  }

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
      user._id.toString(), user.role, user.tokenVersion ?? 0
    );
    const refreshToken = this.jwtService.generateRefreshToken(
      user._id.toString(), user.role,  user.tokenVersion ?? 0
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
      const accessToken = this.jwtService.generateAccessToken(user._id.toString(), user.role, user.tokenVersion ?? 0)
      const refreshToken = this.jwtService.generateRefreshToken(user._id.toString(), user.role, user.tokenVersion ?? 0)
      // console.log(refreshToken, "ithaanu");
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


  async loginWithGoogle(idToken: string): Promise<{ user: IUser; accessToken: string; refreshToken: string }> {
    const ticket = await this._googleClient.verifyIdToken({
      idToken,
      audience: GOOGLE_CLIENT_ID,
    })
    const payload = ticket.getPayload();
    if (!payload) {
      throw new CustomError("Invalid Google ID token", StatusCode.UNAUTHORIZED);
    }

    const { sub: googleId, email, name } = payload;

    if(!googleId || !email) {
      throw new CustomError("Google ID or email is missing", StatusCode.BAD_REQUEST);
    }

    let user = await this.userRepository.findByGoogleId(googleId);
    if (!user) {
      user = await this.userRepository.findByEmail(email);
    }

    if (!user) {
      const username = email.split("@")[0] + Math.floor(Math.random() * 1000);
      user = await this.userRepository.createUser({
        name,
        email,
        googleId,
        username,
        isGoogleUser: true,
        isEmailVerified: true, // Assuming Google login verifies email
      });
    } else if (!user.googleId) {
      throw new CustomError("User exists but not registered with Google", StatusCode.BAD_REQUEST);
    }

    const accessToken = this.jwtService.generateAccessToken(user._id.toString(), user.role, user.tokenVersion?? 0);
    const refreshToken = this.jwtService.generateRefreshToken(user._id.toString(), user.role, user.tokenVersion?? 0);

    return { user, accessToken, refreshToken };
  }

  




}
