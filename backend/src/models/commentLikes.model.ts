import mongoose, { Schema, Document, Model, Types } from "mongoose";

export interface ICommentLike extends Document {
    _id: Types.ObjectId;
    user: Types.ObjectId;
    comment: Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}

const CommentLikeSchema: Schema<ICommentLike> = new Schema({
    user: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    comment: {
        type: Schema.Types.ObjectId,
        ref: 'Comment',
        required: true,
        index: true
    }
}, {
    timestamps: true
});

// Compound unique index to prevent duplicate likes
CommentLikeSchema.index({ user: 1, comment: 1 }, { unique: true });

// Index for efficient queries
CommentLikeSchema.index({ comment: 1, createdAt: -1 });
CommentLikeSchema.index({ user: 1, createdAt: -1 });

export const CommentLikeModel: Model<ICommentLike> = mongoose.model<ICommentLike>('CommentLike', CommentLikeSchema);