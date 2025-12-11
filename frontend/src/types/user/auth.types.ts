export interface LoginResponse {
    user: {
        _id: string;
        username: string;
        email: string;
        name: string;
        refferalCode: string;
        totalPoints: number;
        profilePic?: string;
        role: string;
        isEmailVerified: boolean;
        createdAt: string;
        lastLogin?: string;
    };
    accessToken: string;
    message: string;
}

export interface RegisterResponse {
    success: boolean;
    message: string;
}

export interface UsernameCheckResponse {
    available: boolean;
    success: boolean;
}

export interface GenerateUsernameResponse {
    username: string;
    success: boolean;
}
