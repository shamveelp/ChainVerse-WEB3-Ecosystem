import {
    CreateCommunityAdminPostDto,
    UpdateCommunityAdminPostDto,
    CommunityAdminPostResponseDto,
    CommunityAdminPostsListResponseDto,
    CommunityAdminCommentDto,
    CommunityAdminCommentResponseDto,
    GetCommunityAdminPostsQueryDto
} from "../../../../dtos/communityAdmin/CommunityAdminPost.dto";
import { CommunityFeedResponseDto } from "../../../../dtos/communityAdmin/CommunityAdminFeed.dto";
import { LikeResponseDto } from "../../../../dtos/posts/Post.dto";

export interface ICommunityAdminPostService {
    // Post operations
    createPost(adminId: string, data: CreateCommunityAdminPostDto): Promise<CommunityAdminPostResponseDto>;
    getPostById(adminId: string, postId: string): Promise<CommunityAdminPostResponseDto>;
    updatePost(adminId: string, postId: string, data: UpdateCommunityAdminPostDto): Promise<CommunityAdminPostResponseDto>;
    deletePost(adminId: string, postId: string): Promise<{ success: boolean; message: string }>;
    getAdminPosts(adminId: string, query: GetCommunityAdminPostsQueryDto): Promise<CommunityAdminPostsListResponseDto>;
    
    // Like operations
    togglePostLike(adminId: string, postId: string): Promise<LikeResponseDto>;
    
    // Comment operations
    createComment(adminId: string, data: CommunityAdminCommentDto): Promise<CommunityAdminCommentResponseDto>;
    getPostComments(adminId: string, postId: string, cursor?: string, limit?: number): Promise<{
        comments: CommunityAdminCommentResponseDto[];
        hasMore: boolean;
        nextCursor?: string;
    }>;
    toggleCommentLike(adminId: string, commentId: string): Promise<LikeResponseDto>;
    
    // Feed operations
    getCommunityMembersFeed(adminId: string, cursor?: string, limit?: number): Promise<CommunityFeedResponseDto>;
}