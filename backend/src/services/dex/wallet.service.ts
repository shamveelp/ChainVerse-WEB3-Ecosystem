import { IWalletService } from '../../core/interfaces/services/dex/IWallet.service';
import { IWallet } from '../../models/wallet.model';
import { WalletRepository } from '../../repositories/wallet.repository';

export class WalletService implements IWalletService {
  private walletRepository: WalletRepository;

  constructor() {
    this.walletRepository = new WalletRepository();
  }

  async saveWallet(address: string): Promise<IWallet> {
    return await this.walletRepository.saveWallet(address);
  }
}