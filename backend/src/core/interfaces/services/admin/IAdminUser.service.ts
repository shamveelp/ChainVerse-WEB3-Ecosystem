import { IUser } from "../../../../models/user.models";

export interface IAdminUserService {
  getAllUsers(page: number, limit: number, search: string): Promise<{
    users: IUser[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }>;
  getUserById(id: string): Promise<IUser | null>;
  updateUserStatus(id: string, updateData: Partial<IUser>): Promise<IUser | null>;
  deleteUser(id: string): Promise<boolean>;
}