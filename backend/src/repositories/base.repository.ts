import { Model, FilterQuery, UpdateQuery, Document } from "mongoose";
import { IBaseRepository } from "../core/interfaces/repositories/iBase.repository";

export abstract class BaseRepository<T extends Document> implements IBaseRepository<T> {
    constructor(protected readonly model: Model<T>) {}

    async create(item: Partial<T>): Promise<T> {
        return await this.model.create(item);
    }

    async findById(id: string): Promise<T | null> {
        return await this.model.findById(id).exec();
    }

    async findOne(filtered: FilterQuery<T>): Promise<T | null> {
        return await this.model.findOne(filtered).exec();
    }

    async findByEmail(email: string): Promise<T | null> {
        return await this.model.findOne({ email } as FilterQuery<T>).exec();
    }

    async findByUsername(username: string): Promise<T | null> {
        return await this.model.findOne({ username } as FilterQuery<T>).exec();
    }

    async findByGoogleId(googleId: string): Promise<T | null> {
        return await this.model.findOne({ googleId } as FilterQuery<T>).exec();
    }

    async findUsers(page: number, limit: number, search: string): Promise<T[]> {
        const skip = (page - 1) * limit;
        const query: FilterQuery<T> = search
            ? {
                  $or: [
                      { username: { $regex: search, $options: 'i' } },
                      { email: { $regex: search, $options: 'i' } },
                      { name: { $regex: search, $options: 'i' } }
                  ]
              } as FilterQuery<T>
            : {};

        return await this.model
            .find(query)
            .skip(skip)
            .limit(limit)
            .exec();
    }

    async update(id: string, update: UpdateQuery<T>): Promise<T | null> {
        return await this.model.findByIdAndUpdate(id, update, { new: true }).exec();
    }

    async updateStatus(id: string, update: Partial<T>): Promise<T | null> {
        return await this.model.findByIdAndUpdate(id, update, { new: true }).exec();
    }

    async delete(id: string): Promise<T | null> {
        return await this.model.findByIdAndDelete(id).exec();
    }
}