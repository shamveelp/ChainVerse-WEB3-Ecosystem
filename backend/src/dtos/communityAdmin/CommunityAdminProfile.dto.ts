import { IsOptional, IsString, MinLength, MaxLength, IsUrl } from 'class-validator';
import { Transform } from 'class-transformer';
import { BaseResponseDto } from '../base/BaseResponse.dto';

export class UpdateCommunityAdminProfileDto {
  @IsOptional()
  @IsString({ message: 'Name must be a string' })
  @MinLength(2, { message: 'Name must be at least 2 characters long' })
  @MaxLength(50, { message: 'Name must be at most 50 characters long' })
  @Transform(({ value }) => typeof value === 'string' ? value.trim() : value)
  name?: string;

  @IsOptional()
  @IsString({ message: 'Bio must be a string' })
  @MaxLength(500, { message: 'Bio must be at most 500 characters long' })
  @Transform(({ value }) => typeof value === 'string' ? value.trim() : value)
  bio?: string;

  @IsOptional()
  @IsString({ message: 'Location must be a string' })
  @MaxLength(100, { message: 'Location must be at most 100 characters long' })
  @Transform(({ value }) => typeof value === 'string' ? value.trim() : value)
  location?: string;

  @IsOptional()
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      const trimmed = value.trim();
      return trimmed.length === 0 ? undefined : trimmed;
    }
    return value;
  })
  @IsUrl({}, { message: 'Website must be a valid URL' })
  website?: string;

  @IsOptional()
  @IsString({ message: 'Profile picture must be a string' })
  profilePic?: string;

  @IsOptional()
  @IsString({ message: 'Banner image must be a string' })
  bannerImage?: string;
}

export class CommunityAdminProfileResponseDto extends BaseResponseDto {
  _id: string;
  name: string;
  email: string;
  username: string; // Community username
  bio?: string;
  location?: string;
  website?: string;
  profilePic?: string;
  bannerImage?: string;
  communityId?: string;
  communityName?: string;
  communityLogo?: string;
  isActive: boolean;
  lastLogin?: Date;
  joinDate: Date;
  stats: {
    totalMembers: number;
    activeMembers: number;
    totalPosts: number;
    totalQuests: number;
    premiumMembers: number;
    engagementRate: number;
    myPostsCount: number;
    myLikesCount: number;
    myCommentsCount: number;
  };

  constructor(admin: any, community?: any, stats?: any) {
    super(true, 'Profile retrieved successfully');
    this._id = admin._id.toString();
    this.name = admin.name;
    this.email = admin.email;
    this.username = community?.username || '';
    this.bio = admin.bio || '';
    this.location = admin.location || '';
    this.website = admin.website || '';
    this.profilePic = admin.profilePic || '';
    this.bannerImage = admin.bannerImage || '';
    this.communityId = admin.communityId?.toString();
    this.communityName = community?.communityName || '';
    this.communityLogo = community?.logo || '';
    this.isActive = admin.isActive;
    this.lastLogin = admin.lastLogin;
    this.joinDate = admin.createdAt;
    this.stats = stats || {
      totalMembers: 0,
      activeMembers: 0,
      totalPosts: 0,
      totalQuests: 0,
      premiumMembers: 0,
      engagementRate: 0,
      myPostsCount: 0,
      myLikesCount: 0,
      myCommentsCount: 0
    };
  }
}

export class CommunityStatsDto {
  totalMembers: number;
  activeMembers: number;
  newMembersThisWeek: number;
  totalPosts: number;
  postsThisWeek: number;
  totalQuests: number;
  activeQuests: number;
  premiumMembers: number;
  engagementRate: number;
  averagePostsPerMember: number;
  myPostsCount: number;
  myLikesCount: number;
  myCommentsCount: number;
  topActiveMembers: {
    _id: string;
    username: string;
    name: string;
    profilePic: string;
    totalPosts: number;
    totalLikes: number;
  }[];

  constructor(data: any) {
    this.totalMembers = data.totalMembers || 0;
    this.activeMembers = data.activeMembers || 0;
    this.newMembersThisWeek = data.newMembersThisWeek || 0;
    this.totalPosts = data.totalPosts || 0;
    this.postsThisWeek = data.postsThisWeek || 0;
    this.totalQuests = data.totalQuests || 0;
    this.activeQuests = data.activeQuests || 0;
    this.premiumMembers = data.premiumMembers || 0;
    this.engagementRate = data.engagementRate || 0;
    this.averagePostsPerMember = data.averagePostsPerMember || 0;
    this.myPostsCount = data.myPostsCount || 0;
    this.myLikesCount = data.myLikesCount || 0;
    this.myCommentsCount = data.myCommentsCount || 0;
    this.topActiveMembers = data.topActiveMembers || [];
  }
}