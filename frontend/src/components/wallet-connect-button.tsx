"use client"

import { Button } from "@/components/ui/button"
import { Wallet, Loader2, AlertTriangle } from 'lucide-react'
import { useWallet } from "@/hooks/use-wallet"
import { useAppDispatch } from "@/redux/hooks"
import { openWallet } from "@/redux/slices/walletSlice"
import { useState } from 'react'

interface WalletConnectButtonProps {
  className?: string
  variant?: "default" | "outline" | "ghost"
  showDebug?: boolean
}

export default function WalletConnectButton({ 
  className = "", 
  variant = "default",
  showDebug = false
}: WalletConnectButtonProps) {
  const { isConnected, address, loading, connect } = useWallet()
  const dispatch = useAppDispatch()
  const [error, setError] = useState<string | null>(null)

  const handleClick = async () => {
    setError(null)
    
    if (isConnected) {
      dispatch(openWallet())
    } else {
      try {
        await connect()
      } catch (err: any) {
        setError(err.message)
        console.error('Connection failed:', err)
      }
    }
  }

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`
  }

  // Check if MetaMask is installed
  const isMetaMaskInstalled = typeof window !== 'undefined' && !!window.ethereum?.isMetaMask

  if (!isMetaMaskInstalled && typeof window !== 'undefined') {
    return (
      <Button
        onClick={() => window.open('https://metamask.io/download/', '_blank')}
        variant="outline"
        className={`${className} border-orange-500 text-orange-500 hover:bg-orange-500 hover:text-white`}
      >
        <AlertTriangle className="w-4 h-4 mr-2" />
        Install MetaMask
      </Button>
    )
  }

  return (
    <div className="flex flex-col gap-2">
      <Button
        onClick={handleClick}
        disabled={loading}
        variant={variant}
        className={`${className} ${
          variant === "default" 
            ? "bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600 text-white"
            : ""
        }`}
      >
        {loading ? (
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
        ) : (
          <Wallet className="w-4 h-4 mr-2" />
        )}
        {loading 
          ? "Connecting..." 
          : isConnected 
            ? formatAddress(address!) 
            : "Connect Wallet"
        }
      </Button>
      
      {error && (
        <div className="text-xs text-red-400 bg-red-900/20 p-2 rounded">
          {error}
        </div>
      )}
      
      {showDebug && (
        <div className="text-xs text-slate-400">
          MetaMask: {isMetaMaskInstalled ? '✅' : '❌'} | 
          Connected: {isConnected ? '✅' : '❌'}
        </div>
      )}
    </div>
  )
}
