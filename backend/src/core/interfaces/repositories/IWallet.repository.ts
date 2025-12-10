import { IWallet } from '../../../models/wallet.model';

export interface IWalletRepository {
  saveWallet(address: string): Promise<IWallet>;
  findWallet(address: string): Promise<IWallet | null>;
  count(): Promise<number>;
}