'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { 
  ArrowLeft, 
  Heart, 
  Share2, 
  ExternalLink, 
  User, 
  Calendar, 
  Tag, 
  TrendingUp,
  ShoppingCart,
  DollarSign,
  Eye,
  AlertCircle,
  Copy,
  Zap,
  Clock
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useNFTContract } from '@/hooks/nft/useNFTContract';
import { useActiveAccount } from 'thirdweb/react';
import { NFTWithMetadata, SaleDetails } from '@/types/types-nft';
import { LoadingSpinner } from '@/components/tester/loading-skeleton';
import { toast } from 'sonner';
import { ethers } from 'ethers';

export default function NFTDetailPage() {
  const params = useParams();
  const router = useRouter();
  const tokenId = params.id as string;
  
  const [nft, setNft] = useState<NFTWithMetadata | null>(null);
  const [loading, setLoading] = useState(true);
  const [imageError, setImageError] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [saleDetails, setSaleDetails] = useState<SaleDetails | null>(null);

  const account = useActiveAccount();
  const {
    getListedTokenForId,
    fetchNFTMetadata,
    buyNFT,
    calculateSaleDetails,
    isLoading: isTransacting
  } = useNFTContract();

  useEffect(() => {
    if (tokenId) {
      loadNFTDetails();
    }
  }, [tokenId, account]);

  const loadNFTDetails = async () => {
    try {
      setLoading(true);
      const tokenIdBigInt = BigInt(tokenId);
      
      // Get NFT data from contract
      const listedToken = await getListedTokenForId(tokenIdBigInt);
      
      if (!listedToken || Number(listedToken.tokenId) === 0) {
        throw new Error('NFT not found');
      }

      // Get metadata
      const metadata = await fetchNFTMetadata(tokenIdBigInt);

      // Combine data
      const enrichedNFT: NFTWithMetadata = {
        ...listedToken,
        metadata: metadata ?? null,
        imageUrl: metadata?.image || metadata?.img_url,
        formattedPrice: ethers.formatEther(listedToken.price),
      };

      setNft(enrichedNFT);

      // Calculate sale details
      if (listedToken.price > 0n) {
        const details = calculateSaleDetails(listedToken.price);
        setSaleDetails(details);
      }

    } catch (error) {
      console.error('Error loading NFT details:', error);
      toast.error('Failed to load NFT details');
    } finally {
      setLoading(false);
    }
  };

  const handleBuyNFT = async () => {
    if (!nft || !account) {
      toast.error('Please connect your wallet first');
      return;
    }

    if (account && nft.seller.toLowerCase() === account.address.toLowerCase()) {
      toast.error('You cannot buy your own NFT');
      return;
    }

    try {
      await buyNFT(nft.tokenId, nft.price);
      toast.success('NFT purchased successfully!');
      await loadNFTDetails(); // Reload to reflect changes
    } catch (error: any) {
      console.error('Error buying NFT:', error);
      toast.error(error.message || 'Failed to buy NFT');
    }
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: nft?.metadata?.name || `NFT #${tokenId}`,
        text: nft?.metadata?.description || 'Check out this NFT on NFTorium!',
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success('Link copied to clipboard!');
    }
  };

  const copyAddress = (address: string) => {
    navigator.clipboard.writeText(address);
    toast.success('Address copied to clipboard!');
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const formatDate = (timestamp: bigint) => {
    const date = new Date(Number(timestamp) * 1000);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!nft) {
    return (
      <div className="px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <AlertCircle className="mx-auto h-16 w-16 text-muted-foreground mb-6" />
          <h1 className="text-2xl font-bold mb-4">NFT Not Found</h1>
          <p className="text-muted-foreground mb-8">
            The NFT you're looking for doesn't exist or has been removed.
          </p>
          <Button onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  const isOwner = account && nft.owner.toLowerCase() === account.address.toLowerCase();
  const isSeller = account && nft.seller.toLowerCase() === account.address.toLowerCase();
  const isCreator = nft.creator && account && 
    nft.creator.toLowerCase() === account.address.toLowerCase();

  return (
    <TooltipProvider>
      <div className="px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          {/* Back Button */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="mb-8"
          >
            <Button variant="ghost" onClick={() => router.back()}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Explore
            </Button>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* NFT Image */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
            >
              <Card className="overflow-hidden bg-gradient-to-br from-background/95 to-muted/20">
                <div className="aspect-square relative">
                  {!imageError && nft.imageUrl ? (
                    <Image
                      src={nft.imageUrl}
                      alt={nft.metadata?.name || `NFT #${nft.tokenId}`}
                      fill
                      className="object-cover"
                      onError={() => setImageError(true)}
                      unoptimized
                      priority
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
                      <div className="text-center">
                        <AlertCircle className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
                        <div className="text-2xl font-bold text-muted-foreground">
                          NFT #{nft.tokenId.toString()}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Action Buttons Overlay */}
                  <div className="absolute top-4 right-4 flex gap-2">
                    <Button
                      size="icon"
                      variant="secondary"
                      className="bg-background/80 backdrop-blur-sm"
                      onClick={() => setIsLiked(!isLiked)}
                    >
                      <Heart className={`h-4 w-4 ${isLiked ? 'fill-red-500 text-red-500' : ''}`} />
                    </Button>
                    <Button
                      size="icon"
                      variant="secondary"
                      className="bg-background/80 backdrop-blur-sm"
                      onClick={handleShare}
                    >
                      <Share2 className="h-4 w-4" />
                    </Button>
                  </div>

                  {/* Status Badges */}
                  <div className="absolute top-4 left-4 flex flex-col gap-2">
                    {nft.currentlyListed && (
                      <Badge className="bg-green-500/90">
                        <Zap className="h-3 w-3 mr-1" />
                        Listed for Sale
                      </Badge>
                    )}
                    {isCreator && (
                      <Badge variant="outline" className="bg-purple-500/20 border-purple-500/50">
                        Your Creation
                      </Badge>
                    )}
                    {isOwner && (
                      <Badge variant="outline" className="bg-blue-500/20 border-blue-500/50">
                        You Own This
                      </Badge>
                    )}
                  </div>
                </div>
              </Card>
            </motion.div>

            {/* NFT Details */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="space-y-6"
            >
              {/* Title and Basic Info */}
              <div>
                <h1 className="text-4xl font-bold mb-4">
                  {nft.metadata?.name || `NFT #${nft.tokenId}`}
                </h1>
                <div className="flex items-center gap-4 text-muted-foreground mb-4">
                  <span className="flex items-center gap-1">
                    <Eye className="h-4 w-4" />
                    Token ID: #{nft.tokenId.toString()}
                  </span>
                  {nft.createdAt && Number(nft.createdAt) > 0 && (
                    <span className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      {formatDate(nft.createdAt)}
                    </span>
                  )}
                </div>
              </div>

              {/* Description */}
              {nft.metadata?.description && (
                <Card className="p-6">
                  <h3 className="font-semibold mb-3">Description</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {nft.metadata.description}
                  </p>
                </Card>
              )}

              {/* Price and Purchase */}
              {nft.currentlyListed && (
                <Card className="p-6 bg-gradient-to-r from-primary/5 via-purple-500/5 to-pink-500/5">
                  <div className="space-y-4">
                    <h3 className="font-semibold text-lg flex items-center gap-2">
                      <DollarSign className="h-5 w-5" />
                      Current Price
                    </h3>
                    
                    <div className="flex items-baseline gap-2">
                      <span className="text-4xl font-bold">{nft.formattedPrice}</span>
                      <span className="text-xl text-muted-foreground">ETH</span>
                      <span className="text-sm text-muted-foreground ml-2">
                        ≈ ${(parseFloat(nft.formattedPrice) * 2000).toFixed(2)} USD
                      </span>
                    </div>

                    {/* Sale Breakdown */}
                    {saleDetails && (
                      <div className="space-y-2 text-sm text-muted-foreground">
                        <div className="flex justify-between">
                          <span>Company Fee (2.5%):</span>
                          <span>{ethers.formatEther(saleDetails.companyFee)} ETH</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Creator Royalty (1%):</span>
                          <span>{ethers.formatEther(saleDetails.creatorRoyalty)} ETH</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Seller Receives:</span>
                          <span className="font-semibold">
                            {ethers.formatEther(saleDetails.sellerAmount)} ETH
                          </span>
                        </div>
                      </div>
                    )}

                    {!isOwner && !isSeller && account && (
                      <Button
                        size="lg"
                        onClick={handleBuyNFT}
                        disabled={isTransacting}
                        className="w-full bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90"
                      >
                        <ShoppingCart className="h-5 w-5 mr-2" />
                        {isTransacting ? 'Processing...' : 'Buy Now'}
                      </Button>
                    )}

                    {!account && (
                      <Alert>
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>
                          Connect your wallet to purchase this NFT.
                        </AlertDescription>
                      </Alert>
                    )}

                    {(isOwner || isSeller) && (
                      <Alert>
                        <AlertDescription>
                          {isOwner ? 'You own this NFT.' : 'This is your listing.'}
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>
                </Card>
              )}

              {/* Owner Info */}
              <Card className="p-6">
                <h3 className="font-semibold mb-4">Ownership Details</h3>
                <div className="space-y-4">
                  {nft.creator && (
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Creator</span>
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="font-mono"
                              onClick={() => copyAddress(nft.creator)}
                            >
                              {formatAddress(nft.creator)}
                              <Copy className="h-3 w-3 ml-1" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Click to copy address</p>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                    </div>
                  )}

                  <Separator />

                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Current Owner</span>
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="font-mono"
                            onClick={() => copyAddress(nft.owner)}
                          >
                            {formatAddress(nft.owner)}
                            <Copy className="h-3 w-3 ml-1" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Click to copy address</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                  </div>

                  {nft.currentlyListed && nft.seller && (
                    <>
                      <Separator />
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Listed by</span>
                        <div className="flex items-center gap-2">
                          <Tag className="h-4 w-4" />
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="font-mono"
                                onClick={() => copyAddress(nft.seller)}
                              >
                                {formatAddress(nft.seller)}
                                <Copy className="h-3 w-3 ml-1" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Click to copy address</p>
                            </TooltipContent>
                          </Tooltip>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </Card>

              {/* Attributes */}
              {nft.metadata?.attributes && nft.metadata.attributes.length > 0 && (
                <Card className="p-6">
                  <h3 className="font-semibold mb-4">Attributes</h3>
                  <div className="grid grid-cols-2 gap-3">
                    {nft.metadata.attributes.map((attr, index) => (
                      <div
                        key={index}
                        className="p-3 rounded-lg bg-muted/50 text-center"
                      >
                        <div className="text-sm text-muted-foreground">
                          {attr.trait_type}
                        </div>
                        <div className="font-semibold">{attr.value}</div>
                      </div>
                    ))}
                  </div>
                </Card>
              )}

              {/* External Links */}
              <Card className="p-6">
                <h3 className="font-semibold mb-4">External Links</h3>
                <div className="flex gap-3">
                  <Button variant="outline" size="sm" asChild>
                    <a
                      href={`https://sepolia.etherscan.io/token/${process.env.NEXT_PUBLIC_CONTRACT_ADDRESS}?a=${nft.tokenId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Etherscan
                    </a>
                  </Button>
                  <Button variant="outline" size="sm" asChild>
                    <a
                      href={`https://testnets.opensea.io/assets/sepolia/${process.env.NEXT_PUBLIC_CONTRACT_ADDRESS}/${nft.tokenId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <ExternalLink className="h-4 w-4 mr-2" />
                      OpenSea
                    </a>
                  </Button>
                </div>
              </Card>
            </motion.div>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}