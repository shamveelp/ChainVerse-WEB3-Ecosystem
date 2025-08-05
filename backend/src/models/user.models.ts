import mongoose, {Schema, Document, Model, Types} from "mongoose";
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


const UserSchema: Schema<IUser> = new Schema({
    username: { type: String, required: true, unique: true },
    name: { type: String, required: false },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: false },
    phone: { type: String, required: false },
    googleId: { type: String, default: null },
    refferalCode: { type: String, required: false, unique: false },
    refferedBy: { type: Types.ObjectId, ref: 'User', default: null },
    profilePic: { type: String, default: '' },
    totalPoints: { type: Number, default: 0 },
    isBlocked: { type: Boolean, default: false },
    isBanned: { type: Boolean, default: false },
    role: {type: String, enum:['user'], default: 'user'},
    isEmailVerified: { type: Boolean, default: false },
    isGoogleUser: { type: Boolean, default: false }, // Added to schema
    dailyCheckin:{
        lastCheckIn:{type : Date, default : null},
        streak:{type : Number, default : 0}
    },
    followersCount:{type : Number, default : 0},
    followingCount:{type : Number, default : 0},
}, {
    timestamps: true
})

// export type UserDocument = IUser & Document;
export const UserModel: Model<IUser> = mongoose.model<IUser>('User', UserSchema);
// export default UserModel;
