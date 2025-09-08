import { Schema, model, Document } from 'mongoose';

export interface ICoin extends Document {
  name: string;
  symbol: string;
  ticker: string;
  contractAddress: string;
  decimals: number;
  totalSupply: string;
  circulatingSupply: string;
  network: string;
  isListed: boolean;
  logoUrl?: string;
  description?: string;
  website?: string;
  twitter?: string;
  telegram?: string;
  createdBy: string; // Admin ID
  deploymentTxHash?: string;
  priceUSD?: number;
  volume24h?: string;
  marketCap?: string;
  createdAt: Date;
  updatedAt: Date;
}

const coinSchema = new Schema<ICoin>({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  symbol: {
    type: String,
    required: true,
    uppercase: true,
    trim: true,
  },
  ticker: {
    type: String,
    required: true,
    uppercase: true,
    trim: true,
  },
  contractAddress: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  decimals: {
    type: Number,
    required: true,
    default: 18,
  },
  totalSupply: {
    type: String,
    required: true,
  },
  circulatingSupply: {
    type: String,
    required: true,
  },
  network: {
    type: String,
    required: true,
    default: 'sepolia',
  },
  isListed: {
    type: Boolean,
    default: true,
  },
  logoUrl: {
    type: String,
  },
  description: {
    type: String,
  },
  website: {
    type: String,
  },
  twitter: {
    type: String,
  },
  telegram: {
    type: String,
  },
  createdBy: {
    type: String,
    required: true,
  },
  deploymentTxHash: {
    type: String,
  },
  priceUSD: {
    type: Number,
    default: 0,
  },
  volume24h: {
    type: String,
    default: "0",
  },
  marketCap: {
    type: String,
    default: "0",
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

coinSchema.index({ symbol: 1 });
coinSchema.index({ contractAddress: 1 });
coinSchema.index({ isListed: 1 });
coinSchema.index({ network: 1 });

export default model<ICoin>('Coin', coinSchema);