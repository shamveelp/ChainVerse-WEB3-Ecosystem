import { ICommunityAdmin } from "../../../../models/communityAdmin.model";

export interface ICommunityAdminAuthService {
    loginCommunityAdmin(email: string, password: string): Promise<ICommunityAdmin | null>;
    registerCommunityAdmin(data: Partial<ICommunityAdmin>): Promise<ICommunityAdmin>;
    resetPassword(email: string, password: string): Promise<void>;
    createCommunityFromRequest(requestId: string): Promise<void>;
}
