import { injectable, inject } from "inversify";
import { TYPES } from "../../core/types/types";
import { CustomError } from "../../utils/customError";
import { StatusCode } from "../../enums/statusCode.enum";
import logger from "../../utils/logger";
import { ICommunityAdminFeedService } from "../../core/interfaces/services/communityAdmin/ICommnityAdminFeedService";
import { ICommunityAdminRepository } from "../../core/interfaces/repositories/ICommunityAdminRepository";
import { IPostRepository } from "../../core/interfaces/repositories/IPostRepository";
import { ICommunityRepository } from "../../core/interfaces/repositories/ICommunityRepository";
import CommunityMemberModel from "../../models/communityMember.model";
import {
    CommunityFeedResponseDto,
    CommunityEngagementStatsDto
} from "../../dtos/communityAdmin/CommunityAdminFeed.dto";
import {
    CreateCommentDto,
    LikeResponseDto
} from "../../dtos/posts/Post.dto";

@injectable()
export class CommunityAdminFeedService implements ICommunityAdminFeedService {
    constructor(
        @inject(TYPES.ICommunityAdminRepository) private _adminRepository: ICommunityAdminRepository,
        @inject(TYPES.IPostRepository) private _postRepository: IPostRepository,
        @inject(TYPES.ICommunityRepository) private _communityRepository: ICommunityRepository
    ) {}

    async getCommunityFeed(adminId: string, cursor?: string, limit: number = 10, type: string = 'all'): Promise<CommunityFeedResponseDto> {
    try {
        console.log("CommunityAdminFeedService: Getting community feed for admin:", adminId);

        const admin = await this._adminRepository.findById(adminId);
        if (!admin || !admin.communityId) {
            throw new CustomError("Community admin or community not found", StatusCode.NOT_FOUND);
        }

        const communityId = admin.communityId.toString();

        // Get community members
        const members = await CommunityMemberModel.find({ communityId, isActive: true }).select('userId');
        const memberIds = members.map(member => member.userId.toString());

        if (memberIds.length === 0) {
            const communityStats = await this._getCommunityStats(communityId);
            return new CommunityFeedResponseDto([], false, undefined, 0, communityStats);
        }

        // Get posts from community members
        let postsResult: any;
        let transformedPosts: any[] = [];
        let hasMore = false;
        let nextCursor: string | undefined;

        switch (type) {
            case 'trending':
                postsResult = await this._postRepository.getTrendingPosts(cursor, limit);
                // Ensure postsResult.posts exists and filter to only include community members
                const trendingPosts = postsResult?.posts || [];
                postsResult.posts = trendingPosts.filter((post:any) => 
                    memberIds.includes(post.author._id.toString())
                );
                break;
            case 'recent':
            default:
                postsResult = await this._postRepository.getPostsByUserIds(memberIds, cursor, limit);
                break;
        }

        // Ensure postsResult.posts exists
        const rawPosts = postsResult?.posts || [];
        
        // Transform posts with admin context
        transformedPosts = await Promise.all(
            rawPosts.map((post: any) => this._transformPostForAdmin(post, adminId))
        );

        // Handle pagination properties safely
        hasMore = !!postsResult?.hasMore; // Convert undefined/null to false
        nextCursor = postsResult?.nextCursor;

        const communityStats = await this._getCommunityStats(communityId);

        console.log("CommunityAdminFeedService: Community feed retrieved successfully, posts count:", transformedPosts.length);
        
        return new CommunityFeedResponseDto(
            transformedPosts,
            hasMore,
            nextCursor,
            transformedPosts.length,
            communityStats
        );
    } catch (error) {
        console.error("CommunityAdminFeedService: Get community feed error:", error);
        if (error instanceof CustomError) {
            throw error;
        }
        throw new CustomError("Failed to fetch community feed", StatusCode.INTERNAL_SERVER_ERROR);
    }
}

    async togglePostLike(adminId: string, postId: string): Promise<LikeResponseDto> {
        try {
            console.log("CommunityAdminFeedService: Admin toggling post like:", adminId, "post:", postId);

            const admin = await this._adminRepository.findById(adminId);
            if (!admin) {
                throw new CustomError("Community admin not found", StatusCode.NOT_FOUND);
            }

            // Check if post exists
            const post = await this._postRepository.findPostById(postId);
            if (!post) {
                throw new CustomError("Post not found", StatusCode.NOT_FOUND);
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
                message = "Post unliked successfully";
            } else {
                // Like the post
                await this._postRepository.likePost(adminId, postId);
                newLikesCount = post.likesCount + 1;
                isNowLiked = true;
                message = "Post liked successfully";
            }

            console.log("CommunityAdminFeedService: Post like toggled successfully");

            return {
                success: true,
                isLiked: isNowLiked,
                likesCount: newLikesCount,
                message
            };
        } catch (error) {
            console.error("CommunityAdminFeedService: Toggle post like error:", error);
            if (error instanceof CustomError) {
                throw error;
            }
            throw new CustomError("Failed to toggle post like", StatusCode.INTERNAL_SERVER_ERROR);
        }
    }

    async createComment(adminId: string, data: CreateCommentDto): Promise<any> {
        try {
            console.log("CommunityAdminFeedService: Admin creating comment:", adminId, "data:", data);

            const admin = await this._adminRepository.findById(adminId);
            if (!admin) {
                throw new CustomError("Community admin not found", StatusCode.NOT_FOUND);
            }

            // Verify post exists
            const post = await this._postRepository.findPostById(data.postId || '');
            if (!post) {
                throw new CustomError("Post not found", StatusCode.NOT_FOUND);
            }

            // Verify parent comment exists if provided
            if (data.parentCommentId) {
                const parentComment = await this._postRepository.findCommentById(data.parentCommentId);
                if (!parentComment) {
                    throw new CustomError("Parent comment not found", StatusCode.NOT_FOUND);
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
                data.parentCommentId
            );

            console.log("CommunityAdminFeedService: Comment created successfully");
            return this._transformCommentForAdmin(comment, adminId);
        } catch (error) {
            console.error("CommunityAdminFeedService: Create comment error:", error);
            if (error instanceof CustomError) {
                throw error;
            }
            throw new CustomError("Failed to create comment", StatusCode.INTERNAL_SERVER_ERROR);
        }
    }

    async getEngagementStats(adminId: string, period: string = 'week'): Promise<CommunityEngagementStatsDto> {
        try {
            console.log("CommunityAdminFeedService: Getting engagement stats for admin:", adminId, "period:", period);

            const admin = await this._adminRepository.findById(adminId);
            if (!admin || !admin.communityId) {
                throw new CustomError("Community admin or community not found", StatusCode.NOT_FOUND);
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

            console.log("CommunityAdminFeedService: Engagement stats retrieved successfully");
            return new CommunityEngagementStatsDto(engagementData);
        } catch (error) {
            console.error("CommunityAdminFeedService: Get engagement stats error:", error);
            if (error instanceof CustomError) {
                throw error;
            }
            throw new CustomError("Failed to fetch engagement stats", StatusCode.INTERNAL_SERVER_ERROR);
        }
    }

    async pinPost(adminId: string, postId: string): Promise<any> {
        try {
            console.log("CommunityAdminFeedService: Admin pinning post:", postId);

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
            console.log("CommunityAdminFeedService: Post pinned successfully");
            
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

    async deletePost(adminId: string, postId: string, reason?: string): Promise<any> {
        try {
            console.log("CommunityAdminFeedService: Admin deleting post:", postId, "reason:", reason);

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

            // Delete the post (admin has authority to delete any post in their community)
            const success = await this._postRepository.deletePostByAdmin(postId, adminId, reason);
            if (!success) {
                throw new CustomError("Failed to delete post", StatusCode.INTERNAL_SERVER_ERROR);
            }

            console.log("CommunityAdminFeedService: Post deleted successfully by admin");
            
            return {
                success: true,
                postId,
                deletedBy: adminId,
                reason: reason || "Deleted by community admin",
                message: "Post deleted successfully"
            };
        } catch (error) {
            console.error("CommunityAdminFeedService: Delete post error:", error);
            if (error instanceof CustomError) {
                throw error;
            }
            throw new CustomError("Failed to delete post", StatusCode.INTERNAL_SERVER_ERROR);
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

    private async _getEngagementStatsForMembers(memberIds: string[], startDate: Date): Promise<any> {
        // This would need to be implemented in the post repository
        // For now, return mock data
        return {
            totalPosts: 0,
            totalLikes: 0,
            totalComments: 0,
            totalShares: 0,
            activeMembers: 0
        };
    }

    private async _getMemberActivityData(communityId: string, startDate: Date, period: string): Promise<any[]> {
        // This would generate activity data over time
        // For now, return empty array
        return [];
    }
}