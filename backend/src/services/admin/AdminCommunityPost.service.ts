
import { injectable, inject } from "inversify";
import { TYPES } from "../../core/types/types";
import { IAdminCommunityPostService } from "../../core/interfaces/services/admin/IAdminCommunityPost.service";
import { IAdminCommunityPostRepository } from "../../core/interfaces/repositories/admin/IAdminCommunityPost.repository";
import { AdminCommunityPostListResponseDto, AdminPostItemDto } from "../../dtos/admin/AdminCommunityPost.dto";

@injectable()
export class AdminCommunityPostService implements IAdminCommunityPostService {
    constructor(
        @inject(TYPES.IAdminCommunityPostRepository) private _repository: IAdminCommunityPostRepository
    ) { }

    async getAllPosts(cursor?: string, limit: number = 10, type: 'all' | 'user' | 'admin' = 'all'): Promise<AdminCommunityPostListResponseDto> {
        const result = await this._repository.getAllPosts(cursor, limit, type);

        const dtos = result.posts.map(post => new AdminPostItemDto(post));

        return new AdminCommunityPostListResponseDto(dtos, result.hasMore, result.nextCursor);
    }

    async softDeletePost(postId: string, type: 'user' | 'admin'): Promise<boolean> {
        return await this._repository.softDeletePost(postId, type);
    }

    async getPostDetails(postId: string, type: 'user' | 'admin'): Promise<any> {
        return await this._repository.getPostDetails(postId, type);
    }
}
