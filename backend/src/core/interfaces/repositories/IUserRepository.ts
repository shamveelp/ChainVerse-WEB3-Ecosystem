import { IUser } from "../../../models/user.models";

export interface IUserRepository {
    findUserByEmail(email: string): Promise<IUser | null>;
    createUser(data: Partial<IUser>): Promise<IUser>;
    findAll(skip: number, limit: number): Promise<IUser[]>;
    count(): Promise<number>;
    updateUser(id:string,status:Partial<IUser>):Promise<void>
    updateStatus(id: string, isPrivate: boolean): Promise<IUser | null>;
    findById(id: string): Promise<IUser | null>;
}
