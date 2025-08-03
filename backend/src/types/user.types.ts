import { Document, Types } from "mongoose";
import { Request } from "express";



export interface IUser extends Document {
    _id: Types.ObjectId;
    username: string;
    name: string;
    email: string;
    password: string;
    phone: string;
    googleId: string | null;
    refferalCode: string;
    refferedBy: Types.ObjectId | null;
    profilePic: string;
    role: string;
    totalPoints: number;
    isBlocked: boolean;
    isBanned: boolean;
    isEmailVerified: boolean;
    dailyCheckin: {
        lastCheckIn: Date | null;
        streak: number;
    };
    followersCount: number;
    followingCount: number;
    createdAt: Date;
    updatedAt: Date;
}



