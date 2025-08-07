export interface IWallet {
  _id: string
  walletAddress: string
  createdAt: Date
  updatedAt: Date
}

export interface IWalletRepository {
  create(walletAddress: string): Promise<IWallet>
  findByAddress(walletAddress: string): Promise<IWallet | null>
  findAll(): Promise<IWallet[]>
  update(id: string, data: Partial<IWallet>): Promise<IWallet | null>
  delete(id: string): Promise<boolean>
}

export interface IWalletService {
  connectWallet(walletAddress: string): Promise<IWallet>
  getWalletByAddress(walletAddress: string): Promise<IWallet | null>
  getAllWallets(): Promise<IWallet[]>
  updateWallet(id: string, data: Partial<IWallet>): Promise<IWallet | null>
  deleteWallet(id: string): Promise<boolean>
}

export interface WalletConnectionRequest {
  walletAddress: string
}

export interface WalletConnectionResponse {
  success: boolean
  wallet: IWallet
  message: string
}
