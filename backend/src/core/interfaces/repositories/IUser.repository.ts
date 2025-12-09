import { IUser } from '../../../models/user.models';
import { IBaseRepository } from './IBase.repository';

export interface PaginatedUsers {
  users: IUser[];
  total: number;
  page: number;
  totalPages: number;
}

export interface IUserRepository extends IBaseRepository<IUser> {
    findByEmail(email: string): Promise<IUser | null>;
    findByUsername(username: string): Promise<IUser | null>;
    findByGoogleId(googleId: string): Promise<IUser | null>;
    findByReferralCode(referralCode: string): Promise<IUser | null>;
    findAllWithPagination(skip: number, limit: number, search: string): Promise<IUser[]>;
    count(search?: string): Promise<number>;
    updateLastLogin(id: string): Promise<IUser | null>;
    incrementTokenVersion(id: string): Promise<IUser | null>;
}