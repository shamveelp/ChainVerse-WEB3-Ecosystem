// import { injectable } from "inversify";
// import { IWalletRepository } from "../core/interfaces/repositories/IWalletRepository";
// import { IWallet } from "../models/wallet.model";
// import WalletModel from "../models/wallet.model";

// @injectable()
// export class WalletRepository implements IWalletRepository {
//   async create(walletData: Partial<IWallet>): Promise<IWallet> {
//     const wallet = new WalletModel(walletData);
//     return await wallet.save();
//   }

//   async findByAddress(walletAddress: string): Promise<IWallet | null> {
//     return await WalletModel.findOne({ walletAddress }).exec();
//   }

//   async update(walletAddress: string, walletData: Partial<IWallet>): Promise<IWallet> {
//     const updatedWallet = await WalletModel.findOneAndUpdate(
//       { walletAddress },
//       { $set: { ...walletData, updatedAt: new Date() } },
//       { new: true }
//     ).exec();
    
//     if (!updatedWallet) {
//       throw new Error("Wallet not found");
//     }
    
//     return updatedWallet;
//   }

//   async findAll(): Promise<IWallet[]> {
//     return await WalletModel.find().exec();
//   }
// }