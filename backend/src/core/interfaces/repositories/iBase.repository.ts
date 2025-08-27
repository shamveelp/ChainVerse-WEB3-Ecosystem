import { FilterQuery, UpdateQuery } from "mongoose";

export interface IBaseRepository<T> {
    create(item: Partial<T>): Promise<T>;
    findById(id: string): Promise<T | null>;
    // findAll(): Promise<T[]>;
    findOne(filter: FilterQuery<T>): Promise<T | null>;
    update(id: string, update: UpdateQuery<T>): Promise<T | null>;
    delete(id: string): Promise<T | null>;
}

