import { ICommunityAdmin } from "../../../../models/communityAdmin.model";

export interface ICommunityAdminAuthService {
    registerCommunityAdmin(data: Partial<ICommunityAdmin>): Promise<ICommunityAdmin>;
    loginCommunityAdmin(email: string, password: string): Promise<ICommunityAdmin | null>;
    resetPassword(email: string, password: string): Promise<void>;
    createCommunityFromRequest(requestId: string): Promise<void>;
    incrementTokenVersion(id: string): Promise<void>;
    updateLastLogin(id: string): Promise<void>;
}