import mongoose, { Schema, Document, Types } from "mongoose";

export interface ITradingPair extends Document {
  _id: Types.ObjectId;
  baseToken: 'ETH' | 'CoinA' | 'CoinB';
  quoteToken: 'ETH' | 'CoinA' | 'CoinB';
  symbol: string; // e.g., "ETH/CoinA"
  currentPrice: number;
  volume24h: number;
  priceChange24h: number;
  priceChangePercent24h: number;
  high24h: number;
  low24h: number;
  totalLiquidity: number;
  totalTrades: number;
  isActive: boolean;
  lastTradeAt: Date;
  createdAt: Date;
  updatedAt: Date;
  marketCap: number;
}

const TradingPairSchema: Schema<ITradingPair> = new Schema({
  baseToken: { type: String, enum: ['ETH', 'CoinA', 'CoinB'], required: true },
  quoteToken: { type: String, enum: ['ETH', 'CoinA', 'CoinB'], required: true },
  symbol: { type: String, required: true, unique: true, index: true },
  currentPrice: { type: Number, required: true, default: 0 },
  volume24h: { type: Number, required: true, default: 0 },
  priceChange24h: { type: Number, required: true, default: 0 },
  priceChangePercent24h: { type: Number, required: true, default: 0 },
  high24h: { type: Number, required: true, default: 0 },
  low24h: { type: Number, required: true, default: 0 },
  totalLiquidity: { type: Number, required: true, default: 0 },
  totalTrades: { type: Number, required: true, default: 0 },
  isActive: { type: Boolean, default: true, index: true },
  lastTradeAt: { type: Date, default: Date.now }
}, {
  timestamps: true
});

// Compound indexes
TradingPairSchema.index({ baseToken: 1, quoteToken: 1 }, { unique: true });
TradingPairSchema.index({ isActive: 1, volume24h: -1 });

export const TradingPairModel = mongoose.model<ITradingPair>('TradingPair', TradingPairSchema);