import mongoose, { Schema, Document, Types } from "mongoose";

export interface IFollow extends Document {
    follower: Types.ObjectId; // User who is following
    following: Types.ObjectId; // User being followed
    createdAt: Date;
    updatedAt: Date;
}

const FollowSchema: Schema<IFollow> = new Schema({
    follower: { 
        type: Schema.Types.ObjectId, 
        ref: 'User', 
        required: true 
    },
    following: { 
        type: Schema.Types.ObjectId, 
        ref: 'User', 
        required: true 
    }
}, {
    timestamps: true
});

// Compound index to prevent duplicate follows and optimize queries
FollowSchema.index({ follower: 1, following: 1 }, { unique: true });
FollowSchema.index({ follower: 1 });
FollowSchema.index({ following: 1 });

// Prevent self-following
FollowSchema.pre('save', function(next) {
    if (this.follower.equals(this.following)) {
        const error = new Error('Users cannot follow themselves');
        return next(error);
    }
    next();
});

export const FollowModel = mongoose.model<IFollow>('Follow', FollowSchema);