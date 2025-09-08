'use client';

import { useAccount } from 'wagmi';
import { ProfileGrid } from '@/components/trade/ProfileGrid';
import { WalletConnection } from '@/components/trade/WalletConnection';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { User, Wallet, ExternalLink } from 'lucide-react';

export default function ProfilePage() {
  const { address, isConnected } = useAccount();

  if (!isConnected) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center space-y-6">
          <div className="w-20 h-20 bg-gray-800/50 rounded-full flex items-center justify-center mx-auto">
            <Wallet className="w-10 h-10 text-gray-400" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Connect Your Wallet</h1>
            <p className="text-gray-400 mb-6">
              Connect your wallet to view and manage your NFT collection
            </p>
            <WalletConnection />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Profile Header */}
      <div className="mb-12">
        <div className="bg-gradient-to-r from-purple-600/20 to-blue-600/20 rounded-2xl border border-white/10 p-8">
          <div className="flex items-center gap-6">
            <div className="w-20 h-20 bg-gradient-to-br from-purple-600 to-blue-600 rounded-full flex items-center justify-center">
              <User className="w-10 h-10 text-white" />
            </div>
            
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-white mb-2">My Collection</h1>
              <div className="flex items-center gap-3">
                <Badge variant="outline" className="border-purple-400/30 text-purple-400">
                  {address?.slice(0, 6)}...{address?.slice(-4)}
                </Badge>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => window.open(`https://sepolia.etherscan.io/address/${address}`, '_blank')}
                  className="text-gray-400 hover:text-white"
                >
                  <ExternalLink className="w-4 h-4 mr-1" />
                  View on Etherscan
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Profile Content */}
      <ProfileGrid />
    </div>
  );
}