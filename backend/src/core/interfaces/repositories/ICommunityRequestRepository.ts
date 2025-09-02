import { ICommunityRequest } from "../../../models/communityRequest.model";

export interface ICommunityRequestRepository {
    create(data: Partial<ICommunityRequest>): Promise<ICommunityRequest>;
    findByEmail(email: string): Promise<ICommunityRequest | null>;
    findByUsername(username: string): Promise<ICommunityRequest | null>;
    findById(id: string): Promise<ICommunityRequest | null>;
    updateStatus(id: string, status: string): Promise<ICommunityRequest | null>;
    findAll(page: number, limit: number, search: string): Promise<{ data: ICommunityRequest[]; total: number; page: number; limit: number }>;
    update(id: string, updateData: Partial<ICommunityRequest>): Promise<ICommunityRequest | null>;
    delete(id: string): Promise<ICommunityRequest | null>;
}