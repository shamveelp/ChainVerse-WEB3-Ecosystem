import { IUser } from "../../../../models/user.models";

export interface IUserService {
    getProfile(userId: string): Promise<IUser | null>;
    updateProfile(userId: string, data: Partial<IUser>): Promise<IUser | null>;
    updatePassword(userId: string, currentPassword: string, newPassword: string): Promise<void>;
    checkUsernameAvailability(username: string, currentUserId?: string): Promise<boolean>;
}