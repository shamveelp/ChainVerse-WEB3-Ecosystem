import API from "@/lib/axios"
import { USER_API_ROUTES } from "@/routes"

// Simple wallet connection
export const connectWallet = async () => {
  try {
    // Check if MetaMask is installed
    if (!window.ethereum) {
      throw new Error('Please install MetaMask')
    }

    // Request account access
    const accounts = await window.ethereum.request({
      method: 'eth_requestAccounts'
    })

    if (!accounts || accounts.length === 0) {
      throw new Error('No accounts found')
    }

    const walletAddress = accounts[0]

    // Save to database
    await API.post(USER_API_ROUTES.WALLET, { walletAddress })

    return {
      success: true,
      walletAddress
    }
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Failed to connect wallet'
    }
  }
}

// Simple wallet disconnection
export const disconnectWallet = () => {
  return {
    success: true,
    message: 'Wallet disconnected'
  }
}
