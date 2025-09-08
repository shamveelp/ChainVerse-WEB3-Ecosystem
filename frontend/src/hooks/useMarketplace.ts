'use client';

import { useAccount, useConfig, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { waitForTransactionReceipt } from '@wagmi/core';
import { parseEther, formatEther } from 'viem';
import { MARKETPLACE_ADDRESS, MARKETPLACE_ABI, NFT_CONTRACT_ADDRESS, NFT_ABI } from '@/lib/web3-config';
import { useState, useEffect, useMemo } from 'react';
import { fetchMetadata, NFTMetadata } from '@/lib/ipfs';

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

export function useMarketplace() {
  const { address } = useAccount();
  const config = useConfig();

  const [marketItems, setMarketItems] = useState<NFTItem[]>([]);
  const [myNFTs, setMyNFTs] = useState<NFTItem[]>([]);
  const [listedItems, setListedItems] = useState<NFTItem[]>([]);
  const [loadingData, setLoadingData] = useState(false);

  // Reads
  const { data: listingPrice } = useReadContract({
    address: MARKETPLACE_ADDRESS,
    abi: MARKETPLACE_ABI,
    functionName: 'getListingPrice',
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
    account: address,           // ensures msg.sender is set for view calls that use it
    query: { enabled: !!address },
  });

  const listedItemsQuery = useReadContract({
    address: MARKETPLACE_ADDRESS,
    abi: MARKETPLACE_ABI,
    functionName: 'fetchItemsListed',
    account: address,           // ensures msg.sender is set
    query: { enabled: !!address },
  });

  // Writes
  const { writeContractAsync, isPending: isWriting } = useWriteContract();

  // Optionally, track last tx hash and receipt via hook (if you want UI feedback)
  // You can set a piece of state `lastTxHash` when writing, then pass here.
  // const { data: receipt, isLoading: isWaiting } = useWaitForTransactionReceipt({ hash: lastTxHash });

  // Fetch metadata for NFTs
  const loadNFTsWithMetadata = async (items: any[]): Promise<NFTItem[]> => {
    if (!items || items.length === 0) return [];

    const itemsWithMetadata = await Promise.all(
      items.map(async (item) => {
        try {
          const tokenURIResult = await fetch(`/api/tokenURI?tokenId=${item.tokenId}&contract=${item.nftContract}`);
          const tokenURI = await tokenURIResult.text();
          const metadata = await fetchMetadata(tokenURI);
          return { ...item, metadata };
        } catch (error) {
          console.error('Error fetching metadata:', error);
          return {
            ...item,
            metadata: {
              name: 'Unknown NFT',
              description: 'Metadata unavailable',
              image: '/placeholder-nft.png',
            },
          };
        }
      })
    );

    return itemsWithMetadata;
  };

  // Load/shape reads into UI state
  useEffect(() => {
    (async () => {
      if (!marketItemsQuery.data) return;
      setLoadingData(true);
      try {
        const items = await loadNFTsWithMetadata(marketItemsQuery.data as any[]);
        setMarketItems(items);
      } finally {
        setLoadingData(false);
      }
    })();
  }, [marketItemsQuery.data]);

  useEffect(() => {
    (async () => {
      if (!myNFTsQuery.data) return;
      const items = await loadNFTsWithMetadata(myNFTsQuery.data as any[]);
      setMyNFTs(items);
    })();
  }, [myNFTsQuery.data]);

  useEffect(() => {
    (async () => {
      if (!listedItemsQuery.data) return;
      const items = await loadNFTsWithMetadata(listedItemsQuery.data as any[]);
      setListedItems(items);
    })();
  }, [listedItemsQuery.data]);

  // Actions
  const listNFT = async (tokenId: bigint, price: string) => {
    // 1) Approve marketplace to transfer NFT
    const approveHash = await writeContractAsync({
      address: NFT_CONTRACT_ADDRESS,
      abi: NFT_ABI,
      functionName: 'approve',
      args: [MARKETPLACE_ADDRESS, tokenId],
    });

    await waitForTransactionReceipt(config, { hash: approveHash });

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

    // refresh reads
    await Promise.all([
      marketItemsQuery.refetch?.(),
      myNFTsQuery.refetch?.(),
      listedItemsQuery.refetch?.(),
    ]);
  };

  const buyNFT = async (itemId: bigint, price: bigint) => {
    const hash = await writeContractAsync({
      address: MARKETPLACE_ADDRESS,
      abi: MARKETPLACE_ABI,
      functionName: 'createMarketSale',
      args: [NFT_CONTRACT_ADDRESS, itemId],
      value: price,
    });

    await waitForTransactionReceipt(config, { hash });

    await Promise.all([
      marketItemsQuery.refetch?.(),
      myNFTsQuery.refetch?.(),
      listedItemsQuery.refetch?.(),
    ]);
  };

  const mintAndListNFT = async (tokenURI: string, price: string) => {
    // Keep parity with old behavior (only mint); extend to approve+list if desired.
    const hash = await writeContractAsync({
      address: NFT_CONTRACT_ADDRESS,
      abi: NFT_ABI,
      functionName: 'mintNFT',
      args: [address as `0x${string}`, tokenURI],
    });

    await waitForTransactionReceipt(config, { hash });

    await Promise.all([
      marketItemsQuery.refetch?.(),
      myNFTsQuery.refetch?.(),
      listedItemsQuery.refetch?.(),
    ]);
  };

  const refreshData = async () => {
    await Promise.all([
      marketItemsQuery.refetch?.(),
      myNFTsQuery.refetch?.(),
      listedItemsQuery.refetch?.(),
    ]);
  };

  const formattedListingPrice = useMemo(
    () => (listingPrice ? formatEther(listingPrice as bigint) : '0'),
    [listingPrice]
  );

  return {
    marketItems,
    myNFTs,
    listedItems,
    listingPrice: formattedListingPrice,
    loading: loadingData || isWriting,
    listNFT,
    buyNFT,
    mintAndListNFT,
    refreshData,
  };
}
