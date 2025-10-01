import mongoose, { Schema, Document, Types } from "mongoose";

export interface IConversation extends Document {
  participants: Types.ObjectId[];
  lastMessage?: Types.ObjectId;
  lastActivity: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface IMessage extends Document {
  conversationId: Types.ObjectId;
  sender: Types.ObjectId;
  content: string;
  messageType: 'text';
  readBy: Array<{
    user: Types.ObjectId;
    readAt: Date;
  }>;
  editedAt?: Date;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ConversationSchema: Schema<IConversation> = new Schema({
  participants: [{
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }],
  lastMessage: {
    type: Schema.Types.ObjectId,
    ref: 'Message'
  },
  lastActivity: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

const MessageSchema: Schema<IMessage> = new Schema({
  conversationId: {
    type: Schema.Types.ObjectId,
    ref: 'Conversation',
    required: true
  },
  sender: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  content: {
    type: String,
    required: true,
    maxlength: 2000
  },
  messageType: {
    type: String,
    enum: ['text'],
    default: 'text'
  },
  readBy: [{
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    },
    readAt: {
      type: Date,
      default: Date.now
    }
  }],
  editedAt: {
    type: Date
  },
  isDeleted: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Indexes for better performance
ConversationSchema.index({ participants: 1 });
ConversationSchema.index({ lastActivity: -1 });
ConversationSchema.index({ 'participants': 1, 'lastActivity': -1 });

MessageSchema.index({ conversationId: 1, createdAt: -1 });
MessageSchema.index({ sender: 1 });
MessageSchema.index({ conversationId: 1, isDeleted: 1, createdAt: -1 });

export const ConversationModel = mongoose.model<IConversation>('Conversation', ConversationSchema);
export const MessageModel = mongoose.model<IMessage>('Message', MessageSchema);