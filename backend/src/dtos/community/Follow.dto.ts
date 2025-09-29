import { IsString, IsNotEmpty, IsMongoId, IsOptional, IsNumber, Min } from 'class-validator';

export class FollowUserDto {
    @IsString()
    @IsNotEmpty()
    username: string | undefined;
}

export class UnfollowUserDto {
    @IsString()
    @IsNotEmpty()
    username: string | undefined; 
}

export class GetFollowersDto {
    @IsOptional()
    @IsString()
    cursor?: string;

    @IsOptional()
    @IsNumber()
    @Min(1)
    limit?: number = 20;
}

export class GetFollowingDto {
    @IsOptional()
    @IsString()
    cursor?: string;

    @IsOptional()
    @IsNumber()
    @Min(1)
    limit?: number = 20;
}

export class FollowStatusDto {
    @IsString()
    @IsNotEmpty()
    username: string | undefined;
}

export class UserFollowInfo {
    _id: string | undefined;
    username: string | undefined;
    name: string | undefined;
    profilePic: string | undefined;
    isVerified: boolean | undefined;
    bio: string | undefined;
    isFollowing: boolean | undefined;
    followedAt?: Date;
}

export class FollowResponseDto {
    success: boolean | undefined;
    message: string | undefined;
    isFollowing: boolean | undefined;
    followersCount: number | undefined;
    followingCount: number | undefined;
}

export class FollowListResponseDto {
    users: UserFollowInfo[] | undefined;
    hasMore: boolean | undefined;
    nextCursor?: string | undefined;
    totalCount: number | undefined;
}

export class FollowStatsDto {
    followersCount: number | undefined;
    followingCount: number | undefined;
}