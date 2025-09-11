'use client';

import { useState } from 'react';
import { useAccount, useChainId } from 'wagmi';
import { MarketplaceGrid } from '@/components/trade/MarketPlaceGrid';
import { SearchBar } from '@/components/trade/SearchBar';
import { Button } from '@/components/ui/button';
import { MintNFTModal } from '@/components/trade/MintNFTModal';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { TrendingUp, Users, Zap, Plus, Network, Info } from 'lucide-react';
import { sepolia, baseSepolia, bscTestnet } from 'wagmi/chains';

const getChainInfo = (chainId: number) => {
  switch (chainId) {
    case sepolia.id:
      return { name: 'Sepolia', icon: '🔷', color: 'text-blue-400' };
    case baseSepolia.id:
      return { name: 'Base Sepolia', icon: '🔵', color: 'text-indigo-400' };
    case bscTestnet.id:
      return { name: 'BSC Testnet', icon: '🟡', color: 'text-yellow-400' };
    default:
      return { name: 'Unknown', icon: '❓', color: 'text-gray-400' };
  }
};

export default function MarketplacePage() {
  const { isConnected } = useAccount();
  const chainId = useChainId();
  const [searchTerm, setSearchTerm] = useState('');
  const [mintModalOpen, setMintModalOpen] = useState(false);

  const chainInfo = getChainInfo(chainId);

  return (
    <>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-8">
        {/* Network Info Banner */}
        <Card className="mb-8 bg-gradient-to-r from-blue-600/10 to-purple-600/10 border-blue-400/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-600/20 rounded-full flex items-center justify-center">
                  <Network className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <p className="text-white font-medium">
                    Connected to {chainInfo.icon} {chainInfo.name}
                  </p>
                  <p className="text-sm text-gray-400">
                    Multi-chain NFT marketplace with cross-chain support
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-400">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                Network Active
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Hero Section */}
        <div className="text-center mb-12 space-y-6">
          <div className="space-y-4">
            <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent leading-tight">
              Discover, Create, Trade
            </h1>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
              The premier multi-chain NFT marketplace. Mint unique digital assets, 
              discover amazing collections, and trade with confidence across multiple networks.
            </p>
          </div>

          <div className="flex flex-wrap justify-center gap-8 py-8">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-purple-600/20 rounded-full flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-purple-400" />
              </div>
              <div className="text-left">
                <p className="text-2xl font-bold text-white">Multi-Chain</p>
                <p className="text-sm text-gray-400">Cross-chain Trading</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-blue-600/20 rounded-full flex items-center justify-center">
                <Users className="w-6 h-6 text-blue-400" />
              </div>
              <div className="text-left">
                <p className="text-2xl font-bold text-white">Secure</p>
                <p className="text-sm text-gray-400">Trusted Platform</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-green-600/20 rounded-full flex items-center justify-center">
                <Zap className="w-6 h-6 text-green-400" />
              </div>
              <div className="text-left">
                <p className="text-2xl font-bold text-white">24/7</p>
                <p className="text-sm text-gray-400">Instant Trading</p>
              </div>
            </div>
          </div>

          {isConnected ? (
            <Button
              onClick={() => setMintModalOpen(true)}
              size="lg"
              className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-medium px-8 py-4 text-lg shadow-lg hover:shadow-xl transition-all duration-200"
            >
              <Plus className="w-5 h-5 mr-2" />
              Create Your First NFT
            </Button>
          ) : (
            <Card className="max-w-md mx-auto bg-gray-800/50 border-gray-600">
              <CardContent className="p-6 text-center">
                <Info className="w-12 h-12 text-blue-400 mx-auto mb-4" />
                <p className="text-white font-medium mb-2">Connect Your Wallet</p>
                <p className="text-sm text-gray-400">
                  Connect your wallet to start creating and trading NFTs
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-8 items-center justify-between">
          <div className="flex items-center gap-4">
            <SearchBar onSearch={setSearchTerm} />
            {searchTerm && (
              <Badge variant="outline" className="border-purple-400/30 text-purple-400">
                Searching: {searchTerm}
              </Badge>
            )}
          </div>
          
          <div className="flex items-center gap-4">
            <Badge 
              variant="outline" 
              className={`border-blue-400/30 ${chainInfo.color} font-medium`}
            >
              {chainInfo.icon} {chainInfo.name}
            </Badge>
          </div>
        </div>

        {/* Marketplace Grid */}
        <MarketplaceGrid searchTerm={searchTerm} />
      </div>

      <MintNFTModal 
        open={mintModalOpen} 
        onOpenChange={setMintModalOpen} 
      />
    </>
  );
}