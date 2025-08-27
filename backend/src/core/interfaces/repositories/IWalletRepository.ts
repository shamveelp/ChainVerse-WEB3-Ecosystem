import { IWallet } from "../../../models/wallet.model";

export interface IWalletRepository {
  create(walletData: Partial<IWallet>): Promise<IWallet>;
  findByAddress(walletAddress: string): Promise<IWallet | null>;
  update(walletAddress: string, walletData: Partial<IWallet>): Promise<IWallet>;
  findAll(): Promise<IWallet[]>;
}