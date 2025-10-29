import mongoose, { Schema, Document, Model, Types } from "mongoose";

export interface ICommunityAdminCommentLike extends Document {
    _id: Types.ObjectId;
    admin: Types.ObjectId;
    comment: Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}

const CommunityAdminCommentLikeSchema: Schema<ICommunityAdminCommentLike> = new Schema({
    admin: {
        type: Schema.Types.ObjectId,
        ref: 'CommunityAdmin',
        required: true,
        index: true
    },
    comment: {
        type: Schema.Types.ObjectId,
        ref: 'CommunityAdminComment',
        required: true,
        index: true
    }
}, {
    timestamps: true
});

// Compound unique index to prevent duplicate likes
CommunityAdminCommentLikeSchema.index({ admin: 1, comment: 1 }, { unique: true });

export const CommunityAdminCommentLikeModel: Model<ICommunityAdminCommentLike> = mongoose.model<ICommunityAdminCommentLike>('CommunityAdminCommentLike', CommunityAdminCommentLikeSchema);
export default CommunityAdminCommentLikeModel;