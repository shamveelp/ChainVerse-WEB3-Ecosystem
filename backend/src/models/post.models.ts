import mongoose, { Schema, Document, Model, Types } from "mongoose";

export interface IPost extends Document {
    _id: Types.ObjectId;
    author: Types.ObjectId;
    content: string;
    mediaUrls: string[];
    mediaType: 'none' | 'image' | 'video';
    hashtags: string[];
    mentions: string[];
    likesCount: number;
    commentsCount: number;
    sharesCount: number;
    isDeleted: boolean;
    deletedAt?: Date;
    editedAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}

const PostSchema: Schema<IPost> = new Schema({
    author: { 
        type: Schema.Types.ObjectId, 
        ref: 'User', 
        required: true,
        index: true 
    },
    content: { 
        type: String, 
        required: true, 
        maxlength: 2000,
        trim: true 
    },
    mediaUrls: [{ 
        type: String, 
        maxlength: 500 
    }],
    mediaType: {
        type: String,
        enum: ['none', 'image', 'video'],
        default: 'none'
    },
    hashtags: [{ 
        type: String, 
        lowercase: true,
        trim: true,
        maxlength: 50
    }],
    mentions: [{ 
        type: String, 
        lowercase: true,
        trim: true,
        maxlength: 50
    }],
    likesCount: { 
        type: Number, 
        default: 0,
        min: 0
    },
    commentsCount: { 
        type: Number, 
        default: 0,
        min: 0
    },
    sharesCount: { 
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
PostSchema.index({ author: 1, createdAt: -1 });
PostSchema.index({ createdAt: -1 });
PostSchema.index({ likesCount: -1, createdAt: -1 });
PostSchema.index({ commentsCount: -1, createdAt: -1 });
PostSchema.index({ hashtags: 1 });
PostSchema.index({ isDeleted: 1, createdAt: -1 });

// Compound indexes for feed algorithm
PostSchema.index({ isDeleted: 1, likesCount: -1, commentsCount: -1, createdAt: -1 });
PostSchema.index({ isDeleted: 1, author: 1, createdAt: -1 });

export const PostModel: Model<IPost> = mongoose.model<IPost>('Post', PostSchema);