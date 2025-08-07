import { IWallet, IWalletRepository } from '../core/interfaces/wallet.interface'
import WalletModel from '../models/wallet.model'

export class WalletRepository implements IWalletRepository {
  async create(walletAddress: string): Promise<IWallet> {
    try {
      const wallet = new WalletModel({
        walletAddress: walletAddress.toLowerCase()
      })
      
      const savedWallet = await wallet.save()
      return savedWallet.toObject()
    } catch (error: any) {
      throw new Error(`Failed to create wallet: ${error.message}`)
    }
  }

  async findByAddress(walletAddress: string): Promise<IWallet | null> {
    try {
      const wallet = await WalletModel.findOne({ 
        walletAddress: walletAddress.toLowerCase() 
      }).lean()
      
      return wallet
    } catch (error: any) {
      throw new Error(`Failed to find wallet: ${error.message}`)
    }
  }

  async findAll(): Promise<IWallet[]> {
    try {
      const wallets = await WalletModel.find({}).lean()
      return wallets
    } catch (error: any) {
      throw new Error(`Failed to fetch wallets: ${error.message}`)
    }
  }

  async update(id: string, data: Partial<IWallet>): Promise<IWallet | null> {
    try {
      const updatedWallet = await WalletModel.findByIdAndUpdate(
        id,
        { ...data, updatedAt: new Date() },
        { new: true, runValidators: true }
      ).lean()
      
      return updatedWallet
    } catch (error: any) {
      throw new Error(`Failed to update wallet: ${error.message}`)
    }
  }

  async delete(id: string): Promise<boolean> {
    try {
      const result = await WalletModel.findByIdAndDelete(id)
      return !!result
    } catch (error: any) {
      throw new Error(`Failed to delete wallet: ${error.message}`)
    }
  }

  async findById(id: string): Promise<IWallet | null> {
    try {
      const wallet = await WalletModel.findById(id).lean()
      return wallet
    } catch (error: any) {
      throw new Error(`Failed to find wallet by ID: ${error.message}`)
    }
  }

  async countWallets(): Promise<number> {
    try {
      const count = await WalletModel.countDocuments()
      return count
    } catch (error: any) {
      throw new Error(`Failed to count wallets: ${error.message}`)
    }
  }

  async findRecentWallets(limit: number = 10): Promise<IWallet[]> {
    try {
      const wallets = await WalletModel.find({})
        .sort({ createdAt: -1 })
        .limit(limit)
        .lean()
      
      return wallets
    } catch (error: any) {
      throw new Error(`Failed to fetch recent wallets: ${error.message}`)
    }
  }
}
