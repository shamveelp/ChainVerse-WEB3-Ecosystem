import { injectable, inject } from "inversify";
import { TYPES } from "../../core/types/types";
import { CustomError } from "../../utils/customError";
import { StatusCode } from "../../enums/statusCode.enum";
import logger from "../../utils/logger";
import { ICommunityAdminPostService } from "../../core/interfaces/services/communityAdmin/ICommunityAdminPostService";
import { ICommunityAdminPostRepository } from "../../core/interfaces/repositories/communityAdmin/ICommunityAdminPost.repository";
import { ICommunityAdminRepository } from "../../core/interfaces/repositories/ICommunityAdminRepository";
import { IPostRepository } from "../../core/interfaces/repositories/IPostRepository";
import CommunityMemberModel from "../../models/communityMember.model";
import {
    CreateCommunityAdminPostDto,
    UpdateCommunityAdminPostDto,
    CommunityAdminPostResponseDto,
    CommunityAdminPostsListResponseDto,
    CommunityAdminCommentDto,
    CommunityAdminCommentResponseDto,
    GetCommunityAdminPostsQueryDto
} from "../../dtos/communityAdmin/CommunityAdminPost.dto";
import { 
    CommunityFeedResponseDto 
} from "../../dtos/communityAdmin/CommunityAdminFeed.dto";
import { LikeResponseDto } from "../../dtos/posts/Post.dto";

@injectable()
export class CommunityAdminPostService implements ICommunityAdminPostService {
    constructor(
        @inject(TYPES.ICommunityAdminPostRepository) private _postRepository: ICommunityAdminPostRepository,
        @inject(TYPES.ICommunityAdminRepository) private _adminRepository: ICommunityAdminRepository,
        @inject(TYPES.IPostRepository) private _userPostRepository: IPostRepository
    ) {}

    async createPost(adminId: string, data: CreateCommunityAdminPostDto): Promise<CommunityAdminPostResponseDto> {
        try {
            // Verify admin exists
            const admin = await this._adminRepository.findById(adminId);
            if (!admin) {
                throw new CustomError("Community admin not found", StatusCode.NOT_FOUND);
            }

            const post = await this._postRepository.createPost(
                adminId,
                data.content,
                data.mediaUrls,
                data.mediaType
            );

            // Check if admin liked this post (always false for new posts)
            const isLiked = false;

            return new CommunityAdminPostResponseDto(post, adminId, isLiked);
        } catch (error) {
            logger.error("CommunityAdminPostService: Create post error:", error);
            if (error instanceof CustomError) {
                throw error;
            }
            throw new CustomError("Failed to create post", StatusCode.INTERNAL_SERVER_ERROR);
        }
    }

    async getPostById(adminId: string, postId: string): Promise<CommunityAdminPostResponseDto> {
        try {
            const post = await this._postRepository.findPostById(postId);
            if (!post) {
                throw new CustomError("Post not found", StatusCode.NOT_FOUND);
            }

            const isLiked = await this._postRepository.checkIfLiked(adminId, postId);

            return new CommunityAdminPostResponseDto(post, adminId, isLiked);
        } catch (error) {
            logger.error("CommunityAdminPostService: Get post error:", error);
            if (error instanceof CustomError) {
                throw error;
            }
            throw new CustomError("Failed to fetch post", StatusCode.INTERNAL_SERVER_ERROR);
        }
    }

    async updatePost(adminId: string, postId: string, data: UpdateCommunityAdminPostDto): Promise<CommunityAdminPostResponseDto> {
        try {
            const updatedPost = await this._postRepository.updatePost(postId, adminId, {
                content: data.content,
                mediaUrls: data.mediaUrls
            });

            if (!updatedPost) {
                throw new CustomError("Post not found or unauthorized", StatusCode.NOT_FOUND);
            }

            const isLiked = await this._postRepository.checkIfLiked(adminId, postId);

            return new CommunityAdminPostResponseDto(updatedPost, adminId, isLiked);
        } catch (error) {
            logger.error("CommunityAdminPostService: Update post error:", error);
            if (error instanceof CustomError) {
                throw error;
            }
            throw new CustomError("Failed to update post", StatusCode.INTERNAL_SERVER_ERROR);
        }
    }

    async deletePost(adminId: string, postId: string): Promise<{ success: boolean; message: string }> {
        try {
            const success = await this._postRepository.deletePost(postId, adminId);
            
            if (!success) {
                throw new CustomError("Post not found or unauthorized", StatusCode.NOT_FOUND);
            }

            return {
                success: true,
                message: "Post deleted successfully"
            };
        } catch (error) {
            logger.error("CommunityAdminPostService: Delete post error:", error);
            if (error instanceof CustomError) {
                throw error;
            }
            throw new CustomError("Failed to delete post", StatusCode.INTERNAL_SERVER_ERROR);
        }
    }

    async getAdminPosts(adminId: string, query: GetCommunityAdminPostsQueryDto): Promise<CommunityAdminPostsListResponseDto> {
        try {
            const { cursor, limit = 10, type = 'all' } = query;

            const result = await this._postRepository.getAdminPosts(adminId, cursor, limit, type);

            // Transform posts with like status
            const transformedPosts = await Promise.all(
                result.posts.map(async (post) => {
                    const isLiked = await this._postRepository.checkIfLiked(adminId, post._id.toString());
                    return new CommunityAdminPostResponseDto(post, adminId, isLiked);
                })
            );

            return new CommunityAdminPostsListResponseDto(
                transformedPosts,
                result.hasMore,
                result.nextCursor,
                transformedPosts.length
            );
        } catch (error) {
            logger.error("CommunityAdminPostService: Get admin posts error:", error);
            if (error instanceof CustomError) {
                throw error;
            }
            throw new CustomError("Failed to fetch posts", StatusCode.INTERNAL_SERVER_ERROR);
        }
    }

    async togglePostLike(adminId: string, postId: string): Promise<LikeResponseDto> {
        try {
            // Check if post exists
            const post = await this._postRepository.findPostById(postId);
            if (!post) {
                throw new CustomError("Post not found", StatusCode.NOT_FOUND);
            }

            const isLiked = await this._postRepository.checkIfLiked(adminId, postId);

            let newLikesCount: number;
            let isNowLiked: boolean;
            let message: string;

            if (isLiked) {
                await this._postRepository.unlikePost(adminId, postId);
                newLikesCount = Math.max(0, post.likesCount - 1);
                isNowLiked = false;
                message = "Post unliked successfully";
            } else {
                await this._postRepository.likePost(adminId, postId);
                newLikesCount = post.likesCount + 1;
                isNowLiked = true;
                message = "Post liked successfully";
            }

            return {
                success: true,
                isLiked: isNowLiked,
                likesCount: newLikesCount,
                message
            };
        } catch (error) {
            logger.error("CommunityAdminPostService: Toggle post like error:", error);
            if (error instanceof CustomError) {
                throw error;
            }
            throw new CustomError("Failed to toggle post like", StatusCode.INTERNAL_SERVER_ERROR);
        }
    }

    async createComment(adminId: string, data: CommunityAdminCommentDto): Promise<CommunityAdminCommentResponseDto> {
        try {
            // Verify post exists
            const post = await this._postRepository.findPostById(data.postId);
            if (!post) {
                throw new CustomError("Post not found", StatusCode.NOT_FOUND);
            }

            const comment = await this._postRepository.createComment(
                adminId,
                data.postId,
                data.content,
                data.parentCommentId
            );

            const isLiked = false; // Always false for new comments

            return new CommunityAdminCommentResponseDto(comment, adminId, isLiked);
        } catch (error) {
            logger.error("CommunityAdminPostService: Create comment error:", error);
            if (error instanceof CustomError) {
                throw error;
            }
            throw new CustomError("Failed to create comment", StatusCode.INTERNAL_SERVER_ERROR);
        }
    }

    async getPostComments(adminId: string, postId: string, cursor?: string, limit: number = 10): Promise<{
        comments: CommunityAdminCommentResponseDto[];
        hasMore: boolean;
        nextCursor?: string;
    }> {
        try {
            const result = await this._postRepository.getPostComments(postId, cursor, limit);

            const transformedComments = await Promise.all(
                result.comments.map(async (comment) => {
                    const isLiked = await this._postRepository.checkIfCommentLiked(adminId, comment._id.toString());
                    return new CommunityAdminCommentResponseDto(comment, adminId, isLiked);
                })
            );

            return {
                comments: transformedComments,
                hasMore: result.hasMore,
                nextCursor: result.nextCursor
            };
        } catch (error) {
            logger.error("CommunityAdminPostService: Get post comments error:", error);
            if (error instanceof CustomError) {
                throw error;
            }
            throw new CustomError("Failed to fetch comments", StatusCode.INTERNAL_SERVER_ERROR);
        }
    }

    async toggleCommentLike(adminId: string, commentId: string): Promise<LikeResponseDto> {
        try {
            const comment = await this._postRepository.findCommentById(commentId);
            if (!comment) {
                throw new CustomError("Comment not found", StatusCode.NOT_FOUND);
            }

            const isLiked = await this._postRepository.checkIfCommentLiked(adminId, commentId);

            let newLikesCount: number;
            let isNowLiked: boolean;
            let message: string;

            if (isLiked) {
                await this._postRepository.unlikeComment(adminId, commentId);
                newLikesCount = Math.max(0, comment.likesCount - 1);
                isNowLiked = false;
                message = "Comment unliked successfully";
            } else {
                await this._postRepository.likeComment(adminId, commentId);
                newLikesCount = comment.likesCount + 1;
                isNowLiked = true;
                message = "Comment liked successfully";
            }

            return {
                success: true,
                isLiked: isNowLiked,
                likesCount: newLikesCount,
                message
            };
        } catch (error) {
            logger.error("CommunityAdminPostService: Toggle comment like error:", error);
            if (error instanceof CustomError) {
                throw error;
            }
            throw new CustomError("Failed to toggle comment like", StatusCode.INTERNAL_SERVER_ERROR);
        }
    }

    // Enhanced feed functionality
    async getCommunityMembersFeed(adminId: string, cursor?: string, limit: number = 10): Promise<CommunityFeedResponseDto> {
        try {
            const admin = await this._adminRepository.findById(adminId);
            if (!admin || !admin.communityId) {
                throw new CustomError("Community admin or community not found", StatusCode.NOT_FOUND);
            }

            const communityId = admin.communityId.toString();

            // Get community members
            const members = await CommunityMemberModel.find({ 
                communityId, 
                isActive: true 
            }).select('userId');
            
            const memberIds = members.map(member => member.userId.toString());

            if (memberIds.length === 0) {
                return new CommunityFeedResponseDto([], false, undefined, 0, {
                    totalMembers: 0,
                    activeMembersToday: 0,
                    postsToday: 0,
                    engagementRate: 0
                });
            }

            // Get posts from community members using user post repository
            const postsResult = await this._userPostRepository.getPostsByUserIds(memberIds, cursor, limit);

            // Transform posts for admin context
            const transformedPosts = await Promise.all(
                postsResult.posts.map(async (post: any) => {
                    const isLiked = await this._userPostRepository.checkIfLiked(adminId, post._id);
                    return {
                        ...post,
                        isLiked,
                        isOwnPost: false,
                        canModerate: true,
                        author: {
                            ...post.author,
                            isCommunityMember: true
                        }
                    };
                })
            );

            const communityStats = await this._getCommunityStats(communityId);

            return new CommunityFeedResponseDto(
                transformedPosts,
                postsResult.hasMore,
                postsResult.nextCursor,
                transformedPosts.length,
                communityStats
            );
        } catch (error) {
            logger.error("CommunityAdminPostService: Get community members feed error:", error);
            if (error instanceof CustomError) {
                throw error;
            }
            throw new CustomError("Failed to fetch community members feed", StatusCode.INTERNAL_SERVER_ERROR);
        }
    }

    private async _getCommunityStats(communityId: string): Promise<any> {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const [totalMembers, activeMembersToday, members] = await Promise.all([
            CommunityMemberModel.countDocuments({ communityId, isActive: true }),
            CommunityMemberModel.countDocuments({
                communityId,
                isActive: true,
                lastActiveAt: { $gte: today }
            }),
            CommunityMemberModel.find({ communityId, isActive: true }).select('userId')
        ]);

        const memberIds = members.map(member => member.userId.toString());
        const postsToday = memberIds.length > 0
            ? await this._userPostRepository.getPostCountByUsersAfterDate(memberIds, today)
            : 0;

        const engagementRate = totalMembers > 0 ? (activeMembersToday / totalMembers) * 100 : 0;

        return {
            totalMembers,
            activeMembersToday,
            postsToday,
            engagementRate
        };
    }
}