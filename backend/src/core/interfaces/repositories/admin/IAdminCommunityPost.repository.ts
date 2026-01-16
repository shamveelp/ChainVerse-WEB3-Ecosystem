import { IPost } from "../../../../models/post.models";
import { ICommunityAdminPost } from "../../../../models/communityAdminPost.model";
import { IComment } from "../../../../models/comment.models";
import { ICommunityAdminComment } from "../../../../models/communityAdminComment.model";

export interface IUnifiedLiker {
    _id: any;
    likedAt: Date;
    user: any;
}

export interface IAdminCommunityPostRepository {
    getAllPosts(cursor?: string, limit?: number, type?: 'all' | 'user' | 'admin', search?: string): Promise<{
        posts: (IPost | ICommunityAdminPost)[];
        nextCursor?: string;
        hasMore: boolean;
    }>;
    softDeletePost(postId: string, type: 'user' | 'admin'): Promise<boolean>;
    restorePost(postId: string, type: 'user' | 'admin'): Promise<boolean>;
    getPostDetails(postId: string, type: 'user' | 'admin'): Promise<IPost | ICommunityAdminPost | null>;
    getPostComments(postId: string, type: 'user' | 'admin', cursor?: string, limit?: number): Promise<{
        comments: (IComment | ICommunityAdminComment)[];
        nextCursor?: string;
        hasMore: boolean;
    }>;
    getPostLikers(postId: string, type: 'user' | 'admin', cursor?: string, limit?: number): Promise<{
        likers: IUnifiedLiker[];
        nextCursor?: string;
        hasMore: boolean;
    }>;
}
