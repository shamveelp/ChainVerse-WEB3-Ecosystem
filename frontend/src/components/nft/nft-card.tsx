'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Eye, Heart, ShoppingCart, AlertCircle, User, Calendar, DollarSign, Zap, Tag, MoreVertical, X } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { NFTWithMetadata } from '../../types/types-nft';
import Link from 'next/link';
import { useActiveAccount } from 'thirdweb/react';

interface NFTCardProps {
  nft: NFTWithMetadata;
  onBuy?: () => void;
  onRelist?: () => void;
  onCancelListing?: () => void;
  onView?: () => void;
  showBuyButton?: boolean;
  showOwnerActions?: boolean;
  className?: string;
  showCreator?: boolean;
}

export function NFTCard({
  nft,
  onBuy,
  onRelist,
  onCancelListing,
  onView,
  showBuyButton = true,
  showOwnerActions = true,
  className = "",
  showCreator = true
}: NFTCardProps) {
  const [isLiked, setIsLiked] = useState(false);
  const [imageError, setImageError] = useState(false);
  const account = useActiveAccount();

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const formatDate = (timestamp: bigint) => {
    const date = new Date(Number(timestamp) * 1000);
    return date.toLocaleDateString();
  };

  const isCreator = nft.creator && nft.seller &&
    nft.creator.toLowerCase() === nft.seller.toLowerCase();

  const isOwner = account && nft.owner.toLowerCase() === account.address.toLowerCase();
  const isCurrentSeller = account && nft.seller.toLowerCase() === account.address.toLowerCase();
  const canRelist = isOwner && !nft.currentlyListed;
  const canCancelListing = isCurrentSeller && nft.currentlyListed;

  return (
    <TooltipProvider>
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
                <img
                  src={nft.imageUrl}
                  alt={nft.metadata?.name || `NFT #${nft.tokenId}`}
                  className="object-cover w-full h-full absolute inset-0 transition-transform duration-700 group-hover:scale-110"
                  onError={() => setImageError(true)}
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
                {/* Owner Actions Menu */}
                {showOwnerActions && (canRelist || canCancelListing) && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        size="icon"
                        variant="secondary"
                        className="h-8 w-8 rounded-full bg-background/80 backdrop-blur-sm"
                      >
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {canRelist && onRelist && (
                        <DropdownMenuItem onClick={onRelist}>
                          <Tag className="mr-2 h-4 w-4" />
                          Relist for Sale
                        </DropdownMenuItem>
                      )}
                      {canCancelListing && onCancelListing && (
                        <DropdownMenuItem onClick={onCancelListing}>
                          <X className="mr-2 h-4 w-4" />
                          Cancel Listing
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}

                <Tooltip>
                  <TooltipTrigger asChild>
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
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{isLiked ? 'Remove from favorites' : 'Add to favorites'}</p>
                  </TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      size="icon"
                      variant="secondary"
                      className="h-8 w-8 rounded-full bg-background/80 backdrop-blur-sm"
                      asChild
                    >
                      <Link href={`/trade/nfts-marketplace/nft/${nft.tokenId}`}>
                        <Eye className="h-4 w-4" />
                      </Link>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>View details</p>
                  </TooltipContent>
                </Tooltip>
              </div>

              {/* Status Badges */}
              <div className="absolute top-3 left-3 flex flex-col gap-2">
                {nft.currentlyListed && (
                  <Badge className="bg-green-500/90 hover:bg-green-500">
                    <Zap className="h-3 w-3 mr-1" />
                    Listed
                  </Badge>
                )}
                {isCreator && (
                  <Badge variant="outline" className="bg-purple-500/20 border-purple-500/50">
                    Creator
                  </Badge>
                )}
                {isOwner && (
                  <Badge variant="outline" className="bg-blue-500/20 border-blue-500/50">
                    Owned
                  </Badge>
                )}
              </div>
            </div>

            {/* NFT Details */}
            <div className="p-4 space-y-3">
              <div className="space-y-2">
                <h3 className="font-semibold text-lg leading-tight group-hover:text-primary transition-colors line-clamp-1">
                  {nft.metadata?.name || `NFT #${nft.tokenId}`}
                </h3>

                {nft.metadata?.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {nft.metadata.description}
                  </p>
                )}
              </div>

              {/* Price and Buy Section */}
              {/* Price and Buy Section */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pt-2 border-t border-border/50 gap-3 sm:gap-0">
                <div className="space-y-1 w-full sm:w-auto">
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <DollarSign className="h-3 w-3" />
                    {nft.currentlyListed ? 'Listed Price' : 'Last Price'}
                  </p>
                  <div className="flex items-baseline gap-1">
                    <span className="font-bold text-lg">
                      {nft.formattedPrice}
                    </span>
                    <span className="text-sm text-muted-foreground">ETH</span>
                  </div>
                  {/* Show USD equivalent if possible */}
                  {parseFloat(nft.formattedPrice) > 0 && (
                    <p className="text-xs text-muted-foreground">
                      ≈ ${(parseFloat(nft.formattedPrice) * 2000).toFixed(2)} USD
                    </p>
                  )}
                </div>

                <div className="flex flex-col gap-2 w-full sm:w-auto">
                  {showBuyButton && nft.currentlyListed && onBuy && !isCurrentSeller && (
                    <Button
                      onClick={onBuy}
                      size="sm"
                      className="w-full sm:w-auto bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
                    >
                      <ShoppingCart className="h-4 w-4 mr-1" />
                      Buy Now
                    </Button>
                  )}

                  {canRelist && onRelist && (
                    <Button
                      onClick={onRelist}
                      size="sm"
                      variant="outline"
                      className="w-full sm:w-auto border-green-500/50 hover:bg-green-500/20"
                    >
                      <Tag className="h-4 w-4 mr-1" />
                      Sell
                    </Button>
                  )}
                </div>
              </div>

              {/* Creator and Owner Info */}
              <div className="space-y-2 text-xs text-muted-foreground border-t border-border/50 pt-3">
                <div className="flex items-center justify-between">
                  <span>Token ID:</span>
                  <span className="font-mono">#{nft.tokenId.toString()}</span>
                </div>

                {showCreator && nft.creator && (
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1">
                      <User className="h-3 w-3" />
                      Creator:
                    </span>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className="font-mono cursor-help">
                          {formatAddress(nft.creator)}
                        </span>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{nft.creator}</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1">
                    <User className="h-3 w-3" />
                    Owner:
                  </span>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="font-mono cursor-help">
                        {formatAddress(nft.owner)}
                      </span>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{nft.owner}</p>
                    </TooltipContent>
                  </Tooltip>
                </div>

                {nft.createdAt && Number(nft.createdAt) > 0 && (
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      Created:
                    </span>
                    <span>{formatDate(nft.createdAt)}</span>
                  </div>
                )}
              </div>

              {/* Attributes Preview */}
              {nft.metadata?.attributes && nft.metadata.attributes.length > 0 && (
                <div className="pt-2 border-t border-border/50">
                  <div className="flex flex-wrap gap-1">
                    {nft.metadata.attributes.slice(0, 2).map((attr, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {attr.trait_type}: {attr.value}
                      </Badge>
                    ))}
                    {nft.metadata.attributes.length > 2 && (
                      <Badge variant="outline" className="text-xs">
                        +{nft.metadata.attributes.length - 2} more
                      </Badge>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </Card>
      </motion.div>
    </TooltipProvider>
  );
}