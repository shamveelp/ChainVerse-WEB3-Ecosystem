import { IWallet } from '../../../../models/wallet.model';

export interface IWalletService {
  saveWallet(address: string): Promise<IWallet>;
}