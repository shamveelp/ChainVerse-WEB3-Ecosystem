import { IUser, UserModel } from "../models/user.models";
import { IUserRepository } from "../core/interfaces/repositories/IUserRepository";
import { injectable } from "inversify";


@injectable()
export class UserRepository implements IUserRepository {
    
    async createUser(data: Partial<IUser>): Promise<IUser> {
        return await UserModel.create(data);
    }

    async findUserByEmail(email: string): Promise<IUser | null> {
        return await UserModel.findOne({email}).exec();
    }

    async findAll (skip: number, limit: number): Promise<IUser[]> {
        return await UserModel.find().skip(skip).limit(limit).exec();
    }

    async count(): Promise<number> {
        return await UserModel.countDocuments().exec();
    }

    async updateUser(id: string, updateData: Partial<IUser>): Promise<void> {
        await UserModel.findByIdAndUpdate(id, updateData).exec()
    }

    async updateStatus(id: string, isPrivate: boolean): Promise<IUser | null> {
        return await UserModel.findByIdAndUpdate(id, { isPrivate }, { new: true }).exec();
    }

    async findById(id: string): Promise<IUser | null> {
        return await UserModel.findById(id).exec();
    }

//     async findByEmail(email: string): Promise<IUser | null> {
//     return await UserModel.find((user) => user.email === email) || null
//   }





}





