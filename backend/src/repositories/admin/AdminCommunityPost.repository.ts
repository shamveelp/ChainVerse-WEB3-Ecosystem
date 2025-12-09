
import { injectable } from "inversify";
import { IAdminCommunityPostRepository } from "../../core/interfaces/repositories/admin/IAdminCommunityPost.repository";
import { PostModel } from "../../models/post.models";
import { CommunityAdminPostModel } from "../../models/communityAdminPost.model";
import { FilterQuery } from "mongoose";

@injectable()
export class AdminCommunityPostRepository implements IAdminCommunityPostRepository {
    async getAllPosts(cursor?: string, limit: number = 10, type: 'all' | 'user' | 'admin' = 'all'): Promise<{
        posts: any[];
        nextCursor?: string;
        hasMore: boolean;
    }> {
        const query: FilterQuery<any> = {};

        if (cursor) {
            query.createdAt = { $lt: new Date(cursor) };
        }

        // Fetching strategy:
        // If type is specific, just fetch that.
        // If type is 'all', fetch (limit) from both, merge, sort, take (limit).

        // Note: usage of 'any' for post objects as they differ slightly but have common fields (createdAt, etc)

        let posts: any[] = [];

        if (type === 'user') {
            posts = await PostModel.find(query)
                .sort({ createdAt: -1 })
                .limit(limit + 1)
                .populate('author', 'username email profileImage')
                .lean();
            posts.forEach(p => p.postType = 'user');
        } else if (type === 'admin') {
            posts = await CommunityAdminPostModel.find(query)
                .sort({ createdAt: -1 })
                .limit(limit + 1)
                .populate('author', 'username email profileImage') // Assuming CommunityAdmin has these
                .lean();
            posts.forEach(p => p.postType = 'admin');
        } else {
            // type === 'all'
            const [userPosts, adminPosts] = await Promise.all([
                PostModel.find(query).sort({ createdAt: -1 }).limit(limit).populate('author', 'username email profileImage').lean(),
                CommunityAdminPostModel.find(query).sort({ createdAt: -1 }).limit(limit).populate('author', 'username email profileImage').lean()
            ]);

            // Add type tag
            userPosts.forEach((p: any) => p.postType = 'user');
            adminPosts.forEach((p: any) => p.postType = 'admin');

            // Merge and sort
            posts = [...userPosts, ...adminPosts].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

            // Limit again after merge check? 
            // Better approach for merged pagination: fetch limit from BOTH, merge, take limit.
            // If we took limit from both, we have enough candidate comments for the page.
            // But next cursor derivation is key.
        }

        const hasMore = posts.length > limit;
        const validPosts = hasMore ? posts.slice(0, limit) : posts;
        const nextCursor = validPosts.length > 0 ? validPosts[validPosts.length - 1].createdAt.toISOString() : undefined;

        return {
            posts: validPosts,
            nextCursor,
            hasMore
        };
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

    async getPostDetails(postId: string, type: 'user' | 'admin'): Promise<any> {
        if (type === 'user') {
            return await PostModel.findById(postId).populate('author', 'username email profileImage').lean();
        } else {
            return await CommunityAdminPostModel.findById(postId).populate('author', 'username email profileImage').lean();
        }
    }
}
