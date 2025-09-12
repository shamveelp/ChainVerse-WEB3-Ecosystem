'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, ExternalLink, Heart, Share, ShoppingCart, Tag } from 'lucide-react';
import { useAccount, useReadContract } from 'wagmi';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { LoadingSpinner } from '@/components/tester/loading-skeleton';
import { useNFTContract } from '@/components/tester/useNFTContract';
import { NFT_MARKETPLACE_ABI, NFT_MARKETPLACE_ADDRESS } from '@/components/tester/contracts';
import { NFTWithMetadata, ListedToken } from '@/components/tester/types-nft';
import { formatEther } from 'viem';
import { toast } from 'sonner';

export default function NFTDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { address } = useAccount();
  const [nft, setNFT] = useState<NFTWithMetadata | null>(null);
  const [loading, setLoading] = useState(true);
  const [relistPrice, setRelistPrice] = useState('');
  const [isLiked, setIsLiked] = useState(false);

  const {
    buyNFT,
    relistNFT,
    fetchNFTMetadata,
    isPending
  } = useNFTContract();

  const tokenId = BigInt(params.id as string);

  // Fetch listed token details
  const { data: listedToken } = useReadContract({
    address: NFT_MARKETPLACE_ADDRESS,
    abi: NFT_MARKETPLACE_ABI,
    functionName: 'getListedTokenForId',
    args: [tokenId],
  }) as { data: ListedToken | undefined };

  // Fetch token URI
  const { data: tokenURI } = useReadContract({
    address: NFT_MARKETPLACE_ADDRESS,
    abi: NFT_MARKETPLACE_ABI,
    functionName: 'tokenURI',
    args: [tokenId],
  }) as { data: string | undefined };

  useEffect(() => {
    const loadNFT = async () => {
      if (!listedToken || !tokenURI) return;

      try {
        const metadata = await fetchNFTMetadata(tokenId);
        const enrichedNFT: NFTWithMetadata = {
          ...listedToken,
          metadata,
          imageUrl: metadata?.image || metadata?.img_url,
          formattedPrice: formatEther(listedToken.price),
        };
        setNFT(enrichedNFT);
      } catch (error) {
        console.error('Error loading NFT:', error);
        toast.error('Failed to load NFT details');
      } finally {
        setLoading(false);
      }
    };

    loadNFT();
  }, [listedToken, tokenURI, fetchNFTMetadata, tokenId]);

  const handleBuyNFT = async () => {
    if (!nft) return;

    try {
      await buyNFT(nft.tokenId, nft.price);
      toast.success('Purchase initiated!');
    } catch (error) {
      console.error('Error buying NFT:', error);
      toast.error('Failed to buy NFT');
    }
  };

  const handleRelistNFT = async () => {
    if (!nft || !relistPrice) return;

    try {
      await relistNFT(nft.tokenId, relistPrice);
      toast.success('NFT relisted successfully!');
      setRelistPrice('');
    } catch (error) {
      console.error('Error relisting NFT:', error);
      toast.error('Failed to relist NFT');
    }
  };

  const shareNFT = async () => {
    if (navigator.share) {
      await navigator.share({
        title: nft?.metadata?.name || `NFT #${tokenId}`,
        text: nft?.metadata?.description || 'Check out this NFT!',
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success('Link copied to clipboard!');
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!nft) {
    return (
      <div className="px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h1 className="text-2xl font-bold mb-4">NFT Not Found</h1>
          <p className="text-muted-foreground mb-8">
            The NFT you're looking for doesn't exist or has been removed.
          </p>
          <Button onClick={() => router.push('/explore')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Explore
          </Button>
        </div>
      </div>
    );
  }

  const isOwner = address && nft.owner.toLowerCase() === address.toLowerCase();

  return (
    <div className="px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        {/* Back Button */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <Button 
            variant="ghost" 
            onClick={() => router.back()}
            className="mb-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* NFT Image */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7 }}
          >
            <Card className="overflow-hidden">
              <div className="relative aspect-square">
                {nft.imageUrl ? (
                  <Image
                    src={nft.imageUrl}
                    alt={nft.metadata?.name || `NFT #${tokenId}`}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
                    <div className="text-6xl font-bold text-muted-foreground">
                      #{tokenId}
                    </div>
                  </div>
                )}
              </div>
            </Card>
          </motion.div>

          {/* NFT Details */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="space-y-8"
          >
            {/* Header */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Badge variant={nft.currentlyListed ? 'default' : 'secondary'}>
                  {nft.currentlyListed ? 'Listed for Sale' : 'Not Listed'}
                </Badge>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setIsLiked(!isLiked)}
                  >
                    <Heart className={`h-4 w-4 ${isLiked ? 'fill-red-500 text-red-500' : ''}`} />
                  </Button>
                  <Button variant="outline" size="icon" onClick={shareNFT}>
                    <Share className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="icon" asChild>
                    <a 
                      href={`https://sepolia.etherscan.io/token/${process.env.NEXT_PUBLIC_CONTRACT_ADDRESS}?a=${tokenId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </Button>
                </div>
              </div>

              <h1 className="text-3xl font-bold">
                {nft.metadata?.name || `NFT #${tokenId}`}
              </h1>

              {nft.metadata?.description && (
                <p className="text-muted-foreground leading-relaxed">
                  {nft.metadata.description}
                </p>
              )}
            </div>

            {/* Price & Actions */}
            <Card className="p-6 space-y-6">
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Current Price</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold">{nft.formattedPrice}</span>
                  <span className="text-lg text-muted-foreground">ETH</span>
                </div>
              </div>

              <div className="flex gap-4">
                {nft.currentlyListed && !isOwner && (
                  <Button 
                    className="flex-1" 
                    onClick={handleBuyNFT}
                    disabled={isPending}
                  >
                    <ShoppingCart className="mr-2 h-4 w-4" />
                    {isPending ? 'Processing...' : 'Buy Now'}
                  </Button>
                )}

                {isOwner && (
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button className="flex-1" disabled={isPending}>
                        <Tag className="mr-2 h-4 w-4" />
                        {nft.currentlyListed ? 'Update Price' : 'List for Sale'}
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>List NFT for Sale</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <div className="space-y-2">
                          <Label htmlFor="price">Price (ETH)</Label>
                          <Input
                            id="price"
                            type="number"
                            step="0.001"
                            min="0"
                            placeholder="0.0001"
                            value={relistPrice}
                            onChange={(e) => setRelistPrice(e.target.value)}
                          />
                          <p className="text-sm text-muted-foreground">
                            Listing fee: 0.0001 ETH
                          </p>
                        </div>
                        <Button 
                          onClick={handleRelistNFT} 
                          className="w-full"
                          disabled={!relistPrice || isPending}
                        >
                          {isPending ? 'Processing...' : 'List NFT'}
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                )}
              </div>
            </Card>

            {/* Properties */}
            <Card className="p-6">
              <h3 className="font-semibold mb-4">Properties</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Token ID</span>
                  <span className="font-mono">#{tokenId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Owner</span>
                  <span className="font-mono text-sm">
                    {nft.owner.slice(0, 6)}...{nft.owner.slice(-4)}
                  </span>
                </div>
                {nft.currentlyListed && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Seller</span>
                    <span className="font-mono text-sm">
                      {nft.seller.slice(0, 6)}...{nft.seller.slice(-4)}
                    </span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Blockchain</span>
                  <span>Ethereum (Sepolia)</span>
                </div>
              </div>
            </Card>

            {/* Attributes */}
            {nft.metadata?.attributes && nft.metadata.attributes.length > 0 && (
              <Card className="p-6">
                <h3 className="font-semibold mb-4">Attributes</h3>
                <div className="grid grid-cols-2 gap-4">
                  {nft.metadata.attributes.map((attr, index) => (
                    <div 
                      key={index}
                      className="bg-muted/20 rounded-lg p-3 text-center"
                    >
                      <p className="text-sm text-muted-foreground mb-1">
                        {attr.trait_type}
                      </p>
                      <p className="font-semibold">{attr.value}</p>
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
}