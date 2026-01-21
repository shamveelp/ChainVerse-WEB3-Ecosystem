'use client';

import { useState } from 'react';
import { NFTItem } from '@/hooks/useMarketplace';
import { formatEther } from 'viem';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Eye, ShoppingCart, Tag, ExternalLink } from 'lucide-react';

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

  const truncateAddress = (address: string) => {
    if (!address) return 'Unknown';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  return (
    <Card className="group bg-gray-900/50 backdrop-blur-lg border border-white/20 hover:border-purple-400/50 transition-all duration-300 hover:scale-105 hover:shadow-2xl overflow-hidden">
      <CardHeader className="p-0">
        <div className="relative aspect-square overflow-hidden bg-gradient-to-br from-purple-400/10 to-blue-400/10">
          {imageLoading && (
            <div className="absolute inset-0 bg-gradient-to-br from-purple-400/20 to-blue-400/20 animate-pulse flex items-center justify-center">
              <div className="w-12 h-12 border-4 border-purple-400/30 border-t-purple-400 rounded-full animate-spin" />
            </div>
          )}
          {!imageError && nft.metadata?.image ? (
            <img
              src={nft.metadata.image}
              alt={nft.metadata.name || 'NFT'}
              className={`w-full h-full object-cover transition-all duration-500 ${imageLoading ? 'opacity-0 scale-110' : 'opacity-100 scale-100 group-hover:scale-110'
                }`}
              onLoad={handleImageLoad}
              onError={handleImageError}
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-purple-400/20 to-blue-400/20 flex items-center justify-center">
              <Eye className="w-12 h-12 text-gray-400" />
            </div>
          )}

          {/* Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

          {/* Status Badge */}
          <div className="absolute top-3 right-3">
            {nft.sold ? (
              <Badge className="bg-green-600/90 text-green-100 border-green-400/50 backdrop-blur-sm">
                Sold
              </Badge>
            ) : (
              <Badge variant="outline" className="bg-purple-600/20 text-purple-300 border-purple-400/50 backdrop-blur-sm">
                Available
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-4 space-y-4">
        {/* Title and Description */}
        <div>
          <h3 className="text-lg font-bold text-white truncate group-hover:text-purple-300 transition-colors">
            {nft.metadata?.name || `NFT #${nft.tokenId}`}
          </h3>
          <p className="text-gray-300 text-sm line-clamp-2 mt-1">
            {nft.metadata?.description || 'No description available'}
          </p>
        </div>

        {/* Price */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-400 mb-1">Price</p>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-bold text-white">
                {formatEther(nft.price)}
              </span>
              <span className="text-sm text-purple-300 font-medium">ETH</span>
            </div>
          </div>

          <div className="text-right">
            <p className="text-xs text-gray-400">Token ID</p>
            <p className="text-sm font-mono text-white">#{nft.tokenId.toString()}</p>
          </div>
        </div>

        {/* Attributes */}
        {nft.metadata?.attributes && nft.metadata.attributes.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs text-gray-400 font-medium">Properties</p>
            <div className="flex flex-wrap gap-1">
              {nft.metadata.attributes.slice(0, 3).map((attr, index) => (
                <Badge
                  key={index}
                  variant="outline"
                  className="text-xs bg-blue-600/10 border-blue-400/30 text-blue-300 px-2 py-1"
                >
                  {attr.trait_type}: {attr.value}
                </Badge>
              ))}
              {nft.metadata.attributes.length > 3 && (
                <Badge
                  variant="outline"
                  className="text-xs bg-gray-600/20 border-gray-400/30 text-gray-300"
                >
                  +{nft.metadata.attributes.length - 3} more
                </Badge>
              )}
            </div>
          </div>
        )}
      </CardContent>

      <CardFooter className="p-4 pt-0 space-y-3">
        {/* Action Buttons */}
        <div className="w-full space-y-2">
          {showBuyButton && onBuy && !nft.sold && (
            <Button
              onClick={() => onBuy(nft.itemId, nft.price)}
              className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold py-2.5 transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              <ShoppingCart className="w-4 h-4 mr-2" />
              Buy for {formatEther(nft.price)} ETH
            </Button>
          )}

          {showListButton && onList && !nft.sold && (
            <Button
              onClick={() => onList(nft.tokenId)}
              variant="outline"
              className="w-full border-purple-400/40 text-purple-300 hover:bg-purple-600/20 hover:text-purple-200 font-medium py-2.5 transition-all duration-200"
            >
              <Tag className="w-4 h-4 mr-2" />
              List for Sale
            </Button>
          )}
        </div>

        {/* Seller/Owner Info */}
        <div className="text-xs text-gray-400 space-y-1 border-t border-gray-700/50 pt-3">
          <div className="flex justify-between items-center">
            <span>Seller:</span>
            <span className="font-mono text-gray-300">
              {truncateAddress(nft.seller)}
            </span>
          </div>
          {nft.owner !== '0x0000000000000000000000000000000000000000' && (
            <div className="flex justify-between items-center">
              <span>Owner:</span>
              <span className="font-mono text-gray-300">
                {truncateAddress(nft.owner)}
              </span>
            </div>
          )}
        </div>
      </CardFooter>
    </Card>
  );
}