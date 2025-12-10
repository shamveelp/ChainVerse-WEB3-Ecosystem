import {
    CommunityFeedResponseDto,
    CommunityEngagementStatsDto
} from "../../../../dtos/communityAdmin/CommunityAdminFeed.dto";
import {
    CreateCommentDto,
    LikeResponseDto,
    ShareResponseDto
} from "../../../../dtos/posts/Post.dto";

export interface ICommunityAdminFeedService {
    getCommunityFeed(adminId: string, cursor?: string, limit?: number, type?: string): Promise<CommunityFeedResponseDto>;
    togglePostLike(adminId: string, postId: string): Promise<LikeResponseDto>;
    createComment(adminId: string, data: CreateCommentDto): Promise<any>;
    sharePost(adminId: string, postId: string, shareText?: string): Promise<ShareResponseDto>;
    getEngagementStats(adminId: string, period?: string): Promise<CommunityEngagementStatsDto>;
    pinPost(adminId: string, postId: string): Promise<any>;
    deletePost(adminId: string, postId: string, reason?: string): Promise<any>;
    getPostById(adminId: string, postId: string): Promise<any>;
    getPostComments(adminId: string, postId: string, cursor?: string, limit?: number): Promise<any>;
}