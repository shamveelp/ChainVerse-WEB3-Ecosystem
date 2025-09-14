import WalletModel from '../models/wallet.model';
import { IWalletRepository } from '../core/interfaces/repositories/IWalletRepository';
import { IWallet } from '../models/wallet.model';

export class WalletRepository implements IWalletRepository {
  async saveWallet(address: string): Promise<IWallet> {
    const wallet = await WalletModel.findOneAndUpdate(
      { address },
      { address, lastConnected: new Date() },
      { upsert: true, new: true }
    );
    return wallet;
  }

  async findWallet(address: string): Promise<IWallet | null> {
    return await WalletModel.findOne({ address });
  }
}