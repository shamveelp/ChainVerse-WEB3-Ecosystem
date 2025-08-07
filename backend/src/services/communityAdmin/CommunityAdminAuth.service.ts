import { injectable, inject } from "inversify";
import bcrypt from "bcryptjs";
import { TYPES } from "../../core/types/types";
import { ICommunityAdminAuthService } from "../../core/interfaces/services/communityAdmin/ICommunityAdminAuthService";
import { ICommunityAdminRepository } from "../../core/interfaces/repositories/ICommunityAdminRepository";
import { ICommunityAdmin } from "../../models/communityAdmin.model";
import { ICommunityRequestRepository } from "../../core/interfaces/repositories/ICommunityRequestRepository";
import CommunityModel from "../../models/community.model";
import logger from "../../utils/logger";

@injectable()
export class CommunityAdminAuthService implements ICommunityAdminAuthService {
    constructor(
        @inject(TYPES.ICommunityAdminRepository) private communityAdminRepo: ICommunityAdminRepository,
        @inject(TYPES.ICommunityRequestRepository) private communityRequestRepo: ICommunityRequestRepository
    ) {}

    async loginCommunityAdmin(email: string, password: string): Promise<ICommunityAdmin | null> {
        const communityAdmin = await this.communityAdminRepo.findByEmail(email);
        
        if (!communityAdmin) {
            throw new Error("Invalid credentials");
        }

        const communityRequest = await this.communityRequestRepo.findByEmail(email);
        if (!communityRequest) {
            throw new Error("No application found");
        }

        if (communityRequest.status === 'pending') {
            throw new Error("Your application is under review");
        }

        if (communityRequest.status === 'rejected') {
            throw new Error("Your application has been rejected");
        }

        if (communityRequest.status !== 'approved') {
            throw new Error("Access denied");
        }

        const isPasswordValid = await bcrypt.compare(password, communityAdmin.password);
        if (!isPasswordValid) {
            throw new Error("Invalid credentials");
        }

        await this.communityAdminRepo.updateCommunityAdmin(
            communityAdmin._id.toString(), 
            { lastLogin: new Date() }
        );

        return communityAdmin;
    }

    async registerCommunityAdmin(data: Partial<ICommunityAdmin>): Promise<ICommunityAdmin> {
        const existingAdmin = await this.communityAdminRepo.findByEmail(data.email!);
        if (existingAdmin) {
            throw new Error("Community admin already exists with this email");
        }

        const hashedPassword = await bcrypt.hash(data.password!, 12);
        const communityAdminData = {
            ...data,
            password: hashedPassword,
            role: 'communityAdmin' as const,
            isActive: true
        };

        return await this.communityAdminRepo.createCommunityAdmin(communityAdminData);
    }

    async resetPassword(email: string, password: string): Promise<void> {
        const communityAdmin = await this.communityAdminRepo.findByEmail(email);
        if (!communityAdmin) {
            throw new Error("Community admin not found");
        }

        const hashedPassword = await bcrypt.hash(password, 12);
        await this.communityAdminRepo.updateCommunityAdmin(
            communityAdmin._id.toString(),
            { password: hashedPassword }
        );

        logger.info(`Password reset successful for community admin: ${email}`);
    }

    async createCommunityFromRequest(requestId: string): Promise<void> {
        const request = await this.communityRequestRepo.findById(requestId);
        if (!request) {
            throw new Error("Community request not found");
        }

        const community = new CommunityModel({
            communityName: request.communityName,
            email: request.email,
            username: request.username,
            walletAddress: request.walletAddress,
            description: request.description,
            category: request.category,
            rules: request.rules,
            logo: request.logo,
            banner: request.banner,
            socialLinks: request.socialLinks,
            status: 'approved',
            isVerified: false,
            members: [],
            communityAdmins: []
        });

        const savedCommunity = await community.save();

        const communityAdmin = await this.communityAdminRepo.findByEmail(request.email);
        if (communityAdmin) {
            await this.communityAdminRepo.updateCommunityAdmin(
                communityAdmin._id.toString(),
                { communityId: savedCommunity._id }
            );

            savedCommunity.communityAdmins.push(communityAdmin._id);
            await savedCommunity.save();
        }

        logger.info(`Community created from request: ${requestId}`);
    }
}
