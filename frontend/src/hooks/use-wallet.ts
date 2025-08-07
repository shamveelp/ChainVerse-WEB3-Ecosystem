"use client"

import { useEffect, useCallback } from 'react'
import { useAppDispatch, useAppSelector } from '@/redux/hooks'
import { 
  connectWallet as connectWalletAction, 
  disconnectWallet, 
  setLoading, 
  updateBalance 
} from '@/redux/slices/walletSlice'
import { 
  connectWallet, 
  getWalletBalance, 
  setupWalletListeners, 
  removeWalletListeners,
  checkWalletConnection
} from '@/services/walletApiService'

export const useWallet = () => {
  const dispatch = useAppDispatch()
  const { isConnected, address, balance, loading } = useAppSelector((state) => state.wallet)

  const handleConnect = useCallback(async () => {
    try {
      dispatch(setLoading(true))
      const walletData = await connectWallet()
      
      dispatch(connectWalletAction({
        address: walletData.address,
        balance: walletData.balance
      }))
    } catch (error: any) {
      console.error('Wallet connection failed:', error)
      alert(error.message || 'Failed to connect wallet')
    } finally {
      dispatch(setLoading(false))
    }
  }, [dispatch])

  const handleDisconnect = useCallback(() => {
    dispatch(disconnectWallet())
  }, [dispatch])

  const refreshBalance = useCallback(async () => {
    if (!address) return
    
    try {
      const newBalance = await getWalletBalance(address)
      dispatch(updateBalance(newBalance))
    } catch (error) {
      console.error('Failed to refresh balance:', error)
    }
  }, [address, dispatch])

  // Handle account changes
  const handleAccountChange = useCallback((accounts: string[]) => {
    if (accounts.length === 0) {
      dispatch(disconnectWallet())
    } else if (accounts[0] !== address) {
      // Account changed, reconnect
      handleConnect()
    }
  }, [address, dispatch, handleConnect])

  // Handle network changes
  const handleNetworkChange = useCallback((chainId: string) => {
    // Refresh balance when network changes
    refreshBalance()
  }, [refreshBalance])

  // Check if wallet is already connected on mount
  useEffect(() => {
    const checkConnection = async () => {
      if (!isConnected) {
        const connected = await checkWalletConnection()
        if (connected) {
          handleConnect()
        }
      }
    }
    
    checkConnection()
  }, [isConnected, handleConnect])

  // Setup wallet event listeners
  useEffect(() => {
    if (isConnected) {
      setupWalletListeners(handleAccountChange, handleNetworkChange)
      
      return () => {
        removeWalletListeners(handleAccountChange, handleNetworkChange)
      }
    }
  }, [isConnected, handleAccountChange, handleNetworkChange])

  // Auto-refresh balance periodically
  useEffect(() => {
    if (isConnected && address) {
      const interval = setInterval(refreshBalance, 30000) // Refresh every 30 seconds
      
      return () => clearInterval(interval)
    }
  }, [isConnected, address, refreshBalance])

  return {
    isConnected,
    address,
    balance,
    loading,
    connect: handleConnect,
    disconnect: handleDisconnect,
    refreshBalance
  }
}
