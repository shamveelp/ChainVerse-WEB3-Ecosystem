import mongoose, { Schema, Document, Model, Types } from "mongoose";
// import { ObjectId } from "mongodb";


export interface ICommunityAdmin extends Document {
    _id: Types.ObjectId;
    communityId: Types.ObjectId;
    email: string;
    password: string;
    name: string;
    role: "communityAdmin";
    isActive: boolean;
    lastLogin: Date;
    createdAt: Date;
    updatedAt: Date;

}


const CommunityAdminSchema: Schema<ICommunityAdmin> = new Schema({
    communityId: { type: Schema.Types.ObjectId },
    email: { type: String, required: true },
    password: { type: String, required: true },
    name: { type: String },
    role: { type: String, enum: ['communityAdmin'], default: 'communityAdmin' },
    isActive: { type: Boolean, default: true },
    lastLogin: { type: Date, default: null },
    }, {
    timestamps: true
})


export const CommunityAdminModel: Model<ICommunityAdmin> = mongoose.model<ICommunityAdmin>('CommunityAdmin', CommunityAdminSchema);
export default CommunityAdminModel;
