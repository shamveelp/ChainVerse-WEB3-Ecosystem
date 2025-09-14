'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Copy, ExternalLink, User, Wallet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { NFTCard } from './nft-card';
import { RelistModal } from './relist-modal';
import { LoadingGrid } from './loading-skeleton';
import { useNFTContract } from '@/hooks/nft/useNFTContract';
import { useWallet } from './wallet-provider';
import { NFTWithMetadata } from '../../types/types-nft';
import { toast } from 'sonner';

export default function ProfilePage() {
  const [ownedNFTs, setOwnedNFTs] = useState<NFTWithMetadata[]>([]);
  const [listedNFTs, setListedNFTs] = useState<NFTWithMetadata[]>([]);
  const [loading, setLoading] = useState(true);
  const [relistModal, setRelistModal] = useState<{
    isOpen: boolean;
    nft: NFTWithMetadata | null;
  }>({ isOpen: false, nft: null });
  const [listingFee, setListingFee] = useState('0.000001');

  const { account, isConnected } = useWallet();
  const {
    getMyNFTs,
    enrichNFTsWithMetadata,
    relistNFT,
    cancelListing,
    getListPrice,
    isLoading: isProcessing
  } = useNFTContract();

  useEffect(() => {
    if (isConnected) {
      loadMyNFTs();
      loadListingFee();
    }
  }, [isConnected]);

  const loadListingFee = async () => {
    try {
      const fee = await getListPrice();
      setListingFee(fee);
    } catch (error) {
      console.error('Error loading listing fee:', error);
    }
  };

  const loadMyNFTs = async () => {
    if (!account) return;

    try {
      setLoading(true);
      const myNFTs = await getMyNFTs();

      if (myNFTs.length > 0) {
        const enriched = await enrichNFTsWithMetadata(myNFTs);

        // Separate owned vs listed NFTs
        const owned = enriched.filter(nft =>
          nft.owner.toLowerCase() === account.toLowerCase() && !nft.currentlyListed
        );
        const listed = enriched.filter(nft => nft.currentlyListed);

        setOwnedNFTs(owned);
        setListedNFTs(listed);
      } else {
        setOwnedNFTs([]);
        setListedNFTs([]);
      }
    } catch (error) {
      console.error('Error loading my NFTs:', error);
      toast.error('Failed to load your NFTs');
    } finally {
      setLoading(false);
    }
  };

  const copyAddress = () => {
    if (account) {
      navigator.clipboard.writeText(account);
      toast.success('Address copied to clipboard!');
    }
  };

  const handleRelistNFT = async (price: string) => {
    if (!relistModal.nft) return;

    try {
      await relistNFT(relistModal.nft.tokenId, price);
      toast.success('NFT relisted successfully!');
      await loadMyNFTs(); // Reload to reflect changes
    } catch (error: any) {
      console.error('Error relisting NFT:', error);
      toast.error(error.message || 'Failed to relist NFT');
      throw error; // Re-throw to prevent modal from closing
    }
  };

  const handleCancelListing = async (nft: NFTWithMetadata) => {
    try {
      await cancelListing(nft.tokenId);
      toast.success('Listing cancelled successfully!');
      await loadMyNFTs(); // Reload to reflect changes
    } catch (error: any) {
      console.error('Error cancelling listing:', error);
      toast.error(error.message || 'Failed to cancel listing');
    }
  };

  const openRelistModal = (nft: NFTWithMetadata) => {
    setRelistModal({ isOpen: true, nft });
  };

  const closeRelistModal = () => {
    setRelistModal({ isOpen: false, nft: null });
  };

  if (!isConnected) {
    return (
      <div className="px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <Wallet className="mx-auto h-16 w-16 text-muted-foreground mb-6" />
            <h1 className="text-2xl font-bold mb-4">Connect Your Wallet</h1>
            <p className="text-muted-foreground mb-8">
              Please connect your wallet to view your NFT collection and profile.
            </p>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        {/* Profile Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-12"
        >
          <Card className="p-8 bg-gradient-to-r from-primary/10 via-purple-500/5 to-pink-500/10">
            <div className="flex flex-col md:flex-row items-start gap-6">
              {/* Avatar */}
              <div className="flex-shrink-0">
                <div className="h-24 w-24 rounded-full bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center">
                  <User className="h-10 w-10 text-primary-foreground" />
                </div>
              </div>

              {/* Profile Info */}
              <div className="flex-grow space-y-4">
                <div>
                  <h1 className="text-3xl font-bold mb-2">My Collection</h1>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <span className="font-mono text-sm">
                      {account?.slice(0, 6)}...{account?.slice(-4)}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={copyAddress}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => window.open(`https://sepolia.etherscan.io/address/${account}`, '_blank')}
                    >
                      <ExternalLink className="h-3 w-3" />
                    </Button>
                  </div>
                </div>

                {/* Stats */}
                <div className="flex gap-6">
                  <div>
                    <div className="text-2xl font-bold">{ownedNFTs.length}</div>
                    <div className="text-sm text-muted-foreground">Owned</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold">{listedNFTs.length}</div>
                    <div className="text-sm text-muted-foreground">Listed</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold">
                      {(ownedNFTs.length + listedNFTs.length)}
                    </div>
                    <div className="text-sm text-muted-foreground">Total</div>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* NFT Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <Tabs defaultValue="owned" className="space-y-8">
            <TabsList className="grid w-full grid-cols-2 max-w-md">
              <TabsTrigger value="owned" className="flex items-center gap-2">
                Owned ({ownedNFTs.length})
              </TabsTrigger>
              <TabsTrigger value="listed" className="flex items-center gap-2">
                Listed ({listedNFTs.length})
              </TabsTrigger>
            </TabsList>

            {/* Owned NFTs */}
            <TabsContent value="owned">
              {loading ? (
                <LoadingGrid />
              ) : ownedNFTs.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">🖼️</div>
                  <h3 className="text-xl font-semibold mb-2">No Owned NFTs</h3>
                  <p className="text-muted-foreground mb-6">
                    You don't own any NFTs yet. Start by creating or buying some!
                  </p>
                  <div className="flex gap-4 justify-center">
                    <Button asChild>
                      <a href="/trade/nfts-marketplace/create">Create NFT</a>
                    </Button>
                    <Button variant="outline" asChild>
                      <a href="/trade/nfts-marketplace/explore">Explore NFTs</a>
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {ownedNFTs.map((nft, index) => (
                    <motion.div
                      key={nft.tokenId.toString()}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.6, delay: index * 0.1 }}
                    >
                      <NFTCard
                        nft={nft}
                        showBuyButton={false}
                        onRelist={() => openRelistModal(nft)}
                        showOwnerActions={true}
                      />
                    </motion.div>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Listed NFTs */}
            <TabsContent value="listed">
              {loading ? (
                <LoadingGrid />
              ) : listedNFTs.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">🏪</div>
                  <h3 className="text-xl font-semibold mb-2">No Listed NFTs</h3>
                  <p className="text-muted-foreground">
                    You haven't listed any NFTs for sale yet.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {listedNFTs.map((nft, index) => (
                    <motion.div
                      key={nft.tokenId.toString()}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.6, delay: index * 0.1 }}
                      className="relative"
                    >
                      <Badge
                        className="absolute top-2 left-2 z-10 bg-blue-500 hover:bg-blue-600"
                      >
                        Listed
                      </Badge>
                      <NFTCard
                        nft={nft}
                        showBuyButton={false}
                        onCancelListing={() => handleCancelListing(nft)}
                        showOwnerActions={true}
                      />
                    </motion.div>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </motion.div>

        {/* Footer Note */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mt-12 text-center"
        >
          <Card className="p-6 bg-muted/20">
            <p className="text-sm text-muted-foreground">
              View your complete NFT collection on{' '}
              <a
                href={`https://testnets.opensea.io/${account}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                OpenSea Testnet
              </a>
            </p>
          </Card>
        </motion.div>

        {/* Relist Modal */}
        <RelistModal
          isOpen={relistModal.isOpen}
          onClose={closeRelistModal}
          nft={relistModal.nft}
          onRelist={handleRelistNFT}
          isLoading={isProcessing}
          listingFee={listingFee}
        />
      </div>
    </div>
  );
}