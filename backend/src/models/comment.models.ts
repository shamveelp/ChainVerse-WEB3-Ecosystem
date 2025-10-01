import mongoose, { Schema, Document, Model, Types } from "mongoose";

export interface IComment extends Document {
    _id: Types.ObjectId;
    post: Types.ObjectId;
    author: Types.ObjectId;
    content: string;
    parentComment?: Types.ObjectId; // For nested comments/replies
    likesCount: number;
    repliesCount: number;
    isDeleted: boolean;
    deletedAt?: Date;
    editedAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}

const CommentSchema: Schema<IComment> = new Schema({
    post: {
        type: Schema.Types.ObjectId,
        ref: 'Post',
        required: true,
        index: true
    },
    author: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    content: {
        type: String,
        required: true,
        maxlength: 1000,
        trim: true
    },
    parentComment: {
        type: Schema.Types.ObjectId,
        ref: 'Comment',
        default: null,
        index: true
    },
    likesCount: {
        type: Number,
        default: 0,
        min: 0
    },
    repliesCount: {
        type: Number,
        default: 0,
        min: 0
    },
    isDeleted: {
        type: Boolean,
        default: false
    },
    deletedAt: {
        type: Date,
        default: null
    },
    editedAt: {
        type: Date,
        default: null
    }
}, {
    timestamps: true
});

// Indexes for performance
CommentSchema.index({ post: 1, createdAt: -1 });
CommentSchema.index({ author: 1, createdAt: -1 });
CommentSchema.index({ parentComment: 1, createdAt: -1 });
CommentSchema.index({ post: 1, parentComment: 1, createdAt: -1 });
CommentSchema.index({ isDeleted: 1, post: 1, createdAt: -1 });

export const CommentModel: Model<IComment> = mongoose.model<IComment>('Comment', CommentSchema);