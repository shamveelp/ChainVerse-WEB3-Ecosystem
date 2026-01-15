import mongoose, { Schema, Document, Types } from 'mongoose';

export interface INotification extends Document {
    recipient: Types.ObjectId;
    type: string; // 'chaincast_started', 'community_channel', 'community_group', 'system', 'mention'
    title: string;
    message: string;
    link?: string;
    read: boolean;
    metadata?: Record<string, unknown>;
    createdAt: Date;
    updatedAt: Date;
}

const NotificationSchema = new Schema({
    recipient: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    type: { type: String, required: true },
    title: { type: String, required: true },
    message: { type: String, required: true },
    link: { type: String },
    read: { type: Boolean, default: false },
    metadata: { type: Schema.Types.Mixed },
}, {
    timestamps: true
});

// Index for efficient fetching of user's notifications
NotificationSchema.index({ recipient: 1, createdAt: -1 });

export const NotificationModel = mongoose.model<INotification>('Notification', NotificationSchema);
export default NotificationModel;
