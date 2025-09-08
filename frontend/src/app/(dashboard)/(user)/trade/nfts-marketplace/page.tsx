'use client';

import { useState } from 'react';
import { useAccount } from 'wagmi';
import { MarketplaceGrid } from '@/components/trade/MarketPlaceGrid';
import { SearchBar } from '@/components/trade/SearchBar';
import { Button } from '@/components/ui/button';
import { MintNFTModal } from '@/components/trade/MintNFTModal';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, Users, Zap, Plus } from 'lucide-react';

export default function Home() {
  const { isConnected } = useAccount();
  const [searchTerm, setSearchTerm] = useState('');
  const [mintModalOpen, setMintModalOpen] = useState(false);

  return (
    <>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-8">

        {/* Hero Section */}
        <div className="text-center mb-12 space-y-6">
          <div className="space-y-4">
            <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent leading-tight">
              Discover, Create, Trade
            </h1>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto leading-relaxed">
              The premier NFT marketplace on Sepolia testnet. Mint unique digital assets, 
              discover amazing collections, and trade with confidence.
            </p>
          </div>

          <div className="flex flex-wrap justify-center gap-8 py-8">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-purple-600/20 rounded-full flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-purple-400" />
              </div>
              <div className="text-left">
                <p className="text-2xl font-bold text-white">1,234+</p>
                <p className="text-sm text-gray-400">NFTs Traded</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-blue-600/20 rounded-full flex items-center justify-center">
                <Users className="w-6 h-6 text-blue-400" />
              </div>
              <div className="text-left">
                <p className="text-2xl font-bold text-white">567+</p>
                <p className="text-sm text-gray-400">Active Users</p>
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

          {isConnected && (
            <Button
              onClick={() => setMintModalOpen(true)}
              size="lg"
              className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-medium px-8 py-4 text-lg"
            >
              <Plus className="w-5 h-5 mr-2" />
              Create Your First NFT
            </Button>
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
          
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            Sepolia Testnet
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