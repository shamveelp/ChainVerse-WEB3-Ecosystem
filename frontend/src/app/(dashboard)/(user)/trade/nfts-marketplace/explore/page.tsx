'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, Filter } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { NFTCard } from '@/components/nft/nft-card';
import { LoadingGrid } from '@/components/nft/loading-skeleton';
import { useNFTContract } from '@/hooks/nft/useNFTContract';
import { NFTWithMetadata } from '@/types/types-nft';
import { useActiveAccount } from 'thirdweb/react';
import { toast } from 'sonner';
import { useQuery } from "convex/react";
import { api } from "../../../../../../../convex/_generated/api";
import { NFT_MARKETPLACE_ADDRESS } from '@/lib/nft/contracts';
import { useMutation } from "convex/react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { AlertCircle, Scale, MessageSquareWarning } from 'lucide-react';


const sortOptions = [
  { value: 'recent', label: 'Recently Listed' },
  { value: 'price-low', label: 'Price: Low to High' },
  { value: 'price-high', label: 'Price: High to Low' },
  { value: 'name', label: 'Name A-Z' },
];

export default function ExplorePage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('recent');
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

  const hiddenTokenIds = useQuery(api.nft.getHiddenTokenIds, { contract: NFT_MARKETPLACE_ADDRESS });

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

    // Apply hidden filter
    if (hiddenTokenIds) {
      filtered = filtered.filter(nft => !hiddenTokenIds.includes(nft.tokenId.toString()));
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
  }, [searchTerm, sortBy, enrichedNFTs, hiddenTokenIds]);

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
    } catch (error: unknown) {
      console.error('Error buying NFT:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to buy NFT';
      toast.error(errorMessage);
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


        </motion.div>

        {/* Rules and Report Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.15 }}
          className="mb-8 flex gap-4"
        >
          <RulesDialog />
          <ReportDialog />
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
          <div className="grid gap-6 grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
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
                />
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function RulesDialog() {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Scale className="h-4 w-4" />
          Platform Rules
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Marketplace Rules & Guidelines</DialogTitle>
          <DialogDescription>
            Please respect our community standards to keep the marketplace safe and enjoyable for everyone.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
          <div className="p-4 bg-muted/50 rounded-lg">
            <p className="text-sm text-foreground mb-2 font-medium">Concept</p>
            <p className="text-sm text-muted-foreground">
              ChainVerse NFT Marketplace is a platform where every user can understand the concept of NFTs and explore via testnets. We encourage creativity and learning.
            </p>
          </div>
          <ul className="space-y-3">
            <li className="flex gap-3 text-sm">
              <AlertCircle className="h-5 w-5 text-red-500 shrink-0" />
              <span><strong>No 18+ Content:</strong> Explicit or adult content is strictly prohibited.</span>
            </li>
            <li className="flex gap-3 text-sm">
              <AlertCircle className="h-5 w-5 text-red-500 shrink-0" />
              <span><strong>Privacy First:</strong> Do not use personal photos of yourself or others without consent.</span>
            </li>
            <li className="flex gap-3 text-sm">
              <AlertCircle className="h-5 w-5 text-red-500 shrink-0" />
              <span><strong>Be Purposeful:</strong> Avoid creating NFTs of random, meaningless objects. Ensure your creations have intent.</span>
            </li>
            <li className="flex gap-3 text-sm">
              <span className="h-5 w-5 rounded-full bg-green-500/20 text-green-500 flex items-center justify-center text-xs font-bold shrink-0">✓</span>
              <span><strong>Original Art:</strong> Create yours own art! We celebrate unique and original creations.</span>
            </li>
          </ul>
        </div>
        <DialogFooter>
          <Button type="button" variant="secondary" className="w-full sm:w-auto" onClick={() => setOpen(false)}>
            I Understand
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ReportDialog() {
  const [tokenId, setTokenId] = useState('');
  const [reason, setReason] = useState('18+');
  const [otherReason, setOtherReason] = useState('');
  const [detailedReason, setDetailedReason] = useState('');
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const createReport = useMutation(api.nftReports.createReport);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const finalReason = reason === 'other' ? otherReason : reason;
      if (!tokenId) {
        toast.error("Token ID is required");
        return;
      }
      if (reason === 'other' && !otherReason.trim()) {
        toast.error("Please specify the 'other' reason");
        return;
      }

      await createReport({
        tokenId,
        reason: finalReason,
        detailedReason,
      });

      toast.success("Report submitted successfully");
      setOpen(false);
      // Reset form
      setTokenId('');
      setReason('18+');
      setOtherReason('');
      setDetailedReason('');
    } catch (error) {
      console.error("Failed to submit report:", error);
      toast.error("Failed to submit report. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="destructive" className="gap-2">
          <MessageSquareWarning className="h-4 w-4" />
          Report Issue
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Report an Issue</DialogTitle>
          <DialogDescription>
            Found something that violates our rules? Let us know.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="tokenId">Token ID (NFT ID)</Label>
            <Input
              id="tokenId"
              placeholder="e.g. 123"
              value={tokenId}
              onChange={(e) => setTokenId(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label>Reason for reporting</Label>
            <RadioGroup value={reason} onValueChange={setReason} className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div className="flex items-center space-x-2 border rounded-md p-3 hover:bg-muted/50 cursor-pointer">
                <RadioGroupItem value="18+" id="r1" />
                <Label htmlFor="r1" className="cursor-pointer">18+ Content</Label>
              </div>
              <div className="flex items-center space-x-2 border rounded-md p-3 hover:bg-muted/50 cursor-pointer">
                <RadioGroupItem value="personal" id="r2" />
                <Label htmlFor="r2" className="cursor-pointer">Personal/Private Photo</Label>
              </div>
              <div className="flex items-center space-x-2 border rounded-md p-3 hover:bg-muted/50 cursor-pointer">
                <RadioGroupItem value="spam" id="r3" />
                <Label htmlFor="r3" className="cursor-pointer">Spam/Random</Label>
              </div>
              <div className="flex items-center space-x-2 border rounded-md p-3 hover:bg-muted/50 cursor-pointer">
                <RadioGroupItem value="other" id="r4" />
                <Label htmlFor="r4" className="cursor-pointer">Other</Label>
              </div>
            </RadioGroup>
          </div>

          {reason === 'other' && (
            <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
              <Label htmlFor="other">Please specify</Label>
              <Input
                id="other"
                placeholder="What is the issue?"
                value={otherReason}
                onChange={(e) => setOtherReason(e.target.value)}
                required
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="details">Additional Details (Optional)</Label>
            <Textarea
              id="details"
              placeholder="Provide any extra context..."
              value={detailedReason}
              onChange={(e) => setDetailedReason(e.target.value)}
              className="resize-none"
              rows={3}
            />
          </div>
          <DialogFooter className="pt-4">
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? 'Submitting...' : 'Submit Report'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}