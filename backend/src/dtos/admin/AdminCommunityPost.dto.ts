
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
        this._id = data._id;
        this.content = data.content;
        this.author = data.author; // Assuming populated
        this.mediaUrls = data.mediaUrls;
        this.mediaType = data.mediaType;
        this.likesCount = data.likesCount;
        this.commentsCount = data.commentsCount;
        this.createdAt = data.createdAt;
        this.isDeleted = data.isDeleted;
        this.postType = data.postType;
    }
}
