"use client"

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { debugMetaMask, checkWalletConnection } from '@/services/walletApiService'
import { AlertCircle, CheckCircle, Info, RefreshCw } from 'lucide-react'

export default function WalletDebug() {
  const [debugInfo, setDebugInfo] = useState<any>(null)
  const [isChecking, setIsChecking] = useState(false)

  const runDiagnostics = async () => {
    setIsChecking(true)
    
    const info = {
      timestamp: new Date().toISOString(),
      browser: {
        userAgent: navigator.userAgent,
        isMobile: /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent),
        isHttps: window.location.protocol === 'https:',
        domain: window.location.hostname
      },
      ethereum: {
        exists: !!window.ethereum,
        isMetaMask: window.ethereum?.isMetaMask,
        selectedAddress: window.ethereum?.selectedAddress,
        chainId: null,
        accounts: null,
        networkVersion: null
      },
      connection: {
        isConnected: false,
        error: null
      }
    }

    // Check MetaMask specific info
    if (window.ethereum) {
      try {
        // Get chain ID
        info.ethereum.chainId = await window.ethereum.request({ method: 'eth_chainId' })
        
        // Get accounts (won't prompt)
        info.ethereum.accounts = await window.ethereum.request({ method: 'eth_accounts' })
        
        // Check connection status
        info.connection.isConnected = await checkWalletConnection()
      } catch (error: any) {
        info.connection.error = error.message
      }
    }

    console.log('🔍 Wallet Diagnostics:', info)
    setDebugInfo(info)
    setIsChecking(false)
  }

  const getStatusBadge = (condition: boolean, trueText: string, falseText: string) => {
    return (
      <Badge variant={condition ? "default" : "destructive"} className="ml-2">
        {condition ? (
          <CheckCircle className="w-3 h-3 mr-1" />
        ) : (
          <AlertCircle className="w-3 h-3 mr-1" />
        )}
        {condition ? trueText : falseText}
      </Badge>
    )
  }

  return (
    <Card className="p-6 bg-slate-800 border-slate-700 text-white">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Info className="w-5 h-5" />
          Wallet Connection Diagnostics
        </h3>
        <Button 
          onClick={runDiagnostics} 
          disabled={isChecking}
          variant="outline"
          size="sm"
        >
          {isChecking ? (
            <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <RefreshCw className="w-4 h-4 mr-2" />
          )}
          Run Diagnostics
        </Button>
      </div>

      {debugInfo && (
        <div className="space-y-4">
          {/* Browser Info */}
          <div>
            <h4 className="font-medium mb-2">Browser Environment</h4>
            <div className="space-y-1 text-sm">
              <div className="flex items-center">
                HTTPS: {getStatusBadge(debugInfo.browser.isHttps, "Secure", "Not Secure")}
              </div>
              <div className="flex items-center">
                Mobile: {getStatusBadge(!debugInfo.browser.isMobile, "Desktop", "Mobile")}
              </div>
              <div className="text-slate-400">
                Domain: {debugInfo.browser.domain}
              </div>
            </div>
          </div>

          {/* MetaMask Info */}
          <div>
            <h4 className="font-medium mb-2">MetaMask Status</h4>
            <div className="space-y-1 text-sm">
              <div className="flex items-center">
                Installed: {getStatusBadge(debugInfo.ethereum.exists, "Yes", "No")}
              </div>
              <div className="flex items-center">
                Is MetaMask: {getStatusBadge(debugInfo.ethereum.isMetaMask, "Yes", "No")}
              </div>
              <div className="flex items-center">
                Connected: {getStatusBadge(debugInfo.connection.isConnected, "Yes", "No")}
              </div>
              {debugInfo.ethereum.selectedAddress && (
                <div className="text-slate-400">
                  Address: {debugInfo.ethereum.selectedAddress}
                </div>
              )}
              {debugInfo.ethereum.chainId && (
                <div className="text-slate-400">
                  Chain ID: {debugInfo.ethereum.chainId}
                </div>
              )}
            </div>
          </div>

          {/* Connection Issues */}
          {debugInfo.connection.error && (
            <div>
              <h4 className="font-medium mb-2 text-red-400">Connection Error</h4>
              <div className="text-sm text-red-300 bg-red-900/20 p-2 rounded">
                {debugInfo.connection.error}
              </div>
            </div>
          )}

          {/* Recommendations */}
          <div>
            <h4 className="font-medium mb-2">Recommendations</h4>
            <div className="space-y-1 text-sm text-slate-300">
              {!debugInfo.ethereum.exists && (
                <div>• Install MetaMask browser extension</div>
              )}
              {!debugInfo.browser.isHttps && (
                <div>• Use HTTPS for secure connection</div>
              )}
              {debugInfo.browser.isMobile && (
                <div>• Use MetaMask mobile app or desktop browser</div>
              )}
              {debugInfo.ethereum.exists && !debugInfo.connection.isConnected && (
                <div>• Unlock MetaMask and try connecting again</div>
              )}
            </div>
          </div>
        </div>
      )}

      {!debugInfo && (
        <div className="text-center text-slate-400 py-8">
          Click "Run Diagnostics" to check your wallet connection setup
        </div>
      )}
    </Card>
  )
}
