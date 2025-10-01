import mongoose, { Schema, Document, Model, Types } from "mongoose";

export interface ILike extends Document {
    _id: Types.ObjectId;
    user: Types.ObjectId;
    post: Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}

const LikeSchema: Schema<ILike> = new Schema({
    user: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    post: {
        type: Schema.Types.ObjectId,
        ref: 'Post',
        required: true,
        index: true
    }
}, {
    timestamps: true
});

// Compound unique index to prevent duplicate likes
LikeSchema.index({ user: 1, post: 1 }, { unique: true });

// Index for efficient queries
LikeSchema.index({ post: 1, createdAt: -1 });
LikeSchema.index({ user: 1, createdAt: -1 });

export const LikeModel: Model<ILike> = mongoose.model<ILike>('Like', LikeSchema);