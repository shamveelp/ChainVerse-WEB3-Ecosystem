import { IUser } from "../../../../models/user.models";
import { PaginatedUsers } from "../../repositories/IUserRepository";

export interface IUserAuthService {
  registerUser(
    name: string,
    email: string,
    password: string
  ): Promise<{ user: IUser; accessToken: string; refreshToken: string }>;
  loginUser(
    email: string,
    password: string
  ): Promise<{ user: IUser; accessToken: string; refreshToken: string }>;
  loginWithGoogle(
    idToken: string
  ): Promise<{ user: IUser; accessToken: string; refreshToken: string }>;
  resetPassword(email: string, password: string): Promise<void>;
  getAllUsers(
    page: number,
    limit: number,
    search: string
  ): Promise<PaginatedUsers>;
  updateUserStatus(
    id: string,
    updateData: Partial<IUser>
  ): Promise<IUser | null>;
  getUserById(id: string): Promise<IUser | null>;
  
}
