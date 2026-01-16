import mongoose, { Schema, Document, Model, Types } from "mongoose";
// import { ObjectId } from "mongodb";


export interface ICommunityAdmin extends Document {
    _id: Types.ObjectId;
    communityId: Types.ObjectId;
    email: string;
    password: string;
    profilePic: string;
    bannerImage: string;
    name: string;
    role: "communityAdmin";
    isActive: boolean;
    tokenVersion?: number;
    lastLogin: Date;
    createdAt: Date;
    updatedAt: Date;
    bio?: string;
    location?: string;
    website?: string;
}


const CommunityAdminSchema: Schema<ICommunityAdmin> = new Schema({
    communityId: { type: Schema.Types.ObjectId },
    email: { type: String, required: true },
    password: { type: String, required: true },
    profilePic: { type: String },
    bannerImage: { type: String },
    name: { type: String },
    role: { type: String, enum: ['communityAdmin'], default: 'communityAdmin' },
    isActive: { type: Boolean, default: true },
    tokenVersion: { type: Number, default: 0 },
    lastLogin: { type: Date, default: null },
    bio: { type: String },
    location: { type: String },
    website: { type: String },
}, {
    timestamps: true
})


export const CommunityAdminModel: Model<ICommunityAdmin> = mongoose.model<ICommunityAdmin>('CommunityAdmin', CommunityAdminSchema);
export default CommunityAdminModel;
