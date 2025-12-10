import { injectable, inject } from "inversify";
import { TYPES } from "../../core/types/types";
import { CustomError } from "../../utils/customError";
import { StatusCode } from "../../enums/statusCode.enum";
import logger from "../../utils/logger";
import { ErrorMessages, SuccessMessages, LoggerMessages } from "../../enums/messages.enum";
import { ICommunityAdminFeedService } from "../../core/interfaces/services/communityAdmin/ICommnityAdminFeed.service";
import { ICommunityAdminRepository } from "../../core/interfaces/repositories/ICommunityAdminRepository";
import { IPostRepository } from "../../core/interfaces/repositories/posts/IPost.repository";
import { ICommunityRepository } from "../../core/interfaces/repositories/ICommunity.repository";
import CommunityMemberModel from "../../models/communityMember.model";
import {
    CommunityFeedResponseDto,
    CommunityEngagementStatsDto
} from "../../dtos/communityAdmin/CommunityAdminFeed.dto";
import {
    CreateCommentDto,
    LikeResponseDto,
    ShareResponseDto
} from "../../dtos/posts/Post.dto";

@injectable()
export class CommunityAdminFeedService implements ICommunityAdminFeedService {
    constructor(
        @inject(TYPES.ICommunityAdminRepository) private _adminRepository: ICommunityAdminRepository,
        @inject(TYPES.IPostRepository) private _postRepository: IPostRepository,
        @inject(TYPES.ICommunityRepository) private _communityRepository: ICommunityRepository
    ) { }

    /**
     * Retrieves the community feed based on type.
     * @param {string} adminId - Admin ID.
     * @param {string} [cursor] - Pagination cursor.
     * @param {number} [limit=10] - Number of items.
     * @param {string} [type='all'] - Type of feed.
     * @returns {Promise<CommunityFeedResponseDto>} Feed response.
     */
    async getCommunityFeed(adminId: string, cursor?: string, limit: number = 10, type: string = 'all'): Promise<CommunityFeedResponseDto> {
        try {
            const admin = await this._adminRepository.findById(adminId);
            if (!admin || !admin.communityId) {
                throw new CustomError(ErrorMessages.COMMUNITY_ADMIN_NOT_FOUND, StatusCode.NOT_FOUND);
            }

            const communityId = admin.communityId.toString();

            let postsResult: any;

            switch (type) {
                case 'allPosts':
                    // Get all global posts
                    postsResult = await this._postRepository.getGlobalPosts(cursor, limit);
                    break;
                case 'members':
                    // Get posts only from active community members
                    postsResult = await this._postRepository.getCommunityMembersPosts(communityId, cursor, limit);
                    break;
                case 'trending':
                    // Get global trending posts
                    postsResult = await this._postRepository.getTrendingPosts(cursor, limit);
                    break;
                default:
                    // Default to members if unknown type, or maybe allPosts? 
                    // Let's default to members as it is safer/current behavior for admin view
                    postsResult = await this._postRepository.getCommunityMembersPosts(communityId, cursor, limit);
                    break;
            }

            // Transform posts with admin context
            const transformedPosts = await Promise.all(
                postsResult.posts.map((post: any) => this._transformPostForAdmin(post, adminId))
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
            logger.error(LoggerMessages.GET_COMMUNITY_FEED_ERROR, error);
            if (error instanceof CustomError) {
                throw error;
            }
            throw new CustomError(ErrorMessages.FAILED_GET_COMMUNITY_FEED, StatusCode.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Toggles like status on a post.
     * @param {string} adminId - Admin ID.
     * @param {string} postId - Post ID.
     * @returns {Promise<LikeResponseDto>} Like response.
     */
    async togglePostLike(adminId: string, postId: string): Promise<LikeResponseDto> {
        try {
            const admin = await this._adminRepository.findById(adminId);
            if (!admin) {
                throw new CustomError(ErrorMessages.COMMUNITY_ADMIN_NOT_FOUND, StatusCode.NOT_FOUND);
            }

            // Check if post exists
            const post = await this._postRepository.findPostById(postId);
            if (!post) {
                throw new CustomError(ErrorMessages.POST_NOT_FOUND, StatusCode.NOT_FOUND);
            }

            // Check if already liked
            const isLiked = await this._postRepository.checkIfLiked(adminId, postId);

            let newLikesCount: number;
            let isNowLiked: boolean;
            let message: string;

            if (isLiked) {
                // Unlike the post
                await this._postRepository.unlikePost(adminId, postId);
                newLikesCount = Math.max(0, post.likesCount - 1);
                isNowLiked = false;
                message = SuccessMessages.POST_UNLIKED_SUCCESS;
            } else {
                // Like the post
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
     * @param {CreateCommentDto} data - Comment data.
     * @returns {Promise<any>} Created comment.
     */
    async createComment(adminId: string, data: CreateCommentDto): Promise<any> {
        try {
            const admin = await this._adminRepository.findById(adminId);
            if (!admin) {
                throw new CustomError(ErrorMessages.COMMUNITY_ADMIN_NOT_FOUND, StatusCode.NOT_FOUND);
            }

            // Verify post exists
            const post = await this._postRepository.findPostById(data.postId || '');
            if (!post) {
                throw new CustomError(ErrorMessages.POST_NOT_FOUND, StatusCode.NOT_FOUND);
            }

            // Verify parent comment exists if provided
            if (data.parentCommentId) {
                const parentComment = await this._postRepository.findCommentById(data.parentCommentId);
                if (!parentComment) {
                    throw new CustomError(ErrorMessages.COMMENT_NOT_FOUND, StatusCode.NOT_FOUND);
                }
                if (parentComment.post.toString() !== data.postId) {
                    throw new CustomError("Parent comment belongs to a different post", StatusCode.BAD_REQUEST);
                }
            }

            // Create comment
            const comment = await this._postRepository.createComment(
                adminId,
                data.postId || '',
                data.content || '',
                data.parentCommentId,
                true, // Posted as community
                admin.communityId.toString() // Community ID
            );

            return this._transformCommentForAdmin(comment, adminId);
        } catch (error) {
            logger.error(LoggerMessages.CREATE_COMMENT_ERROR, error);
            if (error instanceof CustomError) {
                throw error;
            }
            throw new CustomError(ErrorMessages.FAILED_CREATE_COMMENT, StatusCode.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Shares a post.
     * @param {string} adminId - Admin ID.
     * @param {string} postId - Post ID.
     * @param {string} [shareText] - Optional share text.
     * @returns {Promise<ShareResponseDto>} Share response.
     */
    async sharePost(adminId: string, postId: string, shareText?: string): Promise<ShareResponseDto> {
        try {
            const admin = await this._adminRepository.findById(adminId);
            if (!admin) {
                throw new CustomError(ErrorMessages.COMMUNITY_ADMIN_NOT_FOUND, StatusCode.NOT_FOUND);
            }

            // Verify post exists
            const post = await this._postRepository.findPostById(postId);
            if (!post) {
                throw new CustomError(ErrorMessages.POST_NOT_FOUND, StatusCode.NOT_FOUND);
            }

            // Update share count
            await this._postRepository.updatePostCounts(postId, 'sharesCount', 1);

            // Generate share URL (customize based on your frontend URL structure)
            const shareUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/user/community/post/${postId}`;

            return {
                success: true,
                shareUrl,
                sharesCount: post.sharesCount + 1,
                message: SuccessMessages.POST_SHARED_SUCCESS
            };
        } catch (error) {
            logger.error(LoggerMessages.SHARE_POST_ERROR, error);
            if (error instanceof CustomError) {
                throw error;
            }
            throw new CustomError(ErrorMessages.FAILED_SHARE_POST, StatusCode.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Retrieves engagement statistics.
     * @param {string} adminId - Admin ID.
     * @param {string} [period='week'] - Period.
     * @returns {Promise<CommunityEngagementStatsDto>} Engagement stats.
     */
    async getEngagementStats(adminId: string, period: string = 'week'): Promise<CommunityEngagementStatsDto> {
        try {
            const admin = await this._adminRepository.findById(adminId);
            if (!admin || !admin.communityId) {
                throw new CustomError(ErrorMessages.COMMUNITY_ADMIN_NOT_FOUND, StatusCode.NOT_FOUND);
            }

            const communityId = admin.communityId.toString();

            // Calculate date range
            const now = new Date();
            let startDate: Date;

            switch (period) {
                case 'today':
                    startDate = new Date(now.setHours(0, 0, 0, 0));
                    break;
                case 'week':
                    startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                    break;
                case 'month':
                    startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
                    break;
                default:
                    startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            }

            // Get community members
            const members = await CommunityMemberModel.find({ communityId, isActive: true }).select('userId');
            const memberIds = members.map(member => member.userId.toString());

            if (memberIds.length === 0) {
                return new CommunityEngagementStatsDto({
                    period,
                    totalPosts: 0,
                    totalLikes: 0,
                    totalComments: 0,
                    totalShares: 0,
                    activeMembers: 0,
                    engagementRate: 0,
                    topHashtags: [],
                    memberActivity: []
                });
            }

            // Get engagement statistics
            const [postStats, topHashtags, memberActivity] = await Promise.all([
                this._getEngagementStatsForMembers(memberIds, startDate),
                this._postRepository.getPopularHashtags(10),
                this._getMemberActivityData(communityId, startDate, period)
            ]);

            const engagementData = {
                period,
                totalPosts: postStats.totalPosts,
                totalLikes: postStats.totalLikes,
                totalComments: postStats.totalComments,
                totalShares: postStats.totalShares,
                activeMembers: postStats.activeMembers,
                engagementRate: memberIds.length > 0 ? (postStats.activeMembers / memberIds.length) * 100 : 0,
                topHashtags,
                memberActivity
            };

            return new CommunityEngagementStatsDto(engagementData);
        } catch (error) {
            logger.error(LoggerMessages.GET_ENGAGEMENT_STATS_ERROR, error);
            if (error instanceof CustomError) {
                throw error;
            }
            throw new CustomError(ErrorMessages.FAILED_GET_ENGAGEMENT_STATS, StatusCode.INTERNAL_SERVER_ERROR);
        }
    }

    async pinPost(adminId: string, postId: string): Promise<any> {
        try {


            const admin = await this._adminRepository.findById(adminId);
            if (!admin || !admin.communityId) {
                throw new CustomError("Community admin or community not found", StatusCode.NOT_FOUND);
            }

            // Check if post exists and belongs to community
            const post = await this._postRepository.findPostById(postId);
            if (!post) {
                throw new CustomError("Post not found", StatusCode.NOT_FOUND);
            }

            // Verify the post author is a community member
            const member = await CommunityMemberModel.findOne({
                communityId: admin.communityId,
                userId: post.author._id,
                isActive: true
            });

            if (!member) {
                throw new CustomError("Post does not belong to your community", StatusCode.FORBIDDEN);
            }

            // TODO: Implement post pinning logic in post repository
            // For now, return success


            return {
                success: true,
                postId,
                isPinned: true,
                message: "Post pinned successfully"
            };
        } catch (error) {
            console.error("CommunityAdminFeedService: Pin post error:", error);
            if (error instanceof CustomError) {
                throw error;
            }
            throw new CustomError("Failed to pin post", StatusCode.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Retrieves a post by its ID.
     * @param {string} adminId - Admin ID.
     * @param {string} postId - Post ID.
     * @returns {Promise<any>} Post object.
     */
    async getPostById(adminId: string, postId: string): Promise<any> {
        try {
            const admin = await this._adminRepository.findById(adminId);
            if (!admin) {
                throw new CustomError(ErrorMessages.COMMUNITY_ADMIN_NOT_FOUND, StatusCode.NOT_FOUND);
            }

            const post = await this._postRepository.findPostById(postId);
            if (!post) {
                throw new CustomError(ErrorMessages.POST_NOT_FOUND, StatusCode.NOT_FOUND);
            }

            return this._transformPostForAdmin(post, adminId);
        } catch (error) {
            logger.error(LoggerMessages.GET_POST_BY_ID_ERROR, error);
            if (error instanceof CustomError) throw error;
            throw new CustomError(ErrorMessages.FAILED_FETCH_POST, StatusCode.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Retrieves comments for a post.
     * @param {string} adminId - Admin ID.
     * @param {string} postId - Post ID.
     * @param {string} [cursor] - Pagination cursor.
     * @param {number} [limit=10] - Number of items.
     * @returns {Promise<any>} Comments data.
     */
    async getPostComments(adminId: string, postId: string, cursor?: string, limit: number = 10): Promise<any> {
        try {
            const admin = await this._adminRepository.findById(adminId);
            if (!admin) {
                throw new CustomError(ErrorMessages.COMMUNITY_ADMIN_NOT_FOUND, StatusCode.NOT_FOUND);
            }

            const result = await this._postRepository.getPostComments(postId, cursor, limit);

            const transformedComments = await Promise.all(
                result.comments.map((comment: any) => this._transformCommentForAdmin(comment, adminId))
            );

            return {
                comments: transformedComments,
                hasMore: result.hasMore,
                nextCursor: result.nextCursor
            };
        } catch (error) {
            logger.error(LoggerMessages.GET_POST_COMMENTS_ERROR, error);
            if (error instanceof CustomError) throw error;
            throw new CustomError(ErrorMessages.FAILED_FETCH_POST_COMMENTS, StatusCode.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Deletes a post.
     * @param {string} adminId - Admin ID.
     * @param {string} postId - Post ID.
     * @param {string} [reason] - Reason for deletion.
     * @returns {Promise<any>} Deletion response.
     */
    async deletePost(adminId: string, postId: string, reason?: string): Promise<any> {
        try {
            const admin = await this._adminRepository.findById(adminId);
            if (!admin || !admin.communityId) {
                throw new CustomError(ErrorMessages.COMMUNITY_ADMIN_NOT_FOUND, StatusCode.NOT_FOUND);
            }

            // Check if post exists and belongs to community
            const post = await this._postRepository.findPostById(postId);
            if (!post) {
                throw new CustomError(ErrorMessages.POST_NOT_FOUND, StatusCode.NOT_FOUND);
            }

            // Verify the post author is a community member
            const member = await CommunityMemberModel.findOne({
                communityId: admin.communityId,
                userId: post.author._id,
                isActive: true
            });

            if (!member) {
                throw new CustomError(ErrorMessages.POST_NOT_FOUND_OR_UNAUTHORIZED, StatusCode.FORBIDDEN);
            }

            // Delete the post (admin has authority to delete any post in their community)
            const success = await this._postRepository.deletePostByAdmin(postId, adminId, reason);
            if (!success) {
                throw new CustomError(ErrorMessages.FAILED_DELETE_POST, StatusCode.INTERNAL_SERVER_ERROR);
            }

            return {
                success: true,
                postId,
                deletedBy: adminId,
                reason: reason || "Deleted by community admin",
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
     * Retrieves internal community stats.
     * @param {string} communityId - Community ID.
     * @returns {Promise<any>} Stats object.
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
            ? await this._postRepository.getPostCountByUsersAfterDate(memberIds, today)
            : 0;

        const engagementRate = totalMembers > 0 ? (activeMembersToday / totalMembers) * 100 : 0;

        return {
            totalMembers,
            activeMembersToday,
            postsToday,
            engagementRate
        };
    }

    /**
     * Transforms post for admin view.
     * @param {any} post - Post object.
     * @param {string} adminId - Admin ID.
     * @returns {Promise<any>} Transformed post.
     */
    private async _transformPostForAdmin(post: any, adminId: string): Promise<any> {
        // Check if admin liked the post
        const isLiked = await this._postRepository.checkIfLiked(adminId, post._id.toString());

        return {
            ...post,
            isLiked,
            isOwnPost: false, // Admin is not the post owner
            canModerate: true, // Admin can moderate all posts in their community
            author: {
                ...post.author,
                isCommunityMember: true
            }
        };
    }

    /**
     * Transforms comment for admin view.
     * @param {any} comment - Comment object.
     * @param {string} adminId - Admin ID.
     * @returns {Promise<any>} Transformed comment.
     */
    private async _transformCommentForAdmin(comment: any, adminId: string): Promise<any> {
        // Check if admin liked the comment
        const isLiked = await this._postRepository.checkIfCommentLiked(adminId, comment._id.toString());

        return {
            ...comment,
            isLiked,
            isOwnComment: false, // Admin is not the comment owner
            canModerate: true // Admin can moderate all comments in their community
        };
    }

    /**
     * Calculates engagement stats for member list.
     * @param {string[]} memberIds - Member IDs.
     * @param {Date} startDate - Start date.
     * @returns {Promise<any>} Engagement stats.
     */
    private async _getEngagementStatsForMembers(memberIds: string[], startDate: Date): Promise<any> {
        const postStats = await this._postRepository.getPostStats();
        const postsAfterDate = await this._postRepository.getPostCountByUsersAfterDate(memberIds, startDate);

        // Get active members (members who posted after start date)
        // This is a simplified calculation - you might want to implement a more sophisticated method
        const activeMembers = Math.min(memberIds.length, Math.max(1, postsAfterDate));

        return {
            totalPosts: postsAfterDate,
            totalLikes: postStats.totalLikes || 0,
            totalComments: postStats.totalComments || 0,
            totalShares: postStats.totalShares || 0,
            activeMembers
        };
    }

    /**
     * Retrieves member activity data.
     * @param {string} communityId - Community ID.
     * @param {Date} startDate - Start date.
     * @param {string} period - Period string.
     * @returns {Promise<any[]>} Activity data array.
     */
    private async _getMemberActivityData(communityId: string, startDate: Date, period: string): Promise<any[]> {
        // This would generate activity data over time
        // For now, return empty array - implement based on your requirements
        return [];
    }
}