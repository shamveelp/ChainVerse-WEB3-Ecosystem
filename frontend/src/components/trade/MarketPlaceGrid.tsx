'use client';

import { NFTCard } from './NFTCard';
import { useMarketplace } from '@/hooks/useMarketplace';
import { Loader2, ShoppingBag } from 'lucide-react';

interface MarketplaceGridProps {
  searchTerm?: string;
}

export function MarketplaceGrid({ searchTerm = '' }: MarketplaceGridProps) {
  const { marketItems, loading, buyNFT } = useMarketplace();

  const filteredItems = marketItems.filter(item =>
    item.metadata?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.metadata?.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center space-y-4">
          <Loader2 className="w-12 h-12 text-purple-400 animate-spin mx-auto" />
          <p className="text-gray-300">Loading marketplace...</p>
        </div>
      </div>
    );
  }

  if (filteredItems.length === 0) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center space-y-4">
          <ShoppingBag className="w-16 h-16 text-gray-500 mx-auto" />
          <div>
            <h3 className="text-xl font-semibold text-white mb-2">
              {searchTerm ? 'No NFTs found' : 'No NFTs available'}
            </h3>
            <p className="text-gray-400">
              {searchTerm 
                ? 'Try adjusting your search terms'
                : 'Be the first to list an NFT on this marketplace!'
              }
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {filteredItems.map((nft) => (
        <NFTCard
          key={`${nft.nftContract}-${nft.tokenId}`}
          nft={nft}
          onBuy={buyNFT}
          showBuyButton={true}
        />
      ))}
    </div>
  );
}