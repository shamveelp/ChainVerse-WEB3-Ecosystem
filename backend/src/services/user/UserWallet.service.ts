import { IWallet, IWalletService } from '../../core/interfaces/wallet.interface'
import { WalletRepository } from '../../repositories/wallet.repository'

export class WalletService implements IWalletService {
  private walletRepository: WalletRepository

  constructor() {
    this.walletRepository = new WalletRepository()
  }

  async connectWallet(walletAddress: string): Promise<IWallet> {
    try {
      // Validate wallet address format
      if (!this.isValidWalletAddress(walletAddress)) {
        throw new Error('Invalid wallet address format')
      }

      // Check if wallet already exists
      const existingWallet = await this.walletRepository.findByAddress(walletAddress)
      
      if (existingWallet) {
        // Update the existing wallet's timestamp
        const updatedWallet = await this.walletRepository.update(
          existingWallet._id,
          { updatedAt: new Date() }
        )
        
        if (!updatedWallet) {
          throw new Error('Failed to update existing wallet')
        }
        
        return updatedWallet
      }

      // Create new wallet
      const newWallet = await this.walletRepository.create(walletAddress)
      return newWallet
    } catch (error: any) {
      throw new Error(`Wallet connection failed: ${error.message}`)
    }
  }

  async getWalletByAddress(walletAddress: string): Promise<IWallet | null> {
    try {
      if (!this.isValidWalletAddress(walletAddress)) {
        throw new Error('Invalid wallet address format')
      }

      return await this.walletRepository.findByAddress(walletAddress)
    } catch (error: any) {
      throw new Error(`Failed to get wallet: ${error.message}`)
    }
  }

  async getAllWallets(): Promise<IWallet[]> {
    try {
      return await this.walletRepository.findAll()
    } catch (error: any) {
      throw new Error(`Failed to get all wallets: ${error.message}`)
    }
  }

  async updateWallet(id: string, data: Partial<IWallet>): Promise<IWallet | null> {
    try {
      // Validate wallet address if it's being updated
      if (data.walletAddress && !this.isValidWalletAddress(data.walletAddress)) {
        throw new Error('Invalid wallet address format')
      }

      return await this.walletRepository.update(id, data)
    } catch (error: any) {
      throw new Error(`Failed to update wallet: ${error.message}`)
    }
  }

  async deleteWallet(id: string): Promise<boolean> {
    try {
      return await this.walletRepository.delete(id)
    } catch (error: any) {
      throw new Error(`Failed to delete wallet: ${error.message}`)
    }
  }

  async getWalletStats(): Promise<{
    totalWallets: number
    recentWallets: IWallet[]
  }> {
    try {
      const [totalWallets, recentWallets] = await Promise.all([
        this.walletRepository.countWallets(),
        this.walletRepository.findRecentWallets(5)
      ])

      return {
        totalWallets,
        recentWallets
      }
    } catch (error: any) {
      throw new Error(`Failed to get wallet stats: ${error.message}`)
    }
  }

  private isValidWalletAddress(address: string): boolean {
    // Basic Ethereum address validation
    const ethereumAddressRegex = /^0x[a-fA-F0-9]{40}$/
    return ethereumAddressRegex.test(address)
  }

  private formatWalletAddress(address: string): string {
    return address.toLowerCase()
  }
}
