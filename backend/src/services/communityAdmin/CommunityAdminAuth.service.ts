import { injectable, inject } from "inversify";
import bcrypt from "bcryptjs";
import { TYPES } from "../../core/types/types";
import { ICommunityAdminAuthService } from "../../core/interfaces/services/communityAdmin/ICommunityAdminAuthService";
import { ICommunityAdminRepository } from "../../core/interfaces/repositories/ICommunityAdminRepository";
import { ICommunityAdmin } from "../../models/communityAdmin.model";
import { ICommunityRequestRepository } from "../../core/interfaces/repositories/ICommunityRequestRepository";
import CommunityModel from "../../models/community.model";
import logger from "../../utils/logger";
import { CustomError } from "../../utils/customError";
import { StatusCode } from "../../enums/statusCode.enum";

@injectable()
export class CommunityAdminAuthService implements ICommunityAdminAuthService {
    constructor(
        @inject(TYPES.ICommunityAdminRepository) private communityAdminRepo: ICommunityAdminRepository,
        @inject(TYPES.ICommunityRequestRepository) private communityRequestRepo: ICommunityRequestRepository
    ) {}

    async loginCommunityAdmin(email: string, password: string): Promise<ICommunityAdmin | null> {
        const communityAdmin = await this.communityAdminRepo.findByEmail(email);
        
        if (!communityAdmin) {
            throw new CustomError("Invalid credentials", StatusCode.UNAUTHORIZED);
        }

        const communityRequest = await this.communityRequestRepo.findByEmail(email);
        if (!communityRequest) {
            throw new CustomError("No application found", StatusCode.NOT_FOUND);
        }

        if (communityRequest.status === 'pending') {
            throw new CustomError("Your application is still under review", StatusCode.FORBIDDEN);
        }

        if (communityRequest.status === 'rejected') {
            throw new CustomError("Your application has been rejected", StatusCode.FORBIDDEN);
        }

        if (communityRequest.status !== 'approved') {
            throw new CustomError("Access denied", StatusCode.FORBIDDEN);
        }

        if (!communityAdmin.isActive) {
            throw new CustomError("Account has been deactivated", StatusCode.FORBIDDEN);
        }

        const isPasswordValid = await bcrypt.compare(password, communityAdmin.password);
        if (!isPasswordValid) {
            throw new CustomError("Invalid credentials", StatusCode.UNAUTHORIZED);
        }

        // Update last login
        await this.updateLastLogin(communityAdmin._id.toString());

        return communityAdmin;
    }

    async registerCommunityAdmin(data: Partial<ICommunityAdmin>): Promise<ICommunityAdmin> {
        const existingAdmin = await this.communityAdminRepo.findByEmail(data.email!);
        if (existingAdmin) {
            throw new CustomError("Community admin already exists with this email", StatusCode.BAD_REQUEST);
        }

        const hashedPassword = await bcrypt.hash(data.password!, 12);
        const communityAdminData = {
            ...data,
            password: hashedPassword,
            role: 'communityAdmin' as const,
            isActive: true,
            tokenVersion: 0
        };

        return await this.communityAdminRepo.createCommunityAdmin(communityAdminData);
    }

    async resetPassword(email: string, password: string): Promise<void> {
        const communityAdmin = await this.communityAdminRepo.findByEmail(email);
        if (!communityAdmin) {
            throw new CustomError("Community admin not found", StatusCode.NOT_FOUND);
        }

        const hashedPassword = await bcrypt.hash(password, 12);
        
        // Increment token version to invalidate existing sessions
        await this.communityAdminRepo.updateCommunityAdmin(
            communityAdmin._id.toString(),
            { 
                password: hashedPassword,
                tokenVersion: (communityAdmin.tokenVersion ?? 0) + 1
            }
        );

        logger.info(`Password reset successful for community admin: ${email}`);
    }

    async createCommunityFromRequest(requestId: string): Promise<void> {
        const request = await this.communityRequestRepo.findById(requestId);
        if (!request) {
            throw new CustomError("Community request not found", StatusCode.NOT_FOUND);
        }

        if (request.status !== 'approved') {
            throw new CustomError("Community request is not approved", StatusCode.BAD_REQUEST);
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
            communityAdmins: [],
            settings: {
                allowChainCast: false,
                allowGroupChat: true,
                allowPosts: true,
                allowQuests: false
            }
        });

        const savedCommunity = await community.save();

        // Update community admin with community ID
        const communityAdmin = await this.communityAdminRepo.findByEmail(request.email);
        if (communityAdmin) {
            await this.communityAdminRepo.updateCommunityAdmin(
                communityAdmin._id.toString(),
                { communityId: savedCommunity._id }
            );

            // Add admin to community
            savedCommunity.communityAdmins.push(communityAdmin._id);
            await savedCommunity.save();
        }

        logger.info(`Community created from request: ${requestId}`);
    }

    async incrementTokenVersion(id: string): Promise<void> {
        const communityAdmin = await this.communityAdminRepo.findById(id);
        if (!communityAdmin) {
            throw new CustomError("Community admin not found", StatusCode.NOT_FOUND);
        }

        await this.communityAdminRepo.updateCommunityAdmin(id, {
            tokenVersion: (communityAdmin.tokenVersion ?? 0) + 1
        });
    }

    async updateLastLogin(id: string): Promise<void> {
        await this.communityAdminRepo.updateCommunityAdmin(id, {
            lastLogin: new Date()
        });
    }
}