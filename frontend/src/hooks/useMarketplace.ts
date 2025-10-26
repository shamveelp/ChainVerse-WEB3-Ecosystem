'use client';

import { useAccount, useConfig, useReadContract, useWriteContract, useChainId } from 'wagmi';
import { waitForTransactionReceipt, readContract } from '@wagmi/core';
import { parseEther, formatEther } from 'viem';
import { MARKETPLACE_ABI, NFT_ABI, getContractAddress } from '@/lib/web3-config';
import { useState, useEffect, useMemo } from 'react';
import { fetchMetadata, NFTMetadata } from '@/lib/ipfs';
import { toast } from 'sonner';

export interface NFTItem {
  itemId: bigint;
  nftContract: string;
  tokenId: bigint;
  seller: string;
  owner: string;
  price: bigint;
  sold: boolean;
  metadata?: NFTMetadata;
}

export interface MarketStats {
  totalItems: number;
  soldItems: number;
  activeItems: number;
}

export function useMarketplace() {
  const { address } = useAccount();
  const chainId = useChainId();
  const config = useConfig();

  // Get network-specific contract addresses
  const MARKETPLACE_ADDRESS = getContractAddress(chainId, 'marketplace') as `0x${string}`;
  const NFT_CONTRACT_ADDRESS = getContractAddress(chainId, 'nft') as `0x${string}`;

  const [marketItems, setMarketItems] = useState<NFTItem[]>([]);
  const [myNFTs, setMyNFTs] = useState<NFTItem[]>([]);
  const [listedItems, setListedItems] = useState<NFTItem[]>([]);
  const [marketStats, setMarketStats] = useState<MarketStats>({
    totalItems: 0,
    soldItems: 0,
    activeItems: 0,
  });
  const [loadingData, setLoadingData] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Contract reads with automatic refetch
  const { data: listingPrice, refetch: refetchListingPrice } = useReadContract({
    address: MARKETPLACE_ADDRESS,
    abi: MARKETPLACE_ABI,
    functionName: 'getListingPrice',
  });

  const { data: statsData, refetch: refetchStats } = useReadContract({
    address: MARKETPLACE_ADDRESS,
    abi: MARKETPLACE_ABI,
    functionName: 'getMarketStats',
  });

  const marketItemsQuery = useReadContract({
    address: MARKETPLACE_ADDRESS,
    abi: MARKETPLACE_ABI,
    functionName: 'fetchMarketItems',
  });

  const myNFTsQuery = useReadContract({
    address: MARKETPLACE_ADDRESS,
    abi: MARKETPLACE_ABI,
    functionName: 'fetchMyNFTs',
    account: address,
    query: { enabled: !!address },
  });

  const listedItemsQuery = useReadContract({
    address: MARKETPLACE_ADDRESS,
    abi: MARKETPLACE_ABI,
    functionName: 'fetchItemsListed',
    account: address,
    query: { enabled: !!address },
  });

  // Write contract hook
  const { writeContractAsync, isPending: isWriting } = useWriteContract();

  // Update market stats
  useEffect(() => {
    if (statsData) {
      const [totalItems, soldItems, activeItems] = statsData as [bigint, bigint, bigint];
      setMarketStats({
        totalItems: Number(totalItems),
        soldItems: Number(soldItems),
        activeItems: Number(activeItems),
      });
    }
  }, [statsData]);

  // Fetch metadata for NFTs
  const loadNFTsWithMetadata = async (items: any[]): Promise<NFTItem[]> => {
    if (!items || items.length === 0) return [];

    

    const itemsWithMetadata = await Promise.all(
      items.map(async (item) => {
        try {
          // Get token URI from the NFT contract
          const tokenURI = await readContract(config, {
            address: item.nftContract as `0x${string}`,
            abi: NFT_ABI,
            functionName: 'tokenURI',
            args: [item.tokenId],
          }) as string;
          
          
          
          const metadata = await fetchMetadata(tokenURI);
          
          
          return { ...item, metadata };
        } catch (error) {
          console.error('Error fetching metadata for token:', item.tokenId, error);
          return {
            ...item,
            metadata: {
              name: `NFT #${item.tokenId}`,
              description: 'Metadata unavailable',
              image: '/placeholder-nft.png',
            },
          };
        }
      })
    );

    
    return itemsWithMetadata;
  };

  // Load market data with metadata
  useEffect(() => {
    (async () => {
      
      if (!marketItemsQuery.data) return;
      
      setLoadingData(true);
      try {
        const items = await loadNFTsWithMetadata(marketItemsQuery.data as any[]);
        
        setMarketItems(items);
      } catch (error) {
        console.error('Error loading market items:', error);
        toast.error('Failed to load marketplace items');
      } finally {
        setLoadingData(false);
      }
    })();
  }, [marketItemsQuery.data, refreshTrigger]);

  useEffect(() => {
    (async () => {
      
      if (!myNFTsQuery.data) return;
      
      try {
        const items = await loadNFTsWithMetadata(myNFTsQuery.data as any[]);
        
        setMyNFTs(items);
      } catch (error) {
        console.error('Error loading my NFTs:', error);
      }
    })();
  }, [myNFTsQuery.data, refreshTrigger]);

  useEffect(() => {
    (async () => {
      
      if (!listedItemsQuery.data) return;
      
      try {
        const items = await loadNFTsWithMetadata(listedItemsQuery.data as any[]);
        
        setListedItems(items);
      } catch (error) {
        console.error('Error loading listed items:', error);
      }
    })();
  }, [listedItemsQuery.data, refreshTrigger]);

  // Actions
  const listNFT = async (tokenId: bigint, price: string) => {
    try {
      if (!address) throw new Error('Wallet not connected');
      
      toast.info('Approving NFT for marketplace...');
      
      // 1) Approve marketplace to transfer NFT
      const approveHash = await writeContractAsync({
        address: NFT_CONTRACT_ADDRESS,
        abi: NFT_ABI,
        functionName: 'approve',
        args: [MARKETPLACE_ADDRESS, tokenId],
      });

      await waitForTransactionReceipt(config, { hash: approveHash });
      
      toast.info('Creating market listing...');

      // 2) Create market item (pay listing fee)
      const listingFee = (listingPrice ?? 0n) as bigint;
      const listHash = await writeContractAsync({
        address: MARKETPLACE_ADDRESS,
        abi: MARKETPLACE_ABI,
        functionName: 'createMarketItem',
        args: [NFT_CONTRACT_ADDRESS, tokenId, parseEther(price)],
        value: listingFee,
      });

      await waitForTransactionReceipt(config, { hash: listHash });

      toast.success('NFT successfully listed for sale!');
      
      // Refresh all data
      await refreshData();
    } catch (error: any) {
      console.error('Error listing NFT:', error);
      toast.error(error.shortMessage || error.message || 'Failed to list NFT');
      throw error;
    }
  };

  const buyNFT = async (itemId: bigint, price: bigint) => {
    try {
      if (!address) throw new Error('Wallet not connected');
      
      toast.info('Processing purchase...');
      
      const hash = await writeContractAsync({
        address: MARKETPLACE_ADDRESS,
        abi: MARKETPLACE_ABI,
        functionName: 'createMarketSale',
        args: [NFT_CONTRACT_ADDRESS, itemId],
        value: price,
      });

      await waitForTransactionReceipt(config, { hash });
      
      toast.success('NFT purchased successfully! 🎉');
      
      await refreshData();
    } catch (error: any) {
      console.error('Error buying NFT:', error);
      toast.error(error.shortMessage || error.message || 'Failed to purchase NFT');
      throw error;
    }
  };

  const mintAndListNFT = async (tokenURI: string, price?: string) => {
    try {
      if (!address) throw new Error('Wallet not connected');
      
      if (price && parseFloat(price) > 0) {
        // Mint and list in one transaction
        toast.info('Minting and listing NFT...');
        
        const listingFee = (listingPrice ?? 0n) as bigint;
        const hash = await writeContractAsync({
          address: MARKETPLACE_ADDRESS,
          abi: MARKETPLACE_ABI,
          functionName: 'mintAndList',
          args: [NFT_CONTRACT_ADDRESS, tokenURI, parseEther(price)],
          value: listingFee,
        });

        await waitForTransactionReceipt(config, { hash });
        
        toast.success('NFT minted and listed successfully! 🚀');
      } else {
        // Just mint
        toast.info('Minting NFT...');
        
        const hash = await writeContractAsync({
          address: NFT_CONTRACT_ADDRESS,
          abi: NFT_ABI,
          functionName: 'mintNFT',
          args: [address as `0x${string}`, tokenURI],
        });

        await waitForTransactionReceipt(config, { hash });
        
        toast.success('NFT minted successfully! 🎨');
      }

      await refreshData();
    } catch (error: any) {
      console.error('Error minting NFT:', error);
      toast.error(error.shortMessage || error.message || 'Failed to mint NFT');
      throw error;
    }
  };

  const refreshData = async () => {
    try {
      
      
      // Force refresh all queries
      await Promise.all([
        marketItemsQuery.refetch?.(),
        myNFTsQuery.refetch?.(),
        listedItemsQuery.refetch?.(),
        refetchStats(),
        refetchListingPrice(),
      ]);
      
      // Trigger re-render
      setRefreshTrigger(prev => prev + 1);
      
      
    } catch (error) {
      console.error('Error refreshing data:', error);
    }
  };

  const formattedListingPrice = useMemo(
    () => (listingPrice ? formatEther(listingPrice as bigint) : '0'),
    [listingPrice]
  );

  return {
    marketItems,
    myNFTs,
    listedItems,
    marketStats,
    listingPrice: formattedListingPrice,
    loading: loadingData || isWriting,
    listNFT,
    buyNFT,
    mintAndListNFT,
    refreshData,
    contractAddresses: {
      marketplace: MARKETPLACE_ADDRESS,
      nft: NFT_CONTRACT_ADDRESS,
    },
  };
}