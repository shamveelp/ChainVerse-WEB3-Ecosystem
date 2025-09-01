import { IAdmin } from "../../../../models/admin.model";

export interface IAdminAuthService {
  login(email: string, password: string): Promise<{
    admin: {
      _id: string;
      name: string;
      email: string;
      role: "admin";
      isActive: boolean;
      lastLogin: Date | null;
    };
    accessToken: string;
    refreshToken: string;
  }>;
  getAdminById(id: string): Promise<IAdmin | null>;
  resetPassword(email: string, password: string): Promise<void>;
  changePassword(adminId: string, currentPassword: string, newPassword: string): Promise<void>;
}