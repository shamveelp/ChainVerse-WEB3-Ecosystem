import API from "@/lib/api-client"

export interface WalletConnection {
  address: string
  balance: string
  network: {
    id: number
    name: string
    symbol: string
  }
}

// Declare ethereum type for window
declare global {
  interface Window {
    ethereum?: {
      request: (args: { method: string; params?: any[] }) => Promise<any>
      on: (event: string, callback: (data: any) => void) => void
      removeListener: (event: string, callback: (data: any) => void) => void
      isMetaMask?: boolean
      selectedAddress?: string
    }
  }
}

// Debug function to check MetaMask status
export const debugMetaMask = () => {
  console.log('=== MetaMask Debug Info ===')
  console.log('window.ethereum exists:', !!window.ethereum)
  console.log('window.ethereum.isMetaMask:', window.ethereum?.isMetaMask)
  console.log('window.ethereum.selectedAddress:', window.ethereum?.selectedAddress)
  console.log('User agent:', navigator.userAgent)
  console.log('Is mobile:', /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent))
  console.log('========================')
}

export const connectWallet = async (): Promise<WalletConnection> => {
  try {
    console.log('🔄 Starting wallet connection...')
    
    // Debug MetaMask status
    debugMetaMask()

    // Check if we're in a browser environment
    if (typeof window === 'undefined') {
      throw new Error('Not in browser environment')
    }

    // Check if MetaMask is installed
    if (!window.ethereum) {
      console.error('❌ MetaMask not detected')
      throw new Error('MetaMask is not installed. Please install MetaMask extension.')
    }

    if (!window.ethereum.isMetaMask) {
      console.error('❌ Not MetaMask provider')
      throw new Error('Please use MetaMask wallet')
    }

    console.log('✅ MetaMask detected, requesting accounts...')

    // Request account access with timeout
    const accountsPromise = window.ethereum.request({
      method: 'eth_requestAccounts'
    })

    // Add timeout to prevent hanging
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Connection timeout. Please try again.')), 30000)
    })

    const accounts = await Promise.race([accountsPromise, timeoutPromise]) as string[]

    console.log('📝 Accounts received:', accounts)

    if (!accounts || accounts.length === 0) {
      throw new Error('No accounts found. Please unlock MetaMask and try again.')
    }

    const address = accounts[0]
    console.log('🔑 Using address:', address)

    // Get balance with error handling
    let balanceInEth = '0.0000'
    try {
      console.log('💰 Getting balance...')
      const balance = await window.ethereum.request({
        method: 'eth_getBalance',
        params: [address, 'latest']
      })
      balanceInEth = (parseInt(balance, 16) / Math.pow(10, 18)).toFixed(4)
      console.log('✅ Balance retrieved:', balanceInEth, 'ETH')
    } catch (balanceError) {
      console.warn('⚠️ Failed to get balance:', balanceError)
      // Continue without balance - we can get it later
    }

    // Get network info with error handling
    let networkInfo = { id: 1, name: 'Ethereum Mainnet', symbol: 'ETH' }
    try {
      console.log('🌐 Getting network info...')
      const chainId = await window.ethereum.request({
        method: 'eth_chainId'
      })
      console.log('📡 Chain ID:', chainId)

      const networkMap: { [key: string]: { name: string; symbol: string } } = {
        '0x1': { name: 'Ethereum Mainnet', symbol: 'ETH' },
        '0x89': { name: 'Polygon', symbol: 'MATIC' },
        '0x38': { name: 'BSC', symbol: 'BNB' },
        '0xa86a': { name: 'Avalanche', symbol: 'AVAX' },
        '0xaa36a7': { name: 'Sepolia Testnet', symbol: 'ETH' },
        '0x13881': { name: 'Mumbai Testnet', symbol: 'MATIC' }
      }

      const network = networkMap[chainId] || { name: 'Unknown Network', symbol: 'ETH' }
      networkInfo = {
        id: parseInt(chainId, 16),
        name: network.name,
        symbol: network.symbol
      }
      console.log('✅ Network info:', networkInfo)
    } catch (networkError) {
      console.warn('⚠️ Failed to get network info:', networkError)
      // Continue with default network
    }

    // Save wallet to backend (non-blocking)
    try {
      console.log('💾 Saving wallet to backend...')
      await saveWalletToBackend(address)
      console.log('✅ Wallet saved to backend')
    } catch (backendError) {
      console.warn('⚠️ Failed to save to backend:', backendError)
      // Don't fail the connection if backend save fails
    }

    const result = {
      address,
      balance: balanceInEth,
      network: networkInfo
    }

    console.log('🎉 Wallet connection successful:', result)
    return result

  } catch (error: any) {
    console.error('❌ Wallet connection error:', error)
    
    // Provide specific error messages
    if (error.code === 4001) {
      throw new Error('Connection rejected. Please approve the connection in MetaMask.')
    } else if (error.code === -32002) {
      throw new Error('Connection request pending. Please check MetaMask.')
    } else if (error.message.includes('timeout')) {
      throw new Error('Connection timeout. Please try again.')
    } else {
      throw new Error(error.message || 'Failed to connect wallet. Please try again.')
    }
  }
}

export const saveWalletToBackend = async (walletAddress: string) => {
  try {
    const response = await API.post('/api/wallet/connect', {
      walletAddress
    })
    return {
      success: true,
      wallet: response.data.wallet,
      message: response.data.message
    }
  } catch (error: any) {
    console.error('Save wallet error:', error.response?.data || error.message)
    return {
      success: false,
      error: error.response?.data?.error || error.response?.data?.message || error.message || 'Failed to save wallet'
    }
  }
}

export const getWalletBalance = async (address: string): Promise<string> => {
  try {
    if (!window.ethereum) {
      throw new Error('MetaMask is not installed')
    }

    const balance = await window.ethereum.request({
      method: 'eth_getBalance',
      params: [address, 'latest']
    })

    return (parseInt(balance, 16) / Math.pow(10, 18)).toFixed(4)
  } catch (error: any) {
    console.error('Get balance error:', error)
    throw new Error(error.message || 'Failed to get balance')
  }
}

// Check if wallet is connected
export const checkWalletConnection = async (): Promise<boolean> => {
  try {
    if (!window.ethereum) {
      return false
    }

    const accounts = await window.ethereum.request({
      method: 'eth_accounts'
    })

    return accounts && accounts.length > 0
  } catch (error) {
    console.error('Check wallet connection error:', error)
    return false
  }
}

// Add event listeners for account and network changes
export const setupWalletListeners = (
  onAccountChange: (accounts: string[]) => void,
  onNetworkChange: (chainId: string) => void
) => {
  if (typeof window !== 'undefined' && window.ethereum) {
    window.ethereum.on('accountsChanged', onAccountChange)
    window.ethereum.on('chainChanged', onNetworkChange)
  }
}

export const removeWalletListeners = (
  onAccountChange: (accounts: string[]) => void,
  onNetworkChange: (chainId: string) => void
) => {
  if (typeof window !== 'undefined' && window.ethereum) {
    window.ethereum.removeListener('accountsChanged', onAccountChange)
    window.ethereum.removeListener('chainChanged', onNetworkChange)
  }
}

// Switch network
export const switchNetwork = async (chainId: string) => {
  try {
    if (!window.ethereum) {
      throw new Error('MetaMask is not installed')
    }

    await window.ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId }]
    })

    return {
      success: true,
      message: 'Network switched successfully'
    }
  } catch (error: any) {
    console.error('Switch network error:', error)
    return {
      success: false,
      error: error.message || 'Failed to switch network'
    }
  }
}

// Get all wallet-related API functions
export const getWalletByAddress = async (address: string) => {
  try {
    const response = await API.get(`/api/wallet/address/${address}`)
    return {
      success: true,
      wallet: response.data.wallet,
      message: response.data.message
    }
  } catch (error: any) {
    console.error('Get wallet error:', error.response?.data || error.message)
    return {
      success: false,
      error: error.response?.data?.error || error.response?.data?.message || error.message || 'Failed to get wallet'
    }
  }
}

export const getAllWallets = async () => {
  try {
    const response = await API.get('/api/wallet/all')
    return {
      success: true,
      wallets: response.data.wallets,
      count: response.data.count,
      message: response.data.message
    }
  } catch (error: any) {
    console.error('Get all wallets error:', error.response?.data || error.message)
    return {
      success: false,
      error: error.response?.data?.error || error.response?.data?.message || error.message || 'Failed to get wallets'
    }
  }
}

export const updateWallet = async (id: string, data: any) => {
  try {
    const response = await API.put(`/api/wallet/${id}`, data)
    return {
      success: true,
      wallet: response.data.wallet,
      message: response.data.message
    }
  } catch (error: any) {
    console.error('Update wallet error:', error.response?.data || error.message)
    return {
      success: false,
      error: error.response?.data?.error || error.response?.data?.message || error.message || 'Failed to update wallet'
    }
  }
}

export const deleteWallet = async (id: string) => {
  try {
    const response = await API.delete(`/api/wallet/${id}`)
    return {
      success: true,
      message: response.data.message
    }
  } catch (error: any) {
    console.error('Delete wallet error:', error.response?.data || error.message)
    return {
      success: false,
      error: error.response?.data?.error || error.response?.data?.message || error.message || 'Failed to delete wallet'
    }
  }
}

export const disconnectWallet = async (walletAddress: string) => {
  try {
    const response = await API.post('/api/wallet/disconnect', {
      walletAddress
    })
    return {
      success: true,
      message: response.data.message
    }
  } catch (error: any) {
    console.error('Disconnect wallet error:', error.response?.data || error.message)
    return {
      success: false,
      error: error.response?.data?.error || error.response?.data?.message || error.message || 'Failed to disconnect wallet'
    }
  }
}

export const getWalletStats = async () => {
  try {
    const response = await API.get('/api/wallet/stats')
    return {
      success: true,
      stats: response.data.stats,
      message: response.data.message
    }
  } catch (error: any) {
    console.error('Get wallet stats error:', error.response?.data || error.message)
    return {
      success: false,
      error: error.response?.data?.error || error.response?.data?.message || error.message || 'Failed to get wallet stats'
    }
  }
}
