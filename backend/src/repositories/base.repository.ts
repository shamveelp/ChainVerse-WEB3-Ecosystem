import { Model, FilterQuery, UpdateQuery, Document } from "mongoose";
import { IBaseRepository } from "../core/interfaces/repositories/IBase.repository";
import { UserModel, IUser } from "../models/user.models";



export abstract class BaseRepository<T extends Document> implements IBaseRepository<T> {
    constructor(protected readonly model: Model<T>) { }

    async create(item: Partial<T>): Promise<T> {
        console.log("ideel", item)
        return await this.model.create(item);
    }

    async findById(id: string): Promise<T | null> {
        return await this.model.findById(id);
    }

    // async findAll(): Promise<T[]> {
    //     return await this.model.find();
    // }

    async findOne(filtered: FilterQuery<T>): Promise<T | null> {
        return await this.model.findOne(filtered);
    }

    async update(id: string, update: UpdateQuery<T>): Promise<T | null> {
        return await this.model.findByIdAndUpdate(id, update, { new: true });
    }

    async delete(id: string): Promise<T | null> {
        return await this.model.findByIdAndDelete(id);
    }
}
