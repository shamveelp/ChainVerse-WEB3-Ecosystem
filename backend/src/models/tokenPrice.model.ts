import mongoose, { Schema, Document, Types } from "mongoose";

export interface ITokenPrice extends Document {
  _id: Types.ObjectId;
  token: 'ETH' | 'CoinA' | 'CoinB';
  priceInETH: number;
  priceInUSD: number;
  volume24h: number;
  marketCap: number;
  priceChange24h: number;
  priceChangePercent24h: number;
  high24h: number;
  low24h: number;
  totalSupply: number;
  circulatingSupply: number;
  liquidity: number;
  timestamp: Date;
  blockNumber: number;
  source: 'swap' | 'external' | 'oracle';
  createdAt: Date;
}

const TokenPriceSchema: Schema<ITokenPrice> = new Schema({
  token: { type: String, enum: ['ETH', 'CoinA', 'CoinB'], required: true, index: true },
  priceInETH: { type: Number, required: true },
  priceInUSD: { type: Number, required: true },
  volume24h: { type: Number, required: true, default: 0 },
  marketCap: { type: Number, required: true, default: 0 },
  priceChange24h: { type: Number, required: true, default: 0 },
  priceChangePercent24h: { type: Number, required: true, default: 0 },
  high24h: { type: Number, required: true },
  low24h: { type: Number, required: true },
  totalSupply: { type: Number, required: true, default: 0 },
  circulatingSupply: { type: Number, required: true, default: 0 },
  liquidity: { type: Number, required: true, default: 0 },
  timestamp: { type: Date, required: true, index: true },
  blockNumber: { type: Number, required: true },
  source: { type: String, enum: ['swap', 'external', 'oracle'], default: 'swap' }
}, {
  timestamps: { createdAt: true, updatedAt: false }
});

// Compound indexes
TokenPriceSchema.index({ token: 1, timestamp: -1 });
TokenPriceSchema.index({ timestamp: -1 });

export const TokenPriceModel = mongoose.model<ITokenPrice>('TokenPrice', TokenPriceSchema);