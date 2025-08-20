import { IAdmin } from '../../../models/admin.model';

export interface IAdminRepository {
    findByEmail(email: string): Promise<IAdmin | null>;
    findById(id: string): Promise<IAdmin | null>;
    updateById(id: string, update: Partial<IAdmin>): Promise<IAdmin | null>;
}



