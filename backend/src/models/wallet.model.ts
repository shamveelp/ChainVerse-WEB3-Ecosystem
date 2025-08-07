import mongoose, {Schema, Document, Model, Types} from "mongoose";


export interface IWallet extends Document {
    walletAddress: string;
    createdAt: Date;
    updatedAt: Date;
}


const WalletSchema: Schema<IWallet> = new Schema({
    walletAddress: { type: String },
}, {
    timestamps: true
})


export const WalletModel: Model<IWallet> = mongoose.model<IWallet>('Wallet', WalletSchema);
export default WalletModel;


