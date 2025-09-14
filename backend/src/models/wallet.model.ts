import mongoose, { Schema } from 'mongoose';


export interface IWallet {
  address: string;
  lastConnected: Date;
}

const walletSchema = new Schema<IWallet>({
  address: { type: String, required: true, unique: true },
  lastConnected: { type: Date, default: Date.now },
});

export default mongoose.model<IWallet>('Wallet', walletSchema);