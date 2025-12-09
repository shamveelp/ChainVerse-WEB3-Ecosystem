import { inject, injectable } from "inversify";
import { TYPES } from "../../core/types/types";
import { IWalletRepository } from "../../core/interfaces/repositories/IWalletRepository";
import { IWalletService } from "../../core/interfaces/services/user/IWallet.service";
import { IWallet } from "../../models/wallet.model";

@injectable()
export class WalletService implements IWalletService {
  constructor(
    @inject(TYPES.IWalletRepository) private _walletRepository: IWalletRepository
  ) {}

  async connectWallet(walletData: Partial<IWallet>): Promise<IWallet> {
    const existingWallet = await this._walletRepository.findByAddress(walletData.walletAddress!);
    
    if (existingWallet) {
      return await this._walletRepository.update(
        walletData.walletAddress!,
        {
          ...walletData,
          lastConnectedAt: new Date()
        }
      );
    }

    return await this._walletRepository.create({
      ...walletData,
      lastConnectedAt: new Date()
    });
  }

  async getWallet(walletAddress: string): Promise<IWallet | null> {
    return await this._walletRepository.findByAddress(walletAddress);
  }

  async getAllWallets(): Promise<IWallet[]> {
    return await this._walletRepository.findAll();
  }
}