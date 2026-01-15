import { injectable, inject } from "inversify";
import { TYPES } from "../../core/types/types";
import { IAdminCommunityPostService } from "../../core/interfaces/services/admin/IAdminCommunityPost.service";
import { IAdminCommunityPostRepository } from "../../core/interfaces/repositories/admin/IAdminCommunityPost.repository";
import {
    AdminCommunityPostListResponseDto,
    AdminPostItemDto,
    AdminPostCommentDto,
    AdminPostLikerDto
} from "../../dtos/admin/AdminCommunityPost.dto";

@injectable()
export class AdminCommunityPostService implements IAdminCommunityPostService {
    constructor(
        @inject(TYPES.IAdminCommunityPostRepository) private _repository: IAdminCommunityPostRepository
    ) { }

    /**
     * Retrieves all posts with pagination and filters.
     * @param {string} [cursor] - Pagination cursor.
     * @param {number} [limit=10] - Number of items per page.
     * @param {'all' | 'user' | 'admin'} [type='all'] - Type of posts to fetch.
     * @param {string} [search] - Search text.
     * @returns {Promise<AdminCommunityPostListResponseDto>} List of posts.
     */
    async getAllPosts(cursor?: string, limit: number = 10, type: 'all' | 'user' | 'admin' = 'all', search?: string): Promise<AdminCommunityPostListResponseDto> {
        const result = await this._repository.getAllPosts(cursor, limit, type, search);

        const dtos = result.posts.map(post => new AdminPostItemDto(post));

        return new AdminCommunityPostListResponseDto(dtos, result.hasMore, result.nextCursor);
    }

    /**
     * Soft deletes a post.
     * @param {string} postId - Post ID.
     * @param {'user' | 'admin'} type - Type of post.
     * @returns {Promise<boolean>} True if successful.
     */
    async softDeletePost(postId: string, type: 'user' | 'admin'): Promise<boolean> {
        return await this._repository.softDeletePost(postId, type);
    }

    /**
     * Restores a soft-deleted post.
     * @param {string} postId - Post ID.
     * @param {'user' | 'admin'} type - Type of post.
     * @returns {Promise<boolean>} True if successful.
     */
    async restorePost(postId: string, type: 'user' | 'admin'): Promise<boolean> {
        return await this._repository.restorePost(postId, type);
    }

    /**
     * 
     * @param postId 
     * @param type 
     * @returns 
     */
    async getPostDetails(postId: string, type: 'user' | 'admin'): Promise<AdminPostItemDto> {
        const post = await this._repository.getPostDetails(postId, type);
        return new AdminPostItemDto(post);
    }

    /**
     * 
     * @param postId 
     * @param type 
     * @param cursor 
     * @param limit 
     * @returns 
     */
    async getPostComments(postId: string, type: 'user' | 'admin', cursor?: string, limit: number = 10): Promise<{
        comments: AdminPostCommentDto[];
        nextCursor?: string;
        hasMore: boolean;
    }> {
        const result = await this._repository.getPostComments(postId, type, cursor, limit);
        return {
            comments: result.comments.map(comment => new AdminPostCommentDto(comment)),
            hasMore: result.hasMore,
            nextCursor: result.nextCursor
        };
    }

    /**
     * 
     * @param postId 
     * @param type 
     * @param cursor 
     * @param limit 
     * @returns 
     */
    async getPostLikers(postId: string, type: 'user' | 'admin', cursor?: string, limit: number = 10): Promise<{
        likers: AdminPostLikerDto[];
        nextCursor?: string;
        hasMore: boolean;
    }> {
        const result = await this._repository.getPostLikers(postId, type, cursor, limit);
        return {
            likers: result.likers.map(liker => new AdminPostLikerDto(liker)),
            hasMore: result.hasMore,
            nextCursor: result.nextCursor
        };
    }
}
