
export interface AdminPostItem {
    _id: string;
    content: string;
    author: {
        _id: string;
        username: string;
        email: string;
        profileImage?: string;
    };
    mediaUrls: string[];
    mediaType: string;
    likesCount: number;
    commentsCount: number;
    createdAt: string;
    isDeleted: boolean;
    postType: 'user' | 'admin';
}

export interface AdminPostsResponse {
    success: boolean;
    data: {
        posts: AdminPostItem[];
        nextCursor?: string;
        hasMore: boolean;
    };
}

export interface AdminCommentsResponse {
    success: boolean;
    data: {
        comments: any[];
        nextCursor?: string;
        hasMore: boolean;
    };
}

export interface AdminLikersResponse {
    success: boolean;
    data: {
        likers: any[];
        nextCursor?: string;
        hasMore: boolean;
    };
}
