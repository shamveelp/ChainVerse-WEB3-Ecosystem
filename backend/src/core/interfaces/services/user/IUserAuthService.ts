import { IUser } from "../../../../models/user.models";

export interface IUserAuthService {
  registerUser(
    name: string,
    email: string,
    password: string,
  ): Promise<{ user: IUser; accessToken: string; refreshToken: string }>
  loginUser(email: string, password: string): Promise<{ user: IUser; accessToken: string; refreshToken: string }>
  resetPassword(email: string, password: string): Promise<void>
  getAllUsers(page: number, limit: number): Promise<{ users: IUser[]; total: number }>
  updateUserStatus(id: string, isPrivate: boolean): Promise<IUser | null>
  getUserById(id: string): Promise<IUser | null> // Added for refresh token flow
  findUserByEmail(email: string): Promise<IUser | null>
  registerGoogleUser(name: string, email: string): Promise<{ user: IUser; accessToken: string; refreshToken: string }>
  loginGoogleUser(email: string): Promise<{ user: IUser; accessToken: string; refreshToken: string }>
}





