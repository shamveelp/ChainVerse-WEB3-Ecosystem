import mongoose, { Schema, Document, Model, Types } from "mongoose";


export interface ICommunity extends Document {
    _id: Types.ObjectId;
    communityName: string;
    email: string;
    username: string;
    walletAddress: string;
    description: string;
    category: string;
    rules: [string];
    logo: string;
    banner: string;
    isVerified: boolean;
    status: string;
    socialLinks: [Object];
    members: [Types.ObjectId];
    communityAdmins: [Types.ObjectId];
    settings: {
        allowChainCast: boolean;
        allowGroupChat: boolean;
        allowPosts: boolean;
        allowQuests: boolean;
    }
    createdAt: Date;
    updatedAt: Date;
}



const CommunitySchema: Schema<ICommunity> = new Schema({
    communityName: { type: String },
    email: { type: String },
    username: { type: String },
    walletAddress: { type: String },
    description: { type: String },
    category: { type: String },
    rules: [{ type: String }],
    logo: { type: String },
    banner: { type: String },
    isVerified: { type: Boolean, default: false },
    status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
    socialLinks: [{ type: Object }],
    members: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    communityAdmins: [{ type: Schema.Types.ObjectId, ref: 'CommunityAdmin' }],
    settings: {
        allowChainCast: { type: Boolean, default: false },
        allowGroupChat: { type: Boolean, default: true },
        allowPosts: { type: Boolean, default: true },
        allowQuests: { type: Boolean, default: false },
    },
}, {
    timestamps: true
})


export const CommunityModel: Model<ICommunity> = mongoose.model<ICommunity>('Community', CommunitySchema);
export default CommunityModel;



