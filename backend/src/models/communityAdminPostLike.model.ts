import mongoose, { Schema, Document, Model, Types } from "mongoose";

export interface ICommunityAdminPostLike extends Document {
    _id: Types.ObjectId;
    admin: Types.ObjectId;
    post: Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}

const CommunityAdminPostLikeSchema: Schema<ICommunityAdminPostLike> = new Schema({
    admin: {
        type: Schema.Types.ObjectId,
        ref: 'CommunityAdmin',
        required: true,
        index: true
    },
    post: {
        type: Schema.Types.ObjectId,
        ref: 'CommunityAdminPost',
        required: true,
        index: true
    }
}, {
    timestamps: true
});

// Compound unique index to prevent duplicate likes
CommunityAdminPostLikeSchema.index({ admin: 1, post: 1 }, { unique: true });

export const CommunityAdminPostLikeModel: Model<ICommunityAdminPostLike> = mongoose.model<ICommunityAdminPostLike>('CommunityAdminPostLike', CommunityAdminPostLikeSchema);
export default CommunityAdminPostLikeModel;