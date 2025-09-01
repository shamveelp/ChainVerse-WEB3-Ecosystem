import { IUser } from "../../../../models/user.models";

export interface PaginatedUsers {
  users: IUser[];
  total: number;
  page: number;
  totalPages: number;
}

export interface IUserAuthService {
  registerUser(
    username: string,
    email: string,
    password: string,
    name: string,
    referralCode?: string
  ): Promise<void>;
  
  verifyAndRegisterUser(
    username: string,
    email: string,
    password: string,
    name: string,
    referralCode?: string
  ): Promise<{user: IUser; accessToken: string; refreshToken: string}>;
  
  loginUser(
    email: string,
    password: string
  ): Promise<{ user: IUser; accessToken: string; refreshToken: string }>;
  
  checkUsernameAvailability(username: string): Promise<boolean>;
  generateUsername(): Promise<string>;
  
  loginWithGoogle(
    idToken: string
  ): Promise<{ user: IUser; accessToken: string; refreshToken: string }>;
  
  resetPassword(email: string, password: string): Promise<void>;
  
  // getAllUsers(
  //   page: number,
  //   limit: number,
  //   search: string
  // ): Promise<PaginatedUsers>;
  
  updateUserStatus(
    id: string,
    updateData: Partial<IUser>
  ): Promise<IUser | null>;
  
  getUserById(id: string): Promise<IUser | null>;
}