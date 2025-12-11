export interface PostAuthor {
    _id: string;
    name: string;
    email: string;
    profilePic?: string;
    communityName?: string;
    communityLogo?: string;
    isVerified: boolean;
}

export interface CommunityAdminPost {
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
    canEdit: boolean;
    canDelete: boolean;
    createdAt: Date | string;
    updatedAt: Date | string;
    editedAt?: Date | string;
}

export interface CommunityAdminComment {
    _id: string;
    post: string;
    author: PostAuthor;
    content: string;
    parentComment?: string;
    likesCount: number;
    repliesCount: number;
    isLiked: boolean;
    isOwnComment: boolean;
    canEdit: boolean;
    canDelete: boolean;
    createdAt: Date | string;
    updatedAt: Date | string;
    editedAt?: Date | string;
    replies?: CommunityAdminComment[];
}

export interface PostsResponse {
    posts: CommunityAdminPost[];
    hasMore: boolean;
    nextCursor?: string;
    totalCount: number;
}

export interface CommentsResponse {
    comments: CommunityAdminComment[];
    hasMore: boolean;
    nextCursor?: string;
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

export interface LikeResponse {
    success: boolean;
    isLiked: boolean;
    likesCount: number;
    message: string;
}

export interface MediaUploadResponse {
    success: boolean;
    mediaUrl?: string;
    mediaType?: 'image' | 'video';
    message?: string;
    error?: string;
}
