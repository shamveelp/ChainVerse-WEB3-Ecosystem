import { IUser } from "../../../models/user.models";
import { IBaseRepository } from "./IBase.repository";

export interface PaginatedUsers {
    users: Partial<IUser>[];
    total: number;
    page: number;
    totalPages: number;
}

export interface IUserRepository extends IBaseRepository<IUser> {
  findByEmail(email: string): Promise<IUser | null>;
  findByUsername(username: string): Promise<IUser | null>;
  createUser(data: Partial<IUser>): Promise<IUser>;
  findAll(skip: number, limit: number): Promise<IUser[]>;
  findByGoogleId(googleId: string): Promise<IUser | null>;
  findUsers(page: number, limit: number, search: string): Promise<PaginatedUsers>;
  count(): Promise<number>;
  updateUser(id:string,status:Partial<IUser>):Promise<void>
  updateStatus(id: string, updateData: Partial<IUser>): Promise<IUser | null>;
  findById(id: string): Promise<IUser | null>;
  
}
