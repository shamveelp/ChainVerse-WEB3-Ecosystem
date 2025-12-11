export interface PostAuthor {
    _id: string;
    username: string;
    name: string;
    profilePic: string;
    isVerified: boolean;
}

export interface SearchUsersResponse {
    success: boolean;
    users: Array<{
        _id: string;
        username: string;
        name: string;
        profilePic: string;
        isVerified: boolean;
    }>;
}

export interface Post {
    _id: string;
    author: PostAuthor;
    content: string;
    mediaUrls: string[];
    mediaType: 'none' | 'image' | 'video';
    hashtags: string[];
    mentions: string[];
    likesCount: number;
    commentsCount: number;
    sharesCount: number;
    isLiked: boolean;
    isOwnPost: boolean;
    createdAt: Date | string;
    updatedAt: Date | string;
    editedAt?: Date | string;
}

export interface Comment {
    _id: string;
    post: string;
    author: PostAuthor;
    content: string;
    parentComment?: string;
    likesCount: number;
    repliesCount: number;
    isLiked: boolean;
    isOwnComment: boolean;
    postedAsCommunity: boolean;
    community?: {
        _id: string;
        username: string;
        name: string;
        profilePic: string;
    };
    createdAt: Date | string;
    updatedAt: Date | string;
    editedAt?: Date | string;
    replies?: Comment[];
}

export interface PostsListResponse {
    posts: Post[];
    hasMore: boolean;
    nextCursor?: string;
    totalCount?: number;
}

export interface CommentsListResponse {
    comments: Comment[];
    hasMore: boolean;
    nextCursor?: string;
    totalCount?: number;
}

export interface PostDetailResponse {
    post: Post;
    comments: Comment[];
    hasMoreComments: boolean;
    nextCommentsCursor?: string;
    totalCommentsCount?: number;
}

export interface LikeResponse {
    success: boolean;
    isLiked: boolean;
    likesCount: number;
    message: string;
}

export interface ShareResponse {
    success: boolean;
    shareUrl: string;
    sharesCount: number;
    message: string;
}

export interface MediaUploadResponse {
    success: boolean;
    mediaUrl?: string;
    mediaType?: 'image' | 'video';
    message?: string;
    error?: string;
}

export interface PostStats {
    totalPosts: number;
    totalLikes: number;
    totalComments: number;
    totalShares: number;
    todayPosts: number;
    weekPosts: number;
}

export interface CreatePostData {
    content: string;
    mediaUrls?: string[];
    mediaType?: 'none' | 'image' | 'video';
}

export interface CreateCommentData {
    postId: string;
    content: string;
    parentCommentId?: string;
}
