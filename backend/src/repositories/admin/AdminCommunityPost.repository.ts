import { injectable } from "inversify";
import { IAdminCommunityPostRepository, IUnifiedLiker } from "../../core/interfaces/repositories/admin/IAdminCommunityPost.repository";
import { PostModel, IPost } from "../../models/post.models";
import { CommunityAdminPostModel, ICommunityAdminPost } from "../../models/communityAdminPost.model";
import { CommentModel, IComment } from "../../models/comment.models";
import { CommunityAdminCommentModel, ICommunityAdminComment } from "../../models/communityAdminComment.model";
import { LikeModel, ILike } from "../../models/like.models";
import { CommunityAdminPostLikeModel, ICommunityAdminPostLike } from "../../models/communityAdminPostLike.model";
import { UserModel } from "../../models/user.models";
import { CommunityAdminModel } from "../../models/communityAdmin.model";
import { FilterQuery } from "mongoose";

@injectable()
export class AdminCommunityPostRepository implements IAdminCommunityPostRepository {
    async getAllPosts(cursor?: string, limit: number = 10, type: 'all' | 'user' | 'admin' = 'all', search?: string): Promise<{
        posts: ((IPost & { postType: 'user' }) | (ICommunityAdminPost & { postType: 'admin' }))[];
        nextCursor?: string;
        hasMore: boolean;
    }> {
        // Base query
        let userPostQuery: FilterQuery<IPost> = {};
        let adminPostQuery: FilterQuery<ICommunityAdminPost> = {};

        // If search is provided, build search conditions
        if (search) {
            const searchRegex = new RegExp(search, 'i');

            // 1. Find potential authors (Users and Admins) to filter by author ID
            const users = await UserModel.find({ username: searchRegex }).select('_id');
            const admins = await CommunityAdminModel.find({ username: searchRegex }).select('_id');
            const userIds = users.map(u => u._id);
            const adminIds = admins.map(a => a._id);

            // 2. Build Query Conditions
            const userSearchConditions = [
                { content: searchRegex },
                { hashtags: searchRegex },
                ...(userIds.length > 0 ? [{ author: { $in: userIds } }] : [])
            ];

            const adminSearchConditions = [
                { content: searchRegex },
                { hashtags: searchRegex },
                ...(adminIds.length > 0 ? [{ author: { $in: adminIds } }] : [])
            ];

            userPostQuery = { $or: userSearchConditions };
            adminPostQuery = { $or: adminSearchConditions };
        }

        // Apply Cursor (Pagination)
        if (cursor) {
            userPostQuery.createdAt = { ...userPostQuery.createdAt, $lt: new Date(cursor) };
            adminPostQuery.createdAt = { ...adminPostQuery.createdAt, $lt: new Date(cursor) };
        }

        const fetchUserPosts = (type === 'all' || type === 'user')
            ? PostModel.find(userPostQuery).sort({ createdAt: -1 }).limit(limit + 1).populate('author', 'username email profileImage').lean()
            : Promise.resolve([]);

        const fetchAdminPosts = (type === 'all' || type === 'admin')
            ? CommunityAdminPostModel.find(adminPostQuery).sort({ createdAt: -1 }).limit(limit + 1).populate('author', 'username email profileImage').lean()
            : Promise.resolve([]);

        // Execute queries
        const [userPosts, adminPosts] = await Promise.all([fetchUserPosts, fetchAdminPosts]);

        // Tag with type
        const typedUserPosts = (userPosts as unknown as IPost[]).map(p => ({ ...p, postType: 'user' as const }));
        const typedAdminPosts = (adminPosts as unknown as ICommunityAdminPost[]).map(p => ({ ...p, postType: 'admin' as const }));

        // Merge and Sort
        const allPosts = [...typedUserPosts, ...typedAdminPosts].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

        // Slice for limit
        const hasMore = allPosts.length > limit;
        const posts = hasMore ? allPosts.slice(0, limit) : allPosts;
        const nextCursor = posts.length > 0 ? posts[posts.length - 1].createdAt.toISOString() : undefined;

        // Force cast to satisfy interface if needed, but the structure matches
        return { posts: posts as ((IPost & { postType: 'user' }) | (ICommunityAdminPost & { postType: 'admin' }))[], nextCursor, hasMore };
    }

    async softDeletePost(postId: string, type: 'user' | 'admin'): Promise<boolean> {
        if (type === 'user') {
            const result = await PostModel.findByIdAndUpdate(postId, { isDeleted: true, deletedAt: new Date() });
            return !!result;
        } else {
            const result = await CommunityAdminPostModel.findByIdAndUpdate(postId, { isDeleted: true, deletedAt: new Date() });
            return !!result;
        }
    }

    async restorePost(postId: string, type: 'user' | 'admin'): Promise<boolean> {
        if (type === 'user') {
            const result = await PostModel.findByIdAndUpdate(postId, { isDeleted: false, deletedAt: null });
            return !!result;
        } else {
            const result = await CommunityAdminPostModel.findByIdAndUpdate(postId, { isDeleted: false, deletedAt: null });
            return !!result;
        }
    }

    async getPostDetails(postId: string, type: 'user' | 'admin'): Promise<IPost | ICommunityAdminPost | null> {
        if (type === 'user') {
            return await PostModel.findById(postId).populate('author', 'username email profileImage').lean();
        } else {
            return await CommunityAdminPostModel.findById(postId).populate('author', 'username email profileImage').lean();
        }
    }

    async getPostComments(postId: string, type: 'user' | 'admin', cursor?: string, limit: number = 10): Promise<{
        comments: (IComment | ICommunityAdminComment)[];
        nextCursor?: string;
        hasMore: boolean;
    }> {
        // We use  for query temporarily to allow adding $lt to createdAt which might not be strictly in FilterQuery if strict
        // But FilterQuery<IComment> usually allows it.
        // To be safe and avoid "Unexpected ", we explicitly construct the filter.

        let query: FilterQuery<IComment> | FilterQuery<ICommunityAdminComment> = { post: postId, isDeleted: false };
        if (cursor) {
            query = { ...query, createdAt: { $lt: new Date(cursor) } };
        }

        let comments: (IComment | ICommunityAdminComment)[] = [];

        if (type === 'user') {
            comments = await CommentModel.find(query)
                .sort({ createdAt: -1 })
                .limit(limit + 1)
                .populate('author', 'username email profileImage')
                .lean();
        } else {
            comments = await CommunityAdminCommentModel.find(query)
                .sort({ createdAt: -1 })
                .limit(limit + 1)
                .populate('author', 'username email profileImage')
                .lean();
        }

        const hasMore = comments.length > limit;
        const validComments = hasMore ? comments.slice(0, limit) : comments;
        const nextCursor = validComments.length > 0 ? validComments[validComments.length - 1].createdAt.toISOString() : undefined;

        // explicit cast to ensure compatibility with usage of 'comments' variable that holds union array
        return { comments: validComments as (IComment | ICommunityAdminComment)[], nextCursor, hasMore };
    }

    async getPostLikers(postId: string, type: 'user' | 'admin', cursor?: string, limit: number = 10): Promise<{
        likers: IUnifiedLiker[];
        nextCursor?: string;
        hasMore: boolean;
    }> {
        const query: FilterQuery<ILike> = { post: postId };
        if (cursor) {
            query.createdAt = { $lt: new Date(cursor) };
        }

        let likers: IUnifiedLiker[] = [];

        if (type === 'user') {
            const likes = await LikeModel.find(query)
                .sort({ createdAt: -1 })
                .limit(limit + 1)
                .populate('user', 'username email profileImage')
                .lean();
            // Map to unified liker structure
            likers = likes.map(l => ({
                _id: l._id,
                likedAt: l.createdAt,
                user: l.user
            }));
        } else {
            // Re-cast query for AdminPostLike if needed, structure is similar
            const adminQuery: FilterQuery<ICommunityAdminPostLike> = { post: postId, ...(cursor ? { createdAt: { $lt: new Date(cursor) } } : {}) };

            const likes = await CommunityAdminPostLikeModel.find(adminQuery)
                .sort({ createdAt: -1 })
                .limit(limit + 1)
                .populate('admin', 'username email profileImage')
                .lean();
            // Map to unified liker structure
            likers = likes.map(l => ({
                _id: l._id,
                likedAt: l.createdAt,
                user: l.admin // Alias admin as user for frontend consistency
            }));
        }

        const hasMore = likers.length > limit;
        const validLikers = hasMore ? likers.slice(0, limit) : likers;
        const nextCursor = validLikers.length > 0 ? validLikers[validLikers.length - 1].likedAt.toISOString() : undefined;

        return { likers: validLikers, nextCursor, hasMore };
    }
}
