
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

    constructor(data: any) {
        this._id = data._id?.toString() || data._id;
        this.content = data.content;
        this.author = {
            _id: data.author?._id?.toString() || data.author?._id,
            username: data.author?.username || 'unknown',
            email: data.author?.email || '',
            profileImage: data.author?.profileImage || data.author?.profilePic
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

    constructor(data: any) {
        this._id = data._id?.toString() || data._id;
        this.content = data.content;
        this.author = {
            _id: data.userId?._id?.toString() || data.userId,
            username: data.userId?.username || 'unknown',
            profileImage: data.userId?.profilePic
        };
        this.createdAt = data.createdAt;
    }
}

export class AdminPostLikerDto {
    public _id: string;
    public username: string;
    public profileImage?: string;

    constructor(data: any) {
        this._id = data._id?.toString() || data._id;
        this.username = data.username || 'unknown';
        this.profileImage = data.profilePic;
    }
}
