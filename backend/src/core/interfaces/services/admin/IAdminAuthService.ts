import { IAdmin } from "../../../../models/admin.model";
import { IUser } from "../../../../models/user.models";

export interface IAdminAuthService {
  login(email: string, password: string): Promise<{
    admin: {
      _id: string;
      name: string;
      email: string;
      role: "admin";
    };
    accessToken:string,
    refreshToken:string
  }>;
}
