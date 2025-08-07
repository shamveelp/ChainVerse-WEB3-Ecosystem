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

export const connectWallet = async (): Promise<WalletConnection> => {
  try {
    // Check if MetaMask is installed
    if (typeof window.ethereum === 'undefined') {
      throw new Error('MetaMask is not installed')
    }

    // Request account access
    const accounts = await window.ethereum.request({
      method: 'eth_requestAccounts'
    })

    if (!accounts || accounts.length === 0) {
      throw new Error('No accounts found')
    }

    const address = accounts[0]

    // Get balance
    const balance = await window.ethereum.request({
      method: 'eth_getBalance',
      params: [address, 'latest']
    })

    // Convert balance from wei to ETH
    const balanceInEth = (parseInt(balance, 16) / Math.pow(10, 18)).toFixed(4)

    // Get network info
    const chainId = await window.ethereum.request({
      method: 'eth_chainId'
    })

    const networkMap: { [key: string]: { name: string; symbol: string } } = {
      '0x1': { name: 'Ethereum', symbol: 'ETH' },
      '0x38': { name: 'BSC', symbol: 'BNB' },
      '0x89': { name: 'Polygon', symbol: 'MATIC' },
      '0xa86a': { name: 'Avalanche', symbol: 'AVAX' }
    }

    const network = networkMap[chainId] || { name: 'Unknown', symbol: 'ETH' }

    // Save wallet to backend
    await saveWalletToBackend(address)

    return {
      address,
      balance: balanceInEth,
      network: {
        id: parseInt(chainId, 16),
        name: network.name,
        symbol: network.symbol
      }
    }
  } catch (error: any) {
    console.error('Wallet connection error:', error)
    throw new Error(error.message || 'Failed to connect wallet')
  }
}

export const saveWalletToBackend = async (walletAddress: string) => {
  try {
    const response = await API.post('/api/wallet/connect', {
      walletAddress
    })
    return response.data
  } catch (error: any) {
    console.error('Save wallet error:', error)
    throw error
  }
}

export const getWalletBalance = async (address: string): Promise<string> => {
  try {
    if (typeof window.ethereum === 'undefined') {
      throw new Error('MetaMask is not installed')
    }

    const balance = await window.ethereum.request({
      method: 'eth_getBalance',
      params: [address, 'latest']
    })

    return (parseInt(balance, 16) / Math.pow(10, 18)).toFixed(4)
  } catch (error: any) {
    console.error('Get balance error:', error)
    throw error
  }
}

// Add event listeners for account and network changes
export const setupWalletListeners = (
  onAccountChange: (accounts: string[]) => void,
  onNetworkChange: (chainId: string) => void
) => {
  if (typeof window.ethereum !== 'undefined') {
    window.ethereum.on('accountsChanged', onAccountChange)
    window.ethereum.on('chainChanged', onNetworkChange)
  }
}

export const removeWalletListeners = (
  onAccountChange: (accounts: string[]) => void,
  onNetworkChange: (chainId: string) => void
) => {
  if (typeof window.ethereum !== 'undefined') {
    window.ethereum.removeListener('accountsChanged', onAccountChange)
    window.ethereum.removeListener('chainChanged', onNetworkChange)
  }
}
