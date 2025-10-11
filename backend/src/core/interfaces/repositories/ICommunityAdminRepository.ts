import { ICommunityAdmin } from "../../../models/communityAdmin.model";

export interface ICommunityAdminRepository {
    findByEmail(email: string): Promise<ICommunityAdmin | null>;
    findByUsername(username: string): Promise<ICommunityAdmin | null>;
    createCommunityAdmin(data: Partial<ICommunityAdmin>): Promise<ICommunityAdmin>;
    findAll(skip: number, limit: number): Promise<ICommunityAdmin[]>;
    findCommunityAdmins(page: number, limit: number, search: string): Promise<{ data: ICommunityAdmin[]; total: number; page: number; limit: number }>;
    count(): Promise<number>;
    updateCommunityAdmin(id: string, updateData: Partial<ICommunityAdmin>): Promise<ICommunityAdmin | null>;
    updateStatus(id: string, updateData: Partial<ICommunityAdmin>): Promise<ICommunityAdmin | null>;
    findById(id: string): Promise<ICommunityAdmin | null>;
    delete(id: string): Promise<ICommunityAdmin | null>;
}