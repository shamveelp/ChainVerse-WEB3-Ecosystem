import { BaseResponseDto } from '../base/BaseResponse.dto';

export interface UpdateCommunityAdminProfileDto {
    name?: string;
    bio?: string;
    location?: string;
    website?: string;
    profilePic?: string;
    bannerImage?: string;
    socialLinks?: {
        twitter?: string;
        linkedin?: string;
        github?: string;
    };
    settings?: {
        showEmail?: boolean;
        allowDirectMessages?: boolean;
        emailNotifications?: boolean;
    };
}

export interface CommunityAdminProfileResponseDto {
    _id: string;
    name: string;
    email: string;
    bio?: string;
    location?: string;
    website?: string;
    profilePic?: string;
    bannerImage?: string;
    socialLinks: {
        twitter?: string;
        linkedin?: string;
        github?: string;
    };
    settings: {
        showEmail: boolean;
        allowDirectMessages: boolean;
        emailNotifications: boolean;
    };
    community: {
        _id: string;
        name: string;
        username: string;
        description: string;
        category: string;
        logo: string;
        banner: string;
        isVerified: boolean;
        memberCount: number;
        totalPosts: number;
    };
    stats: {
        totalPosts: number;
        totalLikes: number;
        totalComments: number;
        totalShares: number;
        joinDate: Date;
        lastLogin: Date;
    };
    isOwnProfile: boolean;
}

export class CommunityAdminProfileResponse extends BaseResponseDto {
    profile: CommunityAdminProfileResponseDto;

    constructor(profile: CommunityAdminProfileResponseDto, message: string = 'Profile retrieved successfully') {
        super(true, message);
        this.profile = profile;
    }
}