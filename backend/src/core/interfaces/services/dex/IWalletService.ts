import { IWallet } from "../../../../models/wallet.model";

export interface IWalletService {
  connectWallet(address: string): Promise<IWallet>;
  disconnectWallet(address: string): Promise<void>;
  getWalletInfo(address: string): Promise<IWallet | null>;
  updateWalletConnection(address: string): Promise<IWallet>;
  validateWalletAddress(address: string): boolean;
}