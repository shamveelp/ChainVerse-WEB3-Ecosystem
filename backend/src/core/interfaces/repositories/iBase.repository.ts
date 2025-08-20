import { Document, FilterQuery, UpdateQuery  } from "mongoose";

export interface IBaseRepository<T extends Document, U> {
    // CRUD Operations
    create(data: Partial<T>): Promise<U>;
    findAll(filter?: FilterQuery<T>): Promise<U[]>;
    findById(id: string): Promise<U | null>;
    findOne(filter: FilterQuery<T>): Promise<U | null>;
    update(id: string, updateData: UpdateQuery<T>): Promise<U | null>;
    delete(id: string): Promise<Boolean>;
    findPagination(
        filter?: FilterQuery<T>,
        options?: {
            page?: number;
            limit?: number;
            sort?: Record<string, 1 | -1>;
        }
    ): Promise<{
        data: U[];
        total: number;
        page: number;
        limit: number;
    }>;

}