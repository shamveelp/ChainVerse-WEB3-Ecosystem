'use client';

import { useState } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Eye, Heart, ShoppingCart, AlertCircle } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { NFTWithMetadata } from './types-nft';
import Link from 'next/link';

interface NFTCardProps {
  nft: NFTWithMetadata;
  onBuy?: () => void;
  onView?: () => void;
  showBuyButton?: boolean;
  className?: string;
}

export function NFTCard({
  nft,
  onBuy,
  onView,
  showBuyButton = true,
  className = ""
}: NFTCardProps) {
  const [isLiked, setIsLiked] = useState(false);
  const [imageError, setImageError] = useState(false);

  return (
    <motion.div
      whileHover={{ y: -8, scale: 1.02 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className={className}
    >
      <Card className="group overflow-hidden bg-gradient-to-br from-background/95 via-background/90 to-background/80 backdrop-blur-lg border-border/50 hover:border-primary/50 transition-all duration-500">
        <div className="relative overflow-hidden">
          {/* NFT Image */}
          <div className="relative aspect-square overflow-hidden">
            {!imageError && nft.imageUrl ? (
              <Image
                src={nft.imageUrl}
                alt={nft.metadata?.name || `NFT #${nft.tokenId}`}
                fill
                className="object-cover transition-transform duration-700 group-hover:scale-110"
                onError={() => setImageError(true)}
                unoptimized
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
                <div className="text-center">
                  <AlertCircle className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
                  <div className="text-lg font-bold text-muted-foreground">
                    #{nft.tokenId.toString()}
                  </div>
                </div>
              </div>
            )}

            {/* Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

            {/* Action Buttons */}
            <div className="absolute top-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <Button
                size="icon"
                variant="secondary"
                className="h-8 w-8 rounded-full bg-background/80 backdrop-blur-sm"
                onClick={(e) => {
                  e.preventDefault();
                  setIsLiked(!isLiked);
                }}
              >
                <Heart
                  className={`h-4 w-4 ${isLiked ? 'fill-red-500 text-red-500' : ''}`}
                />
              </Button>

              {onView && (
                <Button
                  size="icon"
                  variant="secondary"
                  className="h-8 w-8 rounded-full bg-background/80 backdrop-blur-sm"
                  onClick={onView}
                >
                  <Eye className="h-4 w-4" />
                </Button>
              )}
            </div>

            {/* Status Badge */}
            {nft.currentlyListed && (
              <Badge
                className="absolute top-3 left-3 bg-green-500/90 hover:bg-green-500"
              >
                Listed
              </Badge>
            )}
          </div>

          {/* NFT Details */}
          <div className="p-4 space-y-3">
            <div className="space-y-2">
              <h3 className="font-semibold text-lg leading-tight group-hover:text-primary transition-colors">
                {nft.metadata?.name || `NFT #${nft.tokenId}`}
              </h3>

              {nft.metadata?.description && (
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {nft.metadata.description}
                </p>
              )}
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-border/50">
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Price</p>
                <div className="flex items-center gap-1">
                  <span className="font-bold text-lg">
                    {nft.formattedPrice}
                  </span>
                  <span className="text-sm text-muted-foreground">ETH</span>
                </div>
              </div>

              {showBuyButton && nft.currentlyListed && onBuy && (
                <Button
                  onClick={onBuy}
                  className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
                >
                  <ShoppingCart className="h-4 w-4 mr-1" />
                  Buy Now
                </Button>
              )}
            </div>

            <div className="text-xs text-muted-foreground space-y-1">
              <p>Token ID: #{nft.tokenId.toString()}</p>
              <p className="truncate" title={nft.owner}>
                Owner: {nft.owner.slice(0, 6)}...{nft.owner.slice(-4)}
              </p>
            </div>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}