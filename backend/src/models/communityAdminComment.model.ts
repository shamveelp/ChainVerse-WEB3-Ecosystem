import mongoose, { Schema, Document, Model, Types } from "mongoose";

export interface ICommunityAdminComment extends Document {
    _id: Types.ObjectId;
    post: Types.ObjectId;
    author: Types.ObjectId;
    content: string;
    parentComment?: Types.ObjectId;
    likesCount: number;
    repliesCount: number;
    isDeleted: boolean;
    deletedAt?: Date;
    editedAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}

const CommunityAdminCommentSchema: Schema<ICommunityAdminComment> = new Schema({
    post: {
        type: Schema.Types.ObjectId,
        ref: 'CommunityAdminPost',
        required: true,
        index: true
    },
    author: {
        type: Schema.Types.ObjectId,
        ref: 'CommunityAdmin',
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
        ref: 'CommunityAdminComment',
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
CommunityAdminCommentSchema.index({ post: 1, createdAt: -1 });
CommunityAdminCommentSchema.index({ author: 1, createdAt: -1 });
CommunityAdminCommentSchema.index({ parentComment: 1, createdAt: -1 });
CommunityAdminCommentSchema.index({ isDeleted: 1, post: 1, createdAt: -1 });

export const CommunityAdminCommentModel: Model<ICommunityAdminComment> = mongoose.model<ICommunityAdminComment>('CommunityAdminComment', CommunityAdminCommentSchema);
export default CommunityAdminCommentModel;