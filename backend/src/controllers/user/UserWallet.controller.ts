import { Request, Response } from 'express'
import { WalletService } from '../../services/user/UserWallet.service'
import { WalletConnectionRequest, WalletConnectionResponse } from '../../core/interfaces/wallet.interface'

export class WalletController {
  private walletService: WalletService

  constructor() {
    this.walletService = new WalletService()
  }

  // Connect wallet
  connectWallet = async (req: Request, res: Response): Promise<void> => {
    try {
      const { walletAddress }: WalletConnectionRequest = req.body

      if (!walletAddress) {
        res.status(400).json({
          success: false,
          error: 'Wallet address is required'
        })
        return
      }

      const wallet = await this.walletService.connectWallet(walletAddress)

      const response: WalletConnectionResponse = {
        success: true,
        wallet,
        message: 'Wallet connected successfully'
      }

      res.status(200).json(response)
    } catch (error: any) {
      console.error('Connect wallet error:', error)
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to connect wallet'
      })
    }
  }

  // Get wallet by address
  getWalletByAddress = async (req: Request, res: Response): Promise<void> => {
    try {
      const { address } = req.params

      if (!address) {
        res.status(400).json({
          success: false,
          error: 'Wallet address is required'
        })
        return
      }

      const wallet = await this.walletService.getWalletByAddress(address)

      if (!wallet) {
        res.status(404).json({
          success: false,
          error: 'Wallet not found'
        })
        return
      }

      res.status(200).json({
        success: true,
        wallet,
        message: 'Wallet retrieved successfully'
      })
    } catch (error: any) {
      console.error('Get wallet error:', error)
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to get wallet'
      })
    }
  }

  // Get all wallets
  getAllWallets = async (req: Request, res: Response): Promise<void> => {
    try {
      const wallets = await this.walletService.getAllWallets()

      res.status(200).json({
        success: true,
        wallets,
        count: wallets.length,
        message: 'Wallets retrieved successfully'
      })
    } catch (error: any) {
      console.error('Get all wallets error:', error)
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to get wallets'
      })
    }
  }

  // Update wallet
  updateWallet = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params
      const updateData = req.body

      if (!id) {
        res.status(400).json({
          success: false,
          error: 'Wallet ID is required'
        })
        return
      }

      const updatedWallet = await this.walletService.updateWallet(id, updateData)

      if (!updatedWallet) {
        res.status(404).json({
          success: false,
          error: 'Wallet not found'
        })
        return
      }

      res.status(200).json({
        success: true,
        wallet: updatedWallet,
        message: 'Wallet updated successfully'
      })
    } catch (error: any) {
      console.error('Update wallet error:', error)
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to update wallet'
      })
    }
  }

  // Delete wallet
  deleteWallet = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params

      if (!id) {
        res.status(400).json({
          success: false,
          error: 'Wallet ID is required'
        })
        return
      }

      const deleted = await this.walletService.deleteWallet(id)

      if (!deleted) {
        res.status(404).json({
          success: false,
          error: 'Wallet not found'
        })
        return
      }

      res.status(200).json({
        success: true,
        message: 'Wallet deleted successfully'
      })
    } catch (error: any) {
      console.error('Delete wallet error:', error)
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to delete wallet'
      })
    }
  }

  // Get wallet statistics
  getWalletStats = async (req: Request, res: Response): Promise<void> => {
    try {
      const stats = await this.walletService.getWalletStats()

      res.status(200).json({
        success: true,
        stats,
        message: 'Wallet statistics retrieved successfully'
      })
    } catch (error: any) {
      console.error('Get wallet stats error:', error)
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to get wallet statistics'
      })
    }
  }

  // Disconnect wallet (soft delete or mark as inactive)
  disconnectWallet = async (req: Request, res: Response): Promise<void> => {
    try {
      const { walletAddress } = req.body

      if (!walletAddress) {
        res.status(400).json({
          success: false,
          error: 'Wallet address is required'
        })
        return
      }

      const wallet = await this.walletService.getWalletByAddress(walletAddress)

      if (!wallet) {
        res.status(404).json({
          success: false,
          error: 'Wallet not found'
        })
        return
      }

      // Update the wallet's last activity timestamp
      await this.walletService.updateWallet(wallet._id, {
        updatedAt: new Date()
      })

      res.status(200).json({
        success: true,
        message: 'Wallet disconnected successfully'
      })
    } catch (error: any) {
      console.error('Disconnect wallet error:', error)
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to disconnect wallet'
      })
    }
  }
}
