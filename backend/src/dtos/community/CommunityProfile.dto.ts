import { IsString, IsBoolean, IsUrl, IsOptional, MaxLength, IsObject, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class SocialLinksDto {
    @IsOptional()
    @IsString()
    @MaxLength(200)
    twitter?: string;

    @IsOptional()
    @IsString()
    @MaxLength(200)
    instagram?: string;

    @IsOptional()
    @IsString()
    @MaxLength(200)
    linkedin?: string;

    @IsOptional()
    @IsString()
    @MaxLength(200)
    github?: string;
}

export class CommunitySettingsDto {
    @IsOptional()
    @IsBoolean()
    isProfilePublic?: boolean;

    @IsOptional()
    @IsBoolean()
    allowDirectMessages?: boolean;

    @IsOptional()
    @IsBoolean()
    showFollowersCount?: boolean;

    @IsOptional()
    @IsBoolean()
    showFollowingCount?: boolean;
}

export class UpdateCommunityProfileDto {
    @IsOptional()
    @IsString()
    @MaxLength(500)
    bio?: string;

    @IsOptional()
    @IsString()
    @MaxLength(100)
    location?: string;

    @IsOptional()
    @IsString()
    @MaxLength(200)
    website?: string;

    @IsOptional()
    @IsString()
    bannerImage?: string;

    @IsOptional()
    @IsObject()
    @ValidateNested()
    @Type(() => SocialLinksDto)
    socialLinks?: SocialLinksDto;

    @IsOptional()
    @IsObject()
    @ValidateNested()
    @Type(() => CommunitySettingsDto)
    settings?: CommunitySettingsDto;
}

export class CommunityProfileResponseDto {
    _id: string | undefined;
    username: string | undefined;
    name: string | undefined;
    email: string | undefined;
    profilePic: string | undefined;
    followersCount: number | undefined;
    followingCount: number | undefined;
    bio: string | undefined;
    location: string | undefined;
    website: string | undefined;
    bannerImage: string | undefined;
    isVerified: boolean | undefined;
    postsCount: number | undefined;
    likesReceived: number | undefined;
    socialLinks: SocialLinksDto | undefined;
    settings: CommunitySettingsDto | undefined;
    joinDate: Date | undefined;
    isOwnProfile: boolean | undefined;
    isFollowing?: boolean | undefined; // Added for follow status
}