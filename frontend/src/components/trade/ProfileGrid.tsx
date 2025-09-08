'use client';

import { useState } from 'react';
import { NFTCard } from './NFTCard';
import { ListNFTModal } from './ListNFTModal';
import { useMarketplace } from '@/hooks/useMarketplace';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Loader2, Wallet, Tag } from 'lucide-react';

export function ProfileGrid() {
  const { myNFTs, listedItems, loading, listNFT } = useMarketplace();
  const [listModalOpen, setListModalOpen] = useState(false);
  const [selectedTokenId, setSelectedTokenId] = useState<bigint | null>(null);

  const handleListClick = (tokenId: bigint) => {
    setSelectedTokenId(tokenId);
    setListModalOpen(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center space-y-4">
          <Loader2 className="w-12 h-12 text-purple-400 animate-spin mx-auto" />
          <p className="text-gray-300">Loading your collection...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Tabs defaultValue="owned" className="w-full">
        <TabsList className="grid w-full grid-cols-2 bg-gray-800/50 border border-gray-600">
          <TabsTrigger 
            value="owned" 
            className="data-[state=active]:bg-purple-600/20 data-[state=active]:text-purple-400"
          >
            <Wallet className="w-4 h-4 mr-2" />
            Owned NFTs
            <Badge variant="secondary" className="ml-2">
              {myNFTs.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger 
            value="listed" 
            className="data-[state=active]:bg-purple-600/20 data-[state=active]:text-purple-400"
          >
            <Tag className="w-4 h-4 mr-2" />
            Listed NFTs
            <Badge variant="secondary" className="ml-2">
              {listedItems.length}
            </Badge>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="owned" className="mt-8">
          {myNFTs.length === 0 ? (
            <div className="text-center py-20">
              <Wallet className="w-16 h-16 text-gray-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">No NFTs found</h3>
              <p className="text-gray-400">You don't own any NFTs yet. Start by minting your first NFT!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {myNFTs.map((nft) => (
                <NFTCard
                  key={`owned-${nft.nftContract}-${nft.tokenId}`}
                  nft={nft}
                  onList={handleListClick}
                  showListButton={true}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="listed" className="mt-8">
          {listedItems.length === 0 ? (
            <div className="text-center py-20">
              <Tag className="w-16 h-16 text-gray-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">No listed NFTs</h3>
              <p className="text-gray-400">You haven't listed any NFTs for sale yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {listedItems.map((nft) => (
                <NFTCard
                  key={`listed-${nft.nftContract}-${nft.tokenId}`}
                  nft={nft}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <ListNFTModal
        open={listModalOpen}
        onOpenChange={setListModalOpen}
        tokenId={selectedTokenId}
        onList={listNFT}
        loading={loading}
      />
    </>
  );
}