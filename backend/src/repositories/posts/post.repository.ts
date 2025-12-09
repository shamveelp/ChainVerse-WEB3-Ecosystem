import { injectable } from "inversify";
import { IPostRepository } from "../../core/interfaces/repositories/posts/IPost.repository";
import { PostModel, IPost } from "../../models/post.models";
import { LikeModel } from "../../models/like.models";
import { CommentModel, IComment } from "../../models/comment.models";
import { CommentLikeModel } from "../../models/commentLikes.model";
import CommunityMemberModel from "../../models/communityMember.model";
import { Types } from "mongoose";

@injectable()
export class PostRepository implements IPostRepository {
    async createPost(userId: string, content: string, mediaUrls: string[], mediaType: 'none' | 'image' | 'video'): Promise<IPost> {
        const hashtags = this.extractHashtags(content);
        const mentions = this.extractMentions(content);

        const post = new PostModel({
            author: userId,
            content,
            mediaUrls,
            mediaType,
            hashtags,
            mentions
        });

        return await post.save();
    }

    async findPostById(postId: string): Promise<IPost | null> {
        return await PostModel.findOne({ _id: postId, isDeleted: false })
            .populate('author', 'username name profilePic email')
            .lean();
    }

    async updatePost(postId: string, updateData: any): Promise<IPost | null> {
        const post = await PostModel.findOneAndUpdate(
            { _id: postId, isDeleted: false },
            { 
                ...updateData, 
                editedAt: new Date(),
                hashtags: updateData.content ? this.extractHashtags(updateData.content) : undefined,
                mentions: updateData.content ? this.extractMentions(updateData.content) : undefined
            },
            { new: true }
        ).populate('author', 'username name profilePic email');

        return post;
    }

    async deletePost(postId: string, userId: string): Promise<boolean> {
        const result = await PostModel.updateOne(
            { _id: postId, author: userId, isDeleted: false },
            { isDeleted: true, deletedAt: new Date() }
        );
        return result.modifiedCount > 0;
    }

    async deletePostByAdmin(postId: string, adminId: string, reason?: string): Promise<boolean> {
        const result = await PostModel.updateOne(
            { _id: postId, isDeleted: false },
            { 
                isDeleted: true, 
                deletedAt: new Date(),
                deletedBy: adminId,
                deletionReason: reason
            }
        );
        return result.modifiedCount > 0;
    }

    async getFeedPosts(userId: string, cursor?: string, limit: number = 10): Promise<any> {
        const query: any = { isDeleted: false };

        if (cursor) {
            query._id = { $lt: new Types.ObjectId(cursor) };
        }

        const posts = await PostModel.find(query)
            .sort({ createdAt: -1 })
            .limit(limit + 1)
            .populate('author', 'username name profilePic email')
            .lean();

        const hasMore = posts.length > limit;
        const postsToReturn = hasMore ? posts.slice(0, limit) : posts;
        const nextCursor = hasMore ? postsToReturn[postsToReturn.length - 1]._id.toString() : undefined;

        return {
            posts: postsToReturn,
            hasMore,
            nextCursor
        };
    }

    async getCommunityFeedPosts(communityId: string, cursor?: string, limit: number = 10): Promise<any> {
        // Get all community members
        const members = await CommunityMemberModel.find({ 
            communityId, 
            isActive: true 
        }).select('userId');

        const memberIds = members.map(member => member.userId);

        if (memberIds.length === 0) {
            return {
                posts: [],
                hasMore: false,
                nextCursor: undefined
            };
        }

        const query: any = { 
            isDeleted: false,
            author: { $in: memberIds }
        };

        if (cursor) {
            query._id = { $lt: new Types.ObjectId(cursor) };
        }

        const posts = await PostModel.find(query)
            .sort({ createdAt: -1 })
            .limit(limit + 1)
            .populate('author', 'username name profilePic email')
            .lean();

        const hasMore = posts.length > limit;
        const postsToReturn = hasMore ? posts.slice(0, limit) : posts;
        const nextCursor = hasMore ? postsToReturn[postsToReturn.length - 1]._id.toString() : undefined;

        return {
            posts: postsToReturn,
            hasMore,
            nextCursor
        };
    }

    async getCommunityMembersPosts(communityId: string, cursor?: string, limit: number = 10): Promise<any> {
        // Get only active community members (not including banned/inactive)
        const activeMembers = await CommunityMemberModel.find({ 
            communityId, 
            isActive: true,
            bannedUntil: { $exists: false }
        }).select('userId');

        const memberIds = activeMembers.map(member => member.userId);

        if (memberIds.length === 0) {
            return {
                posts: [],
                hasMore: false,
                nextCursor: undefined
            };
        }

        const query: any = { 
            isDeleted: false,
            author: { $in: memberIds }
        };

        if (cursor) {
            query._id = { $lt: new Types.ObjectId(cursor) };
        }

        const posts = await PostModel.find(query)
            .sort({ createdAt: -1 })
            .limit(limit + 1)
            .populate('author', 'username name profilePic email')
            .lean();

        const hasMore = posts.length > limit;
        const postsToReturn = hasMore ? posts.slice(0, limit) : posts;
        const nextCursor = hasMore ? postsToReturn[postsToReturn.length - 1]._id.toString() : undefined;

        return {
            posts: postsToReturn,
            hasMore,
            nextCursor
        };
    }

    async getUserPosts(targetUserId: string, viewerUserId?: string, cursor?: string, limit: number = 10): Promise<any> {
        const query: any = { 
            author: targetUserId,
            isDeleted: false 
        };

        if (cursor) {
            query._id = { $lt: new Types.ObjectId(cursor) };
        }

        const posts = await PostModel.find(query)
            .sort({ createdAt: -1 })
            .limit(limit + 1)
            .populate('author', 'username name profilePic email')
            .lean();

        const hasMore = posts.length > limit;
        const postsToReturn = hasMore ? posts.slice(0, limit) : posts;
        const nextCursor = hasMore ? postsToReturn[postsToReturn.length - 1]._id.toString() : undefined;

        return {
            posts: postsToReturn,
            hasMore,
            nextCursor
        };
    }

    async getLikedPosts(targetUserId: string, viewerUserId?: string, cursor?: string, limit: number = 10): Promise<any> {
        const likes = await LikeModel.find({ user: targetUserId })
            .sort({ createdAt: -1 })
            .populate({
                path: 'post',
                populate: {
                    path: 'author',
                    select: 'username name profilePic email'
                }
            })
            .lean();

        const posts = likes.map(like => (like as any).post).filter(post => post && !post.isDeleted);

        let postsToReturn = posts;
        let hasMore = false;
        let nextCursor: string | undefined;

        if (cursor) {
            const cursorIndex = posts.findIndex(post => post._id.toString() === cursor);
            if (cursorIndex !== -1) {
                postsToReturn = posts.slice(cursorIndex + 1);
            }
        }

        if (postsToReturn.length > limit) {
            hasMore = true;
            postsToReturn = postsToReturn.slice(0, limit);
            nextCursor = postsToReturn[postsToReturn.length - 1]._id.toString();
        }

        return {
            posts: postsToReturn,
            hasMore,
            nextCursor
        };
    }

    async getTrendingPosts(cursor?: string, limit: number = 10): Promise<any> {
        const query: any = { isDeleted: false };

        if (cursor) {
            query._id = { $lt: new Types.ObjectId(cursor) };
        }

        const posts = await PostModel.find(query)
            .sort({ likesCount: -1, commentsCount: -1, createdAt: -1 })
            .limit(limit + 1)
            .populate('author', 'username name profilePic email')
            .lean();

        const hasMore = posts.length > limit;
        const postsToReturn = hasMore ? posts.slice(0, limit) : posts;
        const nextCursor = hasMore ? postsToReturn[postsToReturn.length - 1]._id.toString() : undefined;

        return {
            posts: postsToReturn,
            hasMore,
            nextCursor
        };
    }

    async getPostsByHashtag(hashtag: string, cursor?: string, limit: number = 10): Promise<any> {
        const query: any = { 
            isDeleted: false,
            hashtags: hashtag.toLowerCase()
        };

        if (cursor) {
            query._id = { $lt: new Types.ObjectId(cursor) };
        }

        const posts = await PostModel.find(query)
            .sort({ createdAt: -1 })
            .limit(limit + 1)
            .populate('author', 'username name profilePic email')
            .lean();

        const hasMore = posts.length > limit;
        const postsToReturn = hasMore ? posts.slice(0, limit) : posts;
        const nextCursor = hasMore ? postsToReturn[postsToReturn.length - 1]._id.toString() : undefined;

        return {
            posts: postsToReturn,
            hasMore,
            nextCursor
        };
    }

    async searchPosts(query: string, cursor?: string, limit: number = 10): Promise<any> {
        const searchQuery: any = {
            isDeleted: false,
            $or: [
                { content: { $regex: query, $options: 'i' } },
                { hashtags: { $regex: query, $options: 'i' } },
                { mentions: { $regex: query, $options: 'i' } }
            ]
        };

        if (cursor) {
            searchQuery._id = { $lt: new Types.ObjectId(cursor) };
        }

        const posts = await PostModel.find(searchQuery)
            .sort({ createdAt: -1 })
            .limit(limit + 1)
            .populate('author', 'username name profilePic email')
            .lean();

        const hasMore = posts.length > limit;
        const postsToReturn = hasMore ? posts.slice(0, limit) : posts;
        const nextCursor = hasMore ? postsToReturn[postsToReturn.length - 1]._id.toString() : undefined;

        return {
            posts: postsToReturn,
            hasMore,
            nextCursor
        };
    }

    async getPostsByUserIds(userIds: string[], cursor?: string, limit: number = 10): Promise<any> {
        const query: any = { 
            isDeleted: false,
            author: { $in: userIds.map(id => new Types.ObjectId(id)) }
        };

        if (cursor) {
            query._id = { $lt: new Types.ObjectId(cursor) };
        }

        const posts = await PostModel.find(query)
            .sort({ createdAt: -1 })
            .limit(limit + 1)
            .populate('author', 'username name profilePic email')
            .lean();

        const hasMore = posts.length > limit;
        const postsToReturn = hasMore ? posts.slice(0, limit) : posts;
        const nextCursor = hasMore ? postsToReturn[postsToReturn.length - 1]._id.toString() : undefined;

        return {
            posts: postsToReturn,
            hasMore,
            nextCursor
        };
    }

    // Like operations
    async likePost(userId: string, postId: string): Promise<void> {
        const session = await PostModel.startSession();
        session.startTransaction();

        try {
            await LikeModel.create([{ user: userId, post: postId }], { session });
            await PostModel.updateOne(
                { _id: postId },
                { $inc: { likesCount: 1 } },
                { session }
            );

            await session.commitTransaction();
        } catch (error) {
            await session.abortTransaction();
            throw error;
        } finally {
            session.endSession();
        }
    }

    async unlikePost(userId: string, postId: string): Promise<void> {
        const session = await PostModel.startSession();
        session.startTransaction();

        try {
            await LikeModel.deleteOne({ user: userId, post: postId }, { session });
            await PostModel.updateOne(
                { _id: postId },
                { $inc: { likesCount: -1 } },
                { session }
            );

            await session.commitTransaction();
        } catch (error) {
            await session.abortTransaction();
            throw error;
        } finally {
            session.endSession();
        }
    }

    async checkIfLiked(userId: string, postId: string): Promise<boolean> {
        const like = await LikeModel.findOne({ user: userId, post: postId });
        return !!like;
    }

    async getPostLikes(postId: string, cursor?: string, limit: number = 20): Promise<any> {
        const query: any = { post: postId };

        if (cursor) {
            query._id = { $lt: new Types.ObjectId(cursor) };
        }

        const likes = await LikeModel.find(query)
            .sort({ createdAt: -1 })
            .limit(limit + 1)
            .populate('user', 'username name profilePic')
            .lean();

        const hasMore = likes.length > limit;
        const likesToReturn = hasMore ? likes.slice(0, limit) : likes;
        const nextCursor = hasMore ? likesToReturn[likesToReturn.length - 1]._id.toString() : undefined;

        return {
            likes: likesToReturn,
            hasMore,
            nextCursor
        };
    }

    // Comment operations
    async createComment(userId: string, postId: string, content: string, parentCommentId?: string): Promise<IComment> {
        const session = await PostModel.startSession();
        session.startTransaction();

        try {
            const comment = await CommentModel.create([{
                post: postId,
                author: userId,
                content,
                parentComment: parentCommentId || null
            }], { session });

            await PostModel.updateOne(
                { _id: postId },
                { $inc: { commentsCount: 1 } },
                { session }
            );

            if (parentCommentId) {
                await CommentModel.updateOne(
                    { _id: parentCommentId },
                    { $inc: { repliesCount: 1 } },
                    { session }
                );
            }

            await session.commitTransaction();

            return await CommentModel.findById(comment[0]._id)
                .populate('author', 'username name profilePic email')
                .lean() as IComment;
        } catch (error) {
            await session.abortTransaction();
            throw error;
        } finally {
            session.endSession();
        }
    }

    async findCommentById(commentId: string): Promise<IComment | null> {
        return await CommentModel.findOne({ _id: commentId, isDeleted: false })
            .populate('author', 'username name profilePic email')
            .lean();
    }

    async updateComment(commentId: string, content: string): Promise<IComment | null> {
        return await CommentModel.findOneAndUpdate(
            { _id: commentId, isDeleted: false },
            { content, editedAt: new Date() },
            { new: true }
        ).populate('author', 'username name profilePic email');
    }

    async deleteComment(commentId: string, userId: string): Promise<boolean> {
        const result = await CommentModel.updateOne(
            { _id: commentId, author: userId, isDeleted: false },
            { isDeleted: true, deletedAt: new Date() }
        );
        return result.modifiedCount > 0;
    }

    async getPostComments(postId: string, cursor?: string, limit: number = 10): Promise<any> {
        const query: any = { 
            post: postId, 
            isDeleted: false,
            parentComment: null // Only top-level comments
        };

        if (cursor) {
            query._id = { $lt: new Types.ObjectId(cursor) };
        }

        const comments = await CommentModel.find(query)
            .sort({ createdAt: -1 })
            .limit(limit + 1)
            .populate('author', 'username name profilePic email')
            .lean();

        const hasMore = comments.length > limit;
        const commentsToReturn = hasMore ? comments.slice(0, limit) : comments;
        const nextCursor = hasMore ? commentsToReturn[commentsToReturn.length - 1]._id.toString() : undefined;

        return {
            comments: commentsToReturn,
            hasMore,
            nextCursor
        };
    }

    async getCommentReplies(commentId: string, cursor?: string, limit: number = 10): Promise<any> {
        const query: any = { 
            parentComment: commentId, 
            isDeleted: false
        };

        if (cursor) {
            query._id = { $lt: new Types.ObjectId(cursor) };
        }

        const comments = await CommentModel.find(query)
            .sort({ createdAt: 1 }) // Ascending for replies
            .limit(limit + 1)
            .populate('author', 'username name profilePic email')
            .lean();

        const hasMore = comments.length > limit;
        const commentsToReturn = hasMore ? comments.slice(0, limit) : comments;
        const nextCursor = hasMore ? commentsToReturn[commentsToReturn.length - 1]._id.toString() : undefined;

        return {
            comments: commentsToReturn,
            hasMore,
            nextCursor
        };
    }

    // Comment like operations
    async likeComment(userId: string, commentId: string): Promise<void> {
        const session = await CommentModel.startSession();
        session.startTransaction();

        try {
            await CommentLikeModel.create([{ user: userId, comment: commentId }], { session });
            await CommentModel.updateOne(
                { _id: commentId },
                { $inc: { likesCount: 1 } },
                { session }
            );

            await session.commitTransaction();
        } catch (error) {
            await session.abortTransaction();
            throw error;
        } finally {
            session.endSession();
        }
    }

    async unlikeComment(userId: string, commentId: string): Promise<void> {
        const session = await CommentModel.startSession();
        session.startTransaction();

        try {
            await CommentLikeModel.deleteOne({ user: userId, comment: commentId }, { session });
            await CommentModel.updateOne(
                { _id: commentId },
                { $inc: { likesCount: -1 } },
                { session }
            );

            await session.commitTransaction();
        } catch (error) {
            await session.abortTransaction();
            throw error;
        } finally {
            session.endSession();
        }
    }

    async checkIfCommentLiked(userId: string, commentId: string): Promise<boolean> {
        const like = await CommentLikeModel.findOne({ user: userId, comment: commentId });
        return !!like;
    }

    async updatePostCounts(postId: string, field: 'likesCount' | 'commentsCount' | 'sharesCount', increment: number): Promise<void> {
        await PostModel.updateOne(
            { _id: postId },
            { $inc: { [field]: increment } }
        );
    }

    // Analytics
    async getPostStats(userId?: string): Promise<any> {
        const baseQuery = { isDeleted: false };
        if (userId) {
            (baseQuery as any).author = userId;
        }

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const week = new Date();
        week.setDate(week.getDate() - 7);

        const [totalPosts, todayPosts, weekPosts, totalLikes, totalComments, totalShares] = await Promise.all([
            PostModel.countDocuments(baseQuery),
            PostModel.countDocuments({ ...baseQuery, createdAt: { $gte: today } }),
            PostModel.countDocuments({ ...baseQuery, createdAt: { $gte: week } }),
            PostModel.aggregate([
                { $match: baseQuery },
                { $group: { _id: null, total: { $sum: '$likesCount' } } }
            ]),
            PostModel.aggregate([
                { $match: baseQuery },
                { $group: { _id: null, total: { $sum: '$commentsCount' } } }
            ]),
            PostModel.aggregate([
                { $match: baseQuery },
                { $group: { _id: null, total: { $sum: '$sharesCount' } } }
            ])
        ]);

        return {
            totalPosts,
            totalLikes: totalLikes[0]?.total || 0,
            totalComments: totalComments[0]?.total || 0,
            totalShares: totalShares[0]?.total || 0,
            todayPosts,
            weekPosts
        };
    }

    async getPostCountByUsers(userIds: string[]): Promise<number> {
        return await PostModel.countDocuments({
            author: { $in: userIds.map(id => new Types.ObjectId(id)) },
            isDeleted: false
        });
    }

    async getPostCountByUsersAfterDate(userIds: string[], date: Date): Promise<number> {
        return await PostModel.countDocuments({
            author: { $in: userIds.map(id => new Types.ObjectId(id)) },
            isDeleted: false,
            createdAt: { $gte: date }
        });
    }

    async getPopularHashtags(limit: number = 10): Promise<string[]> {
        const result = await PostModel.aggregate([
            { $match: { isDeleted: false } },
            { $unwind: '$hashtags' },
            { $group: { _id: '$hashtags', count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: limit }
        ]);

        return result.map(item => item._id);
    }

    // Helper methods
    private extractHashtags(content: string): string[] {
        const hashtagRegex = /#(\w+)/g;
        const hashtags: string[] = [];
        let match;

        while ((match = hashtagRegex.exec(content)) !== null) {
            hashtags.push(match[1].toLowerCase());
        }

        return [...new Set(hashtags)]; // Remove duplicates
    }

    private extractMentions(content: string): string[] {
        const mentionRegex = /@(\w+)/g;
        const mentions: string[] = [];
        let match;

        while ((match = mentionRegex.exec(content)) !== null) {
            mentions.push(match[1].toLowerCase());
        }

        return [...new Set(mentions)]; // Remove duplicates
    }
}