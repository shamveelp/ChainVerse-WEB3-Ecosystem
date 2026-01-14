'use client';

import { useState } from 'react';
import Link from 'next/link';
import { WalletConnection } from './WalletConnection';
import { NetworkSwitcher } from './NetworkSwitcher';
import { Button } from '@/components/ui/button';
import { MintNFTModal } from './MintNFTModal';
import { Badge } from '@/components/ui/badge';
import { Palette, Store, User, Plus, BarChart3 } from 'lucide-react';
import { useMarketplace } from '@/hooks/useMarketplace';
import { USER_ROUTES } from '@/routes';

export function NavbarT() {
  const [mintModalOpen, setMintModalOpen] = useState(false);
  const { marketStats } = useMarketplace();

  return (
    <>
      <nav className="sticky top-0 z-50 bg-gray-900/80 backdrop-blur-lg border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <Link href={USER_ROUTES.NFT_MARKET} className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg flex items-center justify-center">
                <Palette className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-indigo-300 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                ChainVerse NFT
              </span>
            </Link>

            {/* Center - Market Stats */}
            <div className="hidden lg:flex items-center gap-6 text-sm">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-purple-400" />
                <span className="text-gray-400">Total NFTs:</span>
                <Badge variant="outline" className="border-purple-400/30 text-purple-400">
                  {marketStats.totalItems}
                </Badge>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-gray-400">Active:</span>
                <Badge variant="outline" className="border-green-400/30 text-green-400">
                  {marketStats.activeItems}
                </Badge>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-gray-400">Sold:</span>
                <Badge variant="outline" className="border-blue-400/30 text-blue-400">
                  {marketStats.soldItems}
                </Badge>
              </div>
            </div>

            {/* Navigation Links */}
            <div className="hidden md:flex items-center space-x-6">
              <Link
                href={USER_ROUTES.NFT_MARKET}
                className="text-gray-300 hover:text-white transition-colors duration-200 flex items-center gap-2"
              >
                <Store className="w-4 h-4" />
                Marketplace
              </Link>
              <Link
                href={USER_ROUTES.NFT_PROFILE}
                className="text-gray-300 hover:text-white transition-colors duration-200 flex items-center gap-2"
              >
                <User className="w-4 h-4" />
                My Collection
              </Link>
              <Button
                onClick={() => setMintModalOpen(true)}
                size="sm"
                className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create NFT
              </Button>
            </div>

            {/* Right Side - Network + Wallet */}
            <div className="flex items-center gap-3">
              <NetworkSwitcher />
              <WalletConnection />
            </div>
          </div>
        </div>
      </nav>

      <MintNFTModal
        open={mintModalOpen}
        onOpenChange={setMintModalOpen}
      />
    </>
  );
}