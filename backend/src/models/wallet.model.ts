import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IWallet extends Document {
  _id: Types.ObjectId;
  address: string;
  lastConnected: Date;
  createdAt?: Date;
  updatedAt?: Date;
  connectionCount?: number;
  balance?: string;
  isActive?: boolean;
  network?: string;
  label?: string;
}

const walletSchema = new Schema<IWallet>(
  {
    address: { 
      type: String, 
      required: true, 
      unique: true,
      index: true 
    },
    lastConnected: { 
      type: Date, 
      default: Date.now,
      index: true 
    },
    connectionCount: {
      type: Number,
      default: 1
    },
    balance: {
      type: String,
      default: "0"
    },
    isActive: {
      type: Boolean,
      default: true
    },
    network: {
      type: String,
      default: "sepolia"
    },
    label: {
      type: String,
      default: ""
    }
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// Create indexes for better query performance
walletSchema.index({ address: 1 });
walletSchema.index({ lastConnected: -1 });
walletSchema.index({ createdAt: -1 });
walletSchema.index({ connectionCount: -1 });

export default mongoose.model<IWallet>('Wallet', walletSchema);