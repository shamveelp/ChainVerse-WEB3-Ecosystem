export interface Member {
    _id: string;
    userId: {
        _id: string;
        username: string;
        email: string;
        profileImage?: string;
    };
    role: string;
    joinedAt: string;
    isActive: boolean;
}
