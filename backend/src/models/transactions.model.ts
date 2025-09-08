import { Schema, model, Document } from 'mongoose';

export interface ITransaction extends Document {
  walletAddress: string;
  fromToken: string;
  toToken: string;
  fromAmount: string;
  toAmount: string;
  transactionHash: string;
  gasUsed?: string;
  gasPrice?: string;
  status: 'pending' | 'completed' | 'failed';
  network: string;
  timestamp: Date;
  blockNumber?: number;
  slippage?: number;
  priceImpact?: number;
  createdAt: Date;
  updatedAt: Date;
}

const transactionSchema = new Schema<ITransaction>({
  walletAddress: {
    type: String,
    required: true,
    trim: true,
  },
  fromToken: {
    type: String,
    required: true,
    trim: true,
  },
  toToken: {
    type: String,
    required: true,
    trim: true,
  },
  fromAmount: {
    type: String,
    required: true,
  },
  toAmount: {
    type: String,
    required: true,
  },
  transactionHash: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  gasUsed: {
    type: String,
  },
  gasPrice: {
    type: String,
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed'],
    default: 'pending',
  },
  network: {
    type: String,
    required: true,
    default: 'sepolia',
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
  blockNumber: {
    type: Number,
  },
  slippage: {
    type: Number,
  },
  priceImpact: {
    type: Number,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
}, {
  timestamps: true,
});

transactionSchema.index({ walletAddress: 1, createdAt: -1 });
transactionSchema.index({ transactionHash: 1 });
transactionSchema.index({ status: 1 });

export default model<ITransaction>('Transaction', transactionSchema);