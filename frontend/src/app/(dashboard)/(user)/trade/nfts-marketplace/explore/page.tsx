'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, Filter, Grid, List } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { NFTCard } from '@/components/nft/nft-card';
import { LoadingGrid } from '@/components/nft/loading-skeleton';
import { useNFTContract } from '@/hooks/nft/useNFTContract';
import { NFTWithMetadata } from '@/types/types-nft';
import { useActiveAccount } from 'thirdweb/react';
import { toast } from 'sonner';

const sortOptions = [
  { value: 'recent', label: 'Recently Listed' },
  { value: 'price-low', label: 'Price: Low to High' },
  { value: 'price-high', label: 'Price: High to Low' },
  { value: 'name', label: 'Name A-Z' },
];

export default function ExplorePage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('recent');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [enrichedNFTs, setEnrichedNFTs] = useState<NFTWithMetadata[]>([]);
  const [filteredNFTs, setFilteredNFTs] = useState<NFTWithMetadata[]>([]);
  const [loading, setLoading] = useState(true);

  const account = useActiveAccount();
  const {
    getAllNFTs,
    enrichNFTsWithMetadata,
    buyNFT,
    isLoading: isBuying
  } = useNFTContract();

  useEffect(() => {
    loadNFTs();
  }, [account]);

  const loadNFTs = async () => {
    try {
      setLoading(true);
      const allNFTs = await getAllNFTs();
      if (allNFTs.length > 0) {
        const enriched = await enrichNFTsWithMetadata(allNFTs);
        setEnrichedNFTs(enriched);
        setFilteredNFTs(enriched);
      } else {
        setEnrichedNFTs([]);
        setFilteredNFTs([]);
      }
    } catch (error) {
      console.error('Error loading NFTs:', error);
      toast.error('Failed to load NFTs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let filtered = [...enrichedNFTs];

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(nft =>
        nft.metadata?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        nft.tokenId.toString().includes(searchTerm)
      );
    }

    // Apply sorting
    switch (sortBy) {
      case 'price-low':
        filtered.sort((a, b) => Number(a.price) - Number(b.price));
        break;
      case 'price-high':
        filtered.sort((a, b) => Number(b.price) - Number(a.price));
        break;
      case 'name':
        filtered.sort((a, b) =>
          (a.metadata?.name || '').localeCompare(b.metadata?.name || '')
        );
        break;
      case 'recent':
      default:
        filtered.sort((a, b) => Number(b.tokenId) - Number(a.tokenId));
        break;
    }

    setFilteredNFTs(filtered);
  }, [searchTerm, sortBy, enrichedNFTs]);

  const handleBuyNFT = async (nft: NFTWithMetadata) => {
    if (!account) {
      toast.error('Please connect your wallet first');
      return;
    }

    try {
      await buyNFT(nft.tokenId, nft.price);
      toast.success('NFT purchased successfully!');
      // Reload NFTs to reflect the change
      await loadNFTs();
    } catch (error: any) {
      console.error('Error buying NFT:', error);
      toast.error(error.message || 'Failed to buy NFT');
    }
  };

  if (loading) {
    return (
      <div className="px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-4">Explore NFTs</h1>
            <p className="text-muted-foreground">Loading amazing NFTs...</p>
          </div>
          <LoadingGrid />
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold mb-4">Explore NFTs</h1>
          <p className="text-muted-foreground">
            Discover unique digital collectibles from talented creators
          </p>
        </motion.div>

        {/* Filters and Search */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
        >
          <div className="flex flex-1 gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by name or token ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {sortOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-2">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'outline'}
              size="icon"
              onClick={() => setViewMode('grid')}
            >
              <Grid className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'outline'}
              size="icon"
              onClick={() => setViewMode('list')}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </motion.div>

        {/* Results Counter */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mb-6"
        >
          <p className="text-sm text-muted-foreground">
            Showing {filteredNFTs.length} of {enrichedNFTs.length} NFTs
          </p>
        </motion.div>

        {/* NFTs Grid */}
        {filteredNFTs.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="text-center py-12"
          >
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-xl font-semibold mb-2">No NFTs Found</h3>
            <p className="text-muted-foreground">
              {enrichedNFTs.length === 0
                ? 'No NFTs have been minted yet. Be the first to create one!'
                : 'Try adjusting your search or filters'
              }
            </p>
          </motion.div>
        ) : (
          <div className={`grid gap-6 ${
            viewMode === 'grid'
              ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
              : 'grid-cols-1'
          }`}>
            {filteredNFTs.map((nft, index) => (
              <motion.div
                key={nft.tokenId.toString()}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
              >
                <NFTCard
                  nft={nft}
                  onBuy={() => handleBuyNFT(nft)}
                  showBuyButton={!isBuying && nft.currentlyListed}
                  className={viewMode === 'list' ? 'flex' : ''}
                />
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}