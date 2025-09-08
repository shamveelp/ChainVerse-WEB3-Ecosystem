'use client';

import { useState } from 'react';
import { NFTItem } from '@/hooks/useMarketplace';
import { formatEther } from 'viem';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Eye, ShoppingCart, Tag } from 'lucide-react';

interface NFTCardProps {
  nft: NFTItem;
  onBuy?: (itemId: bigint, price: bigint) => void;
  onList?: (tokenId: bigint) => void;
  showListButton?: boolean;
  showBuyButton?: boolean;
}

export function NFTCard({ 
  nft, 
  onBuy, 
  onList, 
  showListButton = false, 
  showBuyButton = false 
}: NFTCardProps) {
  const [imageLoading, setImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);

  const handleImageLoad = () => setImageLoading(false);
  const handleImageError = () => {
    setImageLoading(false);
    setImageError(true);
  };

  return (
    <Card className="group bg-white/10 backdrop-blur-lg border border-white/20 hover:border-purple-400/50 transition-all duration-300 hover:scale-105 hover:shadow-xl overflow-hidden">
      <CardHeader className="p-0">
        <div className="relative aspect-square overflow-hidden">
          {imageLoading && (
            <div className="absolute inset-0 bg-gradient-to-br from-purple-400/20 to-blue-400/20 animate-pulse" />
          )}
          {!imageError ? (
            <img
              src={nft.metadata?.image || '/placeholder-nft.png'}
              alt={nft.metadata?.name || 'NFT'}
              className={`w-full h-full object-cover transition-opacity duration-300 ${
                imageLoading ? 'opacity-0' : 'opacity-100'
              }`}
              onLoad={handleImageLoad}
              onError={handleImageError}
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-purple-400/20 to-blue-400/20 flex items-center justify-center">
              <Eye className="w-12 h-12 text-gray-400" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        </div>
      </CardHeader>
      
      <CardContent className="p-4">
        <div className="space-y-3">
          <div>
            <h3 className="text-lg font-semibold text-white truncate">
              {nft.metadata?.name || `NFT #${nft.tokenId}`}
            </h3>
            <p className="text-gray-300 text-sm line-clamp-2">
              {nft.metadata?.description || 'No description available'}
            </p>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs text-gray-400">Price</p>
              <div className="flex items-center gap-1">
                <span className="text-xl font-bold text-white">
                  {formatEther(nft.price)}
                </span>
                <span className="text-sm text-gray-300">ETH</span>
              </div>
            </div>
            
            {nft.sold ? (
              <Badge variant="secondary" className="bg-green-600/20 text-green-400 border-green-400/30">
                Sold
              </Badge>
            ) : (
              <Badge variant="outline" className="border-purple-400/30 text-purple-400">
                Available
              </Badge>
            )}
          </div>
          
          {nft.metadata?.attributes && nft.metadata.attributes.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs text-gray-400">Attributes</p>
              <div className="flex flex-wrap gap-1">
                {nft.metadata.attributes.slice(0, 3).map((attr, index) => (
                  <Badge
                    key={index}
                    variant="outline"
                    className="text-xs bg-blue-600/10 border-blue-400/30 text-blue-400"
                  >
                    {attr.trait_type}: {attr.value}
                  </Badge>
                ))}
                {nft.metadata.attributes.length > 3 && (
                  <Badge variant="outline" className="text-xs">
                    +{nft.metadata.attributes.length - 3} more
                  </Badge>
                )}
              </div>
            </div>
          )}
        </div>
      </CardContent>
      
      <CardFooter className="p-4 pt-0">
        <div className="w-full space-y-2">
          {showBuyButton && onBuy && !nft.sold && (
            <Button
              onClick={() => onBuy(nft.itemId, nft.price)}
              className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-medium transition-all duration-200"
            >
              <ShoppingCart className="w-4 h-4 mr-2" />
              Buy Now
            </Button>
          )}
          
          {showListButton && onList && (
            <Button
              onClick={() => onList(nft.tokenId)}
              variant="outline"
              className="w-full border-purple-400/30 text-purple-400 hover:bg-purple-600/10"
            >
              <Tag className="w-4 h-4 mr-2" />
              List for Sale
            </Button>
          )}
          
          <div className="text-xs text-gray-400 space-y-1">
            <p>Token ID: #{nft.tokenId.toString()}</p>
            <p className="truncate">
              Owner: {nft.owner === '0x0000000000000000000000000000000000000000' 
                ? nft.seller 
                : nft.owner}
            </p>
          </div>
        </div>
      </CardFooter>
    </Card>
  );
}