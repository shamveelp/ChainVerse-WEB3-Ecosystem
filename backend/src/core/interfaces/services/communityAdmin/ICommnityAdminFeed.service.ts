import {
    CommunityFeedResponseDto,
    CommunityEngagementStatsDto,
    AdminPostResponseDto
} from "../../../../dtos/communityAdmin/CommunityAdminFeed.dto";
import {
    CreateCommentDto,
    LikeResponseDto,
    ShareResponseDto,
    CommentResponseDto
} from "../../../../dtos/posts/Post.dto";

export interface ICommunityAdminFeedService {
    getCommunityFeed(adminId: string, cursor?: string, limit?: number, type?: string): Promise<CommunityFeedResponseDto>;
    togglePostLike(adminId: string, postId: string): Promise<LikeResponseDto>;
    createComment(adminId: string, data: CreateCommentDto): Promise<CommentResponseDto>;
    sharePost(adminId: string, postId: string, shareText?: string): Promise<ShareResponseDto>;
    getEngagementStats(adminId: string, period?: string): Promise<CommunityEngagementStatsDto>;
    pinPost(adminId: string, postId: string): Promise<Record<string, unknown>>;
    deletePost(adminId: string, postId: string, reason?: string): Promise<Record<string, unknown>>;
    getPostById(adminId: string, postId: string): Promise<AdminPostResponseDto>;
    getPostComments(adminId: string, postId: string, cursor?: string, limit?: number): Promise<{ comments: CommentResponseDto[]; hasMore: boolean; nextCursor?: string }>;
}