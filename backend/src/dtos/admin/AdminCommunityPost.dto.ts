import { IPost } from "../../models/post.models";
import { ICommunityAdminPost } from "../../models/communityAdminPost.model";
import { IComment } from "../../models/comment.models";
import { ICommunityAdminComment } from "../../models/communityAdminComment.model";
import { IUser } from "../../models/user.models";
import { ICommunityAdmin } from "../../models/communityAdmin.model";

// Define combined types for flexibility
export type CombinedPost = (IPost & { postType: 'user' }) | (ICommunityAdminPost & { postType: 'admin' });
// Comment author can be User or CommunityAdmin
export type CombinedComment = IComment | ICommunityAdminComment;
// User or Admin for Likers and Authors
export type CombinedUser = IUser | ICommunityAdmin;

type AuthorUnion = {
    _id: { toString(): string };
    username?: string;
    name?: string;
    email?: string;
    profileImage?: string;
    profilePic?: string;
};

export class AdminCommunityPostListResponseDto {
    constructor(
        public posts: Partial<AdminPostItemDto>[],
        public hasMore: boolean,
        public nextCursor?: string
    ) { }
}

export class AdminPostItemDto {
    public _id: string;
    public content: string;
    public author: {
        _id: string;
        username: string;
        email: string;
        profileImage?: string;
    };
    public mediaUrls: string[];
    public mediaType: string;
    public likesCount: number;
    public commentsCount: number;
    public createdAt: Date;
    public isDeleted: boolean;
    public postType: 'user' | 'admin';

    constructor(data: CombinedPost) {
        this._id = data._id?.toString();
        this.content = data.content;

        // Author handling
        const author = (data as unknown as { author: AuthorUnion }).author; // populated
        this.author = {
            _id: author?._id?.toString(),
            username: author?.username || author?.name || 'unknown', // CommunityAdmin has name, User has username
            email: author?.email || '',
            profileImage: author?.profileImage || author?.profilePic // User has profilePic(maybe), Admin has profilePic
        };

        this.mediaUrls = data.mediaUrls || [];
        this.mediaType = data.mediaType;
        this.likesCount = data.likesCount || 0;
        this.commentsCount = data.commentsCount || 0;
        this.createdAt = data.createdAt;
        this.isDeleted = !!data.isDeleted;
        this.postType = data.postType;
    }
}

export class AdminPostCommentDto {
    public _id: string;
    public content: string;
    public author: {
        _id: string;
        username: string;
        profileImage?: string;
    };
    public createdAt: Date;

    constructor(data: CombinedComment) {
        this._id = data._id?.toString();
        this.content = data.content;

        // Handle author/userId ambiguity
        // If populated, author field holds the user/admin document
        const author = (data as unknown as { author: AuthorUnion }).author || (data as unknown as { userId: AuthorUnion }).userId;

        this.author = {
            _id: author?._id?.toString(),
            username: author?.username || author?.name || 'unknown',
            profileImage: author?.profilePic || author?.profileImage
        };
        this.createdAt = data.createdAt;
    }
}

export class AdminPostLikerDto {
    public _id: string;
    public username: string;
    public profileImage?: string;

    constructor(data: CombinedUser) {
        this._id = data._id?.toString();
        // User has username, Admin has name. Fallback.
        const typedData = data as unknown as AuthorUnion;
        this.username = typedData.username || typedData.name || 'unknown';
        this.profileImage = typedData.profilePic || typedData.profileImage;
    }
}
