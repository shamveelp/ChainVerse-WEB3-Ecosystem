import { FilterQuery, UpdateQuery, Document } from "mongoose";

export interface IBaseRepository<T extends Document> {
    create(item: Partial<T>): Promise<T>;
    findById(id: string): Promise<T | null>;
    findOne(filter: FilterQuery<T>): Promise<T | null>;
    findByEmail(email: string): Promise<T | null>;
    findByUsername(username: string): Promise<T | null>;
    findByGoogleId(googleId: string): Promise<T | null>;
    findUsers(page: number, limit: number, search: string): Promise<T[]>;
    update(id: string, update: UpdateQuery<T>): Promise<T | null>;
    updateStatus(id: string, update: Partial<T>): Promise<T | null>;
    delete(id: string): Promise<T | null>;
}