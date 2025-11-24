import mongoose, { Schema, Document, Types } from "mongoose";

export interface ISwapTransaction extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  walletAddress: string;
  txHash: string;
  fromToken: 'ETH' | 'CoinA' | 'CoinB';
  toToken: 'ETH' | 'CoinA' | 'CoinB';
  fromAmount: string;
  toAmount: string;
  actualFromAmount: string;
  actualToAmount: string;
  exchangeRate: number;
  slippage: number;
  gasUsed: string;
  gasFee: string;
  status: 'pending' | 'completed' | 'failed';
  blockNumber: number;
  timestamp: Date;
  priceImpact: number;
  volume24h?: number;
  createdAt: Date;
  updatedAt: Date;
}

const SwapTransactionSchema: Schema<ISwapTransaction> = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  walletAddress: { type: String, required: true, index: true },
  txHash: { type: String, required: true, unique: true, index: true },
  fromToken: { type: String, enum: ['ETH', 'CoinA', 'CoinB'], required: true },
  toToken: { type: String, enum: ['ETH', 'CoinA', 'CoinB'], required: true },
  fromAmount: { type: String, required: true },
  toAmount: { type: String, required: true },
  actualFromAmount: { type: String, required: true },
  actualToAmount: { type: String, required: true },
  exchangeRate: { type: Number, required: true },
  slippage: { type: Number, required: true, default: 1 },
  gasUsed: { type: String, required: true },
  gasFee: { type: String, required: true },
  status: { type: String, enum: ['pending', 'completed', 'failed'], default: 'pending', index: true },
  blockNumber: { type: Number, required: true },
  timestamp: { type: Date, required: true, index: true },
  priceImpact: { type: Number, required: true },
  volume24h: { type: Number, default: 0 }
}, {
  timestamps: true
});

// Compound indexes for better query performance
SwapTransactionSchema.index({ fromToken: 1, toToken: 1, timestamp: -1 });
SwapTransactionSchema.index({ userId: 1, timestamp: -1 });
SwapTransactionSchema.index({ timestamp: -1, status: 1 });

export const SwapTransactionModel = mongoose.model<ISwapTransaction>('SwapTransaction', SwapTransactionSchema);