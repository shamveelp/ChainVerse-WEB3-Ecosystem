'use client';

import { useState } from 'react';
import Link from 'next/link';
import { WalletConnection } from './WalletConnection';
import { Button } from '@/components/ui/button';
import { MintNFTModal } from './MintNFTModal';
import { Palette, Store, User, Plus } from 'lucide-react';

export function NavbarT() {
  const [mintModalOpen, setMintModalOpen] = useState(false);

  return (
    <>
      <nav className="sticky top-0 z-50 bg-gray-900/80 backdrop-blur-lg border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <Link href="/trade/nfts-marketplace" className="flex items-center space-x-2">
              
              <span className="text-xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
                ChainVerse NFT Market
              </span>
            </Link>

            {/* Navigation Links */}
            <div className="hidden md:flex items-center space-x-8">
              <Link 
                href="/trade/nfts-marketplace" 
                className="text-gray-300 hover:text-white transition-colors duration-200 flex items-center gap-2"
              >
                <Store className="w-4 h-4" />
                Marketplace
              </Link>
              <Link 
                href="/trade/nfts-marketplace/profile" 
                className="text-gray-300 hover:text-white transition-colors duration-200 flex items-center gap-2"
              >
                <User className="w-4 h-4" />
                My Collection
              </Link>
              <Button
                onClick={() => setMintModalOpen(true)}
                className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create NFT
              </Button>
            </div>

            {/* Wallet Connection */}
            <WalletConnection />
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