import { injectable, inject } from "inversify";
import { ICommunityUserService } from "../../core/interfaces/services/community/ICommunityUser.service";
import { ICommunityRepository } from "../../core/interfaces/repositories/ICommunity.repository";
import { TYPES } from "../../core/types/types";
import { CustomError } from "../../utils/customError";
import { StatusCode } from "../../enums/statusCode.enum";
import { CommunityProfileResponseDto, UpdateCommunityProfileDto } from "../../dtos/community/CommunityProfile.dto";

@injectable()
export class CommunityUserService implements ICommunityUserService {
    constructor(
        @inject(TYPES.ICommunityRepository) private _communityRepository: ICommunityRepository
    ) {}

    async getCommunityProfile(userId: string, viewerUserId?: string): Promise<CommunityProfileResponseDto | null> {
        try {
            

            if (!userId) {
                throw new CustomError("User ID is required", StatusCode.BAD_REQUEST);
            }

            const user = await this._communityRepository.findUserById(userId);
            

            if (!user) {
                throw new CustomError("User profile not found", StatusCode.NOT_FOUND);
            }

            if (!user.community.settings.isProfilePublic && viewerUserId !== userId) {
                throw new CustomError("Profile is private", StatusCode.FORBIDDEN);
            }

            // Check if viewer is following this user (if viewer is authenticated and different user)
            let isFollowing = false;
            if (viewerUserId && viewerUserId !== userId) {
                isFollowing = await this._communityRepository.checkIfFollowing(viewerUserId, userId);
            }

            const profileData: CommunityProfileResponseDto = {
                _id: user._id.toString(),
                username: user.username,
                name: user.name || "",
                email: user.email,
                profilePic: user.profilePic || "",
                followersCount: user.community.settings.showFollowersCount ? user.followersCount : 0,
                followingCount: user.community.settings.showFollowingCount ? user.followingCount : 0,
                bio: user.community.bio || "",
                location: user.community.location || "",
                website: user.community.website || "",
                bannerImage: user.community.bannerImage || "",
                isVerified: user.community.isVerified || false,
                postsCount: user.community.postsCount || 0,
                likesReceived: user.community.likesReceived || 0,
                socialLinks: {
                    twitter: user.community.socialLinks.twitter || "",
                    instagram: user.community.socialLinks.instagram || "",
                    linkedin: user.community.socialLinks.linkedin || "",
                    github: user.community.socialLinks.github || ""
                },
                settings: {
                    isProfilePublic: user.community.settings.isProfilePublic,
                    allowDirectMessages: user.community.settings.allowDirectMessages,
                    showFollowersCount: user.community.settings.showFollowersCount,
                    showFollowingCount: user.community.settings.showFollowingCount
                },
                joinDate: user.createdAt,
                isOwnProfile: viewerUserId === userId,
                isFollowing: isFollowing
            };

            
            return profileData;
        } catch (error) {
            if (error instanceof CustomError) {
                throw error;
            }
            throw new CustomError("Failed to fetch community profile", StatusCode.INTERNAL_SERVER_ERROR);
        }
    }

    async getCommunityProfileByUsername(username: string, viewerUserId?: string): Promise<CommunityProfileResponseDto | null> {
        try {
            

            if (!username) {
                throw new CustomError("Username is required", StatusCode.BAD_REQUEST);
            }

            const user = await this._communityRepository.findUserByUsername(username);

            if (!user) {
                throw new CustomError("User profile not found", StatusCode.NOT_FOUND);
            }

            return await this.getCommunityProfile(user._id.toString(), viewerUserId);
        } catch (error) {
            if (error instanceof CustomError) {
                throw error;
            }
            throw new CustomError("Failed to fetch community profile", StatusCode.INTERNAL_SERVER_ERROR);
        }
    }

    async updateCommunityProfile(userId: string, data: UpdateCommunityProfileDto): Promise<CommunityProfileResponseDto | null> {
        try {
            

            if (!userId) {
                throw new CustomError("User ID is required", StatusCode.BAD_REQUEST);
            }

            // Validate website URL if provided
            if (data.website && data.website.trim() !== "") {
                const websiteRegex = /^https?:\/\/.+/;
                if (!websiteRegex.test(data.website)) {
                    throw new CustomError("Website must be a valid URL starting with http:// or https://", StatusCode.BAD_REQUEST);
                }
            }

            const updateData = {
                ...data,
                website: data.website?.trim() || "",
                bio: data.bio?.trim() || "",
                location: data.location?.trim() || ""
            };

            

            const updatedUser = await this._communityRepository.updateCommunityProfile(userId, updateData as any);

            if (!updatedUser) {
                throw new CustomError("User profile not found after update", StatusCode.NOT_FOUND);
            }

            
            return await this.getCommunityProfile(userId, userId);
        } catch (error) {
            if (error instanceof CustomError) {
                throw error;
            }
            throw new CustomError("Failed to update community profile", StatusCode.INTERNAL_SERVER_ERROR);
        }
    }

    async uploadBannerImage(userId: string, bannerUrl: string): Promise<CommunityProfileResponseDto | null> {
        try {
            

            if (!userId) {
                throw new CustomError("User ID is required", StatusCode.BAD_REQUEST);
            }

            if (!bannerUrl) {
                throw new CustomError("Banner URL is required", StatusCode.BAD_REQUEST);
            }

            const updatedUser = await this._communityRepository.updateCommunityProfile(userId, { bannerImage: bannerUrl });

            if (!updatedUser) {
                throw new CustomError("User profile not found after update", StatusCode.NOT_FOUND);
            }

            
            return await this.getCommunityProfile(userId, userId);
        } catch (error) {
            if (error instanceof CustomError) {
                throw error;
            }
            throw new CustomError("Failed to upload banner image", StatusCode.INTERNAL_SERVER_ERROR);
        }
    }
}