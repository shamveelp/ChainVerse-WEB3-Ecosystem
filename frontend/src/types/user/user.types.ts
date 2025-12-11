export interface UserProfile {
    _id: string;
    username: string;
    name: string;
    email: string;
    phone?: string;
    refferalCode: string;
    refferedBy: string;
    profilePic: string;
    role: "user";
    totalPoints: number;
    isBlocked: boolean;
    isBanned: boolean;
    tokenVersion?: number;
    isEmailVerified: boolean;
    isGoogleUser: boolean;
    dailyCheckin: {
        lastCheckIn: Date | string | null;
        streak: number;
    };
    followersCount: number;
    followingCount: number;
    createdAt: Date | string;
    updatedAt: Date | string;
}

export interface ReferralStats {
    totalReferrals: number;
    totalPointsEarned: number;
    referralCode: string;
    referralLink: string;
}

export interface CheckInStatus {
    hasCheckedInToday: boolean;
    currentStreak: number;
    nextCheckInAvailable: Date | null;
}

export interface DailyCheckInResult {
    success: boolean;
    pointsAwarded: number;
    streakCount: number;
    message: string;
}

export interface UpdateProfileData {
    name: string;
    username: string;
    phone?: string;
    profilePic?: string;
}
