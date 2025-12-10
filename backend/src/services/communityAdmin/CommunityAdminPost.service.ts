import { injectable, inject } from "inversify";
import { TYPES } from "../../core/types/types";
import { CustomError } from "../../utils/customError";
import { StatusCode } from "../../enums/statusCode.enum";
import logger from "../../utils/logger";
import { ErrorMessages, SuccessMessages, LoggerMessages } from "../../enums/messages.enum";
import { ICommunityAdminPostService } from "../../core/interfaces/services/communityAdmin/ICommunityAdminPost.service";
import { ICommunityAdminPostRepository } from "../../core/interfaces/repositories/communityAdmin/ICommunityAdminPost.repository";
import { ICommunityAdminRepository } from "../../core/interfaces/repositories/ICommunityAdminRepository";
import { IPostRepository } from "../../core/interfaces/repositories/IPost.repository";
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
    ) { }

    /**
     * Creates a new post for community admin.
     * @param {string} adminId - Admin ID.
     * @param {CreateCommunityAdminPostDto} data - Post creation data.
     * @returns {Promise<CommunityAdminPostResponseDto>} Created post DTO.
     */
    async createPost(adminId: string, data: CreateCommunityAdminPostDto): Promise<CommunityAdminPostResponseDto> {
        try {
            // Verify admin exists
            const admin = await this._adminRepository.findById(adminId);
            if (!admin) {
                throw new CustomError(ErrorMessages.COMMUNITY_ADMIN_NOT_FOUND, StatusCode.NOT_FOUND);
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
            logger.error(LoggerMessages.CREATE_POST_ERROR, error);
            if (error instanceof CustomError) {
                throw error;
            }
            throw new CustomError(ErrorMessages.FAILED_CREATE_POST, StatusCode.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Retrieves a post by its ID.
     * @param {string} adminId - Admin ID.
     * @param {string} postId - Post ID.
     * @returns {Promise<CommunityAdminPostResponseDto>} Post DTO.
     */
    async getPostById(adminId: string, postId: string): Promise<CommunityAdminPostResponseDto> {
        try {
            const post = await this._postRepository.findPostById(postId);
            if (!post) {
                throw new CustomError(ErrorMessages.POST_NOT_FOUND, StatusCode.NOT_FOUND);
            }

            const isLiked = await this._postRepository.checkIfLiked(adminId, postId);

            return new CommunityAdminPostResponseDto(post, adminId, isLiked);
        } catch (error) {
            logger.error(LoggerMessages.GET_POST_ERROR, error);
            if (error instanceof CustomError) {
                throw error;
            }
            throw new CustomError(ErrorMessages.FAILED_GET_POST, StatusCode.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Updates an existing post.
     * @param {string} adminId - Admin ID.
     * @param {string} postId - Post ID.
     * @param {UpdateCommunityAdminPostDto} data - Update data.
     * @returns {Promise<CommunityAdminPostResponseDto>} Updated post DTO.
     */
    async updatePost(adminId: string, postId: string, data: UpdateCommunityAdminPostDto): Promise<CommunityAdminPostResponseDto> {
        try {
            const updatedPost = await this._postRepository.updatePost(postId, adminId, {
                content: data.content,
                mediaUrls: data.mediaUrls
            });

            if (!updatedPost) {
                throw new CustomError(ErrorMessages.POST_NOT_FOUND, StatusCode.NOT_FOUND);
            }

            const isLiked = await this._postRepository.checkIfLiked(adminId, postId);

            return new CommunityAdminPostResponseDto(updatedPost, adminId, isLiked);
        } catch (error) {
            logger.error(LoggerMessages.UPDATE_POST_ERROR, error);
            if (error instanceof CustomError) {
                throw error;
            }
            throw new CustomError(ErrorMessages.FAILED_UPDATE_POST, StatusCode.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Deletes a post.
     * @param {string} adminId - Admin ID.
     * @param {string} postId - Post ID.
     * @returns {Promise<{ success: boolean; message: string }>} Success response.
     */
    async deletePost(adminId: string, postId: string): Promise<{ success: boolean; message: string }> {
        try {
            const success = await this._postRepository.deletePost(postId, adminId);

            if (!success) {
                throw new CustomError(ErrorMessages.POST_NOT_FOUND, StatusCode.NOT_FOUND);
            }

            return {
                success: true,
                message: SuccessMessages.POST_DELETED_SUCCESS
            };
        } catch (error) {
            logger.error(LoggerMessages.DELETE_POST_ERROR, error);
            if (error instanceof CustomError) {
                throw error;
            }
            throw new CustomError(ErrorMessages.FAILED_DELETE_POST, StatusCode.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Retrieves posts created by the admin.
     * @param {string} adminId - Admin ID.
     * @param {GetCommunityAdminPostsQueryDto} query - Query parameters (pagination, type).
     * @returns {Promise<CommunityAdminPostsListResponseDto>} List of posts.
     */
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
            logger.error(LoggerMessages.GET_POSTS_ERROR, error);
            if (error instanceof CustomError) {
                throw error;
            }
            throw new CustomError(ErrorMessages.FAILED_GET_POSTS, StatusCode.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Toggles the like status of a post.
     * @param {string} adminId - Admin ID.
     * @param {string} postId - Post ID.
     * @returns {Promise<LikeResponseDto>} Like action response.
     */
    async togglePostLike(adminId: string, postId: string): Promise<LikeResponseDto> {
        try {
            // Check if post exists
            const post = await this._postRepository.findPostById(postId);
            if (!post) {
                throw new CustomError(ErrorMessages.POST_NOT_FOUND, StatusCode.NOT_FOUND);
            }

            const isLiked = await this._postRepository.checkIfLiked(adminId, postId);

            let newLikesCount: number;
            let isNowLiked: boolean;
            let message: string;

            if (isLiked) {
                await this._postRepository.unlikePost(adminId, postId);
                newLikesCount = Math.max(0, post.likesCount - 1);
                isNowLiked = false;
                message = SuccessMessages.POST_UNLIKED_SUCCESS;
            } else {
                await this._postRepository.likePost(adminId, postId);
                newLikesCount = post.likesCount + 1;
                isNowLiked = true;
                message = SuccessMessages.POST_LIKED_SUCCESS;
            }

            return {
                success: true,
                isLiked: isNowLiked,
                likesCount: newLikesCount,
                message
            };
        } catch (error) {
            logger.error(LoggerMessages.TOGGLE_POST_LIKE_ERROR, error);
            if (error instanceof CustomError) {
                throw error;
            }
            throw new CustomError(ErrorMessages.FAILED_TOGGLE_POST_LIKE, StatusCode.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Creates a comment on a post.
     * @param {string} adminId - Admin ID.
     * @param {CommunityAdminCommentDto} data - Comment data.
     * @returns {Promise<CommunityAdminCommentResponseDto>} Created comment DTO.
     */
    async createComment(adminId: string, data: CommunityAdminCommentDto): Promise<CommunityAdminCommentResponseDto> {
        try {
            // Verify post exists
            const post = await this._postRepository.findPostById(data.postId);
            if (!post) {
                throw new CustomError(ErrorMessages.POST_NOT_FOUND, StatusCode.NOT_FOUND);
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
            logger.error(LoggerMessages.CREATE_COMMENT_ERROR, error);
            if (error instanceof CustomError) {
                throw error;
            }
            throw new CustomError(ErrorMessages.FAILED_CREATE_COMMENT, StatusCode.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Retrieves comments for a post.
     * @param {string} adminId - Admin ID.
     * @param {string} postId - Post ID.
     * @param {string} [cursor] - Pagination cursor.
     * @param {number} [limit=10] - Number of comments to retrieve.
     * @returns {Promise<{ comments: CommunityAdminCommentResponseDto[]; hasMore: boolean; nextCursor?: string }>} Comments list.
     */
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
            logger.error(LoggerMessages.GET_POST_COMMENTS_ERROR, error);
            if (error instanceof CustomError) {
                throw error;
            }
            throw new CustomError(ErrorMessages.FAILED_GET_POST_COMMENTS, StatusCode.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Toggles the like status of a comment.
     * @param {string} adminId - Admin ID.
     * @param {string} commentId - Comment ID.
     * @returns {Promise<LikeResponseDto>} Like response.
     */
    async toggleCommentLike(adminId: string, commentId: string): Promise<LikeResponseDto> {
        try {
            const comment = await this._postRepository.findCommentById(commentId);
            if (!comment) {
                throw new CustomError(ErrorMessages.COMMENT_NOT_FOUND, StatusCode.NOT_FOUND);
            }

            const isLiked = await this._postRepository.checkIfCommentLiked(adminId, commentId);

            let newLikesCount: number;
            let isNowLiked: boolean;
            let message: string;

            if (isLiked) {
                await this._postRepository.unlikeComment(adminId, commentId);
                newLikesCount = Math.max(0, comment.likesCount - 1);
                isNowLiked = false;
                message = SuccessMessages.COMMENT_UNLIKED_SUCCESS;
            } else {
                await this._postRepository.likeComment(adminId, commentId);
                newLikesCount = comment.likesCount + 1;
                isNowLiked = true;
                message = SuccessMessages.COMMENT_LIKED_SUCCESS;
            }

            return {
                success: true,
                isLiked: isNowLiked,
                likesCount: newLikesCount,
                message
            };
        } catch (error) {
            logger.error(LoggerMessages.TOGGLE_COMMENT_LIKE_ERROR, error);
            if (error instanceof CustomError) {
                throw error;
            }
            throw new CustomError(ErrorMessages.FAILED_TOGGLE_COMMENT_LIKE, StatusCode.INTERNAL_SERVER_ERROR);
        }
    }

    // Enhanced feed functionality
    /**
     * Retrieves the feed of posts from community members.
     * @param {string} adminId - Admin ID.
     * @param {string} [cursor] - Pagination cursor.
     * @param {number} [limit=10] - Number of posts.
     * @returns {Promise<CommunityFeedResponseDto>} Community feed.
     */
    async getCommunityMembersFeed(adminId: string, cursor?: string, limit: number = 10): Promise<CommunityFeedResponseDto> {
        try {
            const admin = await this._adminRepository.findById(adminId);
            if (!admin || !admin.communityId) {
                throw new CustomError(ErrorMessages.COMMUNITY_ADMIN_NOT_FOUND, StatusCode.NOT_FOUND);
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
            logger.error(LoggerMessages.GET_COMMUNITY_MEMBERS_FEED_ERROR, error);
            if (error instanceof CustomError) {
                throw error;
            }
            throw new CustomError(ErrorMessages.FAILED_GET_COMMUNITY_MEMBERS_FEED, StatusCode.INTERNAL_SERVER_ERROR);
        }
    }


    /**
     * Retrieves statistics for the community.
     * @param {string} communityId - Community ID.
     * @returns {Promise<any>} Community stats.
     */
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