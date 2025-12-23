import mongoose, { Schema, Document, Model, Types } from "mongoose";
import { ObjectId } from "mongodb";

export interface IUser extends Document {
    _id: ObjectId;
    username: string;
    name: string;
    email: string;
    password: string;
    phone?: string;
    googleId: string | null;
    refferalCode: string;
    refferedBy: ObjectId | null;
    profilePic: string;
    role: 'user';
    totalPoints: number;
    isBlocked: boolean;
    isBanned: boolean;
    tokenVersion?: number;
    isEmailVerified: boolean;
    isGoogleUser: boolean;
    dailyCheckin: {
        lastCheckIn: Date;
        streak: number;
    };
    followersCount: number;
    followingCount: number;
    // Community/Social Profile Fields
    community: {
        bio: string;
        location: string;
        website: string;
        bannerImage: string;
        isVerified: boolean;
        postsCount: number;
        likesReceived: number;
        socialLinks: {
            twitter?: string;
            instagram?: string;
            linkedin?: string;
            github?: string;
        };
        settings: {
            isProfilePublic: boolean;
            allowDirectMessages: boolean;
            showFollowersCount: boolean;
            showFollowingCount: boolean;
        };
    };
    createdAt: Date;
    updatedAt: Date;
}

const UserSchema: Schema<IUser> = new Schema({
    username: { type: String, required: true, unique: true },
    name: { type: String, required: false },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: false },
    phone: { type: String, required: false },
    googleId: { type: String, default: null },
    refferalCode: { type: String, required: false, unique: false },
    refferedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    profilePic: { type: String, default: '' },
    totalPoints: { type: Number, default: 0 },
    isBlocked: { type: Boolean, default: false },
    isBanned: { type: Boolean, default: false },
    tokenVersion: { type: Number, default: 0 },
    role: { type: String, enum: ['user'], default: 'user' },
    isEmailVerified: { type: Boolean, default: false },
    isGoogleUser: { type: Boolean, default: false },
    dailyCheckin: {
        lastCheckIn: { type: Date, default: null },
        streak: { type: Number, default: 0 }
    },
    followersCount: { type: Number, default: 0 },
    followingCount: { type: Number, default: 0 },
    // Community/Social Profile Fields
    community: {
        bio: { type: String, default: '', maxlength: 500 },
        location: { type: String, default: '', maxlength: 100 },
        website: { type: String, default: '', maxlength: 200 },
        bannerImage: { type: String, default: '' },
        isVerified: { type: Boolean, default: false },
        postsCount: { type: Number, default: 0 },
        likesReceived: { type: Number, default: 0 },
        socialLinks: {
            twitter: { type: String, default: '' },
            instagram: { type: String, default: '' },
            linkedin: { type: String, default: '' },
            github: { type: String, default: '' }
        },
        settings: {
            isProfilePublic: { type: Boolean, default: true },
            allowDirectMessages: { type: Boolean, default: true },
            showFollowersCount: { type: Boolean, default: true },
            showFollowingCount: { type: Boolean, default: true }
        }
    }
}, {
    timestamps: true
});

export const UserModel: Model<IUser> = mongoose.model<IUser>('User', UserSchema);