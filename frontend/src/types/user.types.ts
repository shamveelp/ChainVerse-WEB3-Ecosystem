

export interface UserProfile {
    _id: string;
    username: string;
    name: string;
    email: string;
    phone?: string;
    refferalCode: string;
    refferedBy: string;
    profilePic: string;
    role: 'user';
    totalPoints: number;
    isBlocked: boolean;
    isBanned: boolean;
    tokenVersion?: number;
    isEmailVerified: boolean;
    isGoogleUser: boolean;
    dailyCheckin:{
        lastCheckIn: Date;
        streak: number;
    }
    followersCount: number;
    followingCount: number;
    createdAt: Date;
    updatedAt: Date;

}
