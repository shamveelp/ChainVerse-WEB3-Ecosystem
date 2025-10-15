import {
    CommunityFeedResponseDto,
    CommunityEngagementStatsDto
} from "../../../../dtos/communityAdmin/CommunityAdminFeed.dto";
import {
    CreateCommentDto,
    LikeResponseDto
} from "../../../../dtos/posts/Post.dto";

export interface ICommunityAdminFeedService {
    getCommunityFeed(adminId: string, cursor?: string, limit?: number, type?: string): Promise<CommunityFeedResponseDto>;
    togglePostLike(adminId: string, postId: string): Promise<LikeResponseDto>;
    createComment(adminId: string, data: CreateCommentDto): Promise<any>;
    getEngagementStats(adminId: string, period?: string): Promise<CommunityEngagementStatsDto>;
    pinPost(adminId: string, postId: string): Promise<any>;
    deletePost(adminId: string, postId: string, reason?: string): Promise<any>;
}