import { IWallet } from "../../../../models/wallet.model";

export interface IWalletService {
  connectWallet(walletData: Partial<IWallet>): Promise<IWallet>;
  getWallet(walletAddress: string): Promise<IWallet | null>;
  getAllWallets(): Promise<IWallet[]>;
}