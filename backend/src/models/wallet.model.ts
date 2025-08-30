import { Schema, model, Document } from 'mongoose';

export interface IWallet extends Document {
  address: string;
  lastConnected: Date;
  connectionCount: number;
  createdAt: Date;
}

const walletSchema = new Schema<IWallet>({
  address: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  lastConnected: {
    type: Date,
    default: Date.now,
  },
  connectionCount: {
    type: Number,
    default: 1,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
}, {
  timestamps: true,
});

export default model<IWallet>('Wallet', walletSchema);