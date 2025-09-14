'use client';

import { useState } from 'react';
import { ethers } from 'ethers';
import { useActiveAccount, useSendTransaction } from 'thirdweb/react';
import { prepareContractCall, getContract, readContract } from 'thirdweb';
import { NFT_MARKETPLACE_ADDRESS, NFT_MARKETPLACE_ABI } from '@/lib/nft/contracts';
import { ListedToken, NFTWithMetadata, NFTMetadata, SaleDetails, MarketplaceStats } from '@/types/types-nft';
import { client } from '@/lib/thirdweb-client';
import { sepolia } from 'thirdweb/chains';

export const useNFTContract = () => {
  const account = useActiveAccount();
  const { mutateAsync: sendTransaction } = useSendTransaction();
  const [isLoading, setIsLoading] = useState(false);
  const [txHash, setTxHash] = useState<string>('');
  const [error, setError] = useState<string>('');

  // Initialize contract with ABI
  const contract = getContract({
    client,
    address: NFT_MARKETPLACE_ADDRESS,
    chain: sepolia,
    abi: NFT_MARKETPLACE_ABI,
  });

  // CREATE TOKEN
  const createToken = async (tokenURI: string, price: string) => {
    if (!account) {
      throw new Error('Wallet not connected');
    }

    try {
      setIsLoading(true);
      setError('');

      const priceInWei = ethers.parseEther(price);

      const listPrice = await readContract({
        contract,
        method: 'getListPrice',
        params: [],
      });

      const transaction = prepareContractCall({
        contract,
        method: 'createToken',
        params: [tokenURI, priceInWei],
        value: listPrice,
      });

      const result = await sendTransaction(transaction);
      setTxHash(result.transactionHash);

      return result;
    } catch (error: any) {
      const message = error.reason || error.message || 'Failed to create token';
      setError(message);
      throw new Error(message);
    } finally {
      setIsLoading(false);
    }
  };

  // BUY NFT
  const buyNFT = async (tokenId: bigint, price: bigint) => {
    if (!account) {
      throw new Error('Wallet not connected');
    }

    try {
      setIsLoading(true);
      setError('');

      const transaction = prepareContractCall({
        contract,
        method: 'executeSale',
        params: [tokenId],
        value: price,
      });

      const result = await sendTransaction(transaction);
      setTxHash(result.transactionHash);

      return result;
    } catch (error: any) {
      const message = error.reason || error.message || 'Failed to buy NFT';
      setError(message);
      throw new Error(message);
    } finally {
      setIsLoading(false);
    }
  };

  // RELIST NFT
  const relistNFT = async (tokenId: bigint, price: string) => {
    if (!account) {
      throw new Error('Wallet not connected');
    }

    try {
      setIsLoading(true);
      setError('');

      const priceInWei = ethers.parseEther(price);
      const listPrice = await readContract({
        contract,
        method: 'getListPrice',
        params: [],
      });

      const transaction = prepareContractCall({
        contract,
        method: 'relistToken',
        params: [tokenId, priceInWei],
        value: listPrice,
      });

      const result = await sendTransaction(transaction);
      setTxHash(result.transactionHash);

      return result;
    } catch (error: any) {
      const message = error.reason || error.message || 'Failed to relist NFT';
      setError(message);
      throw new Error(message);
    } finally {
      setIsLoading(false);
    }
  };

  // CANCEL LISTING
  const cancelListing = async (tokenId: bigint) => {
    if (!account) {
      throw new Error('Wallet not connected');
    }

    try {
      setIsLoading(true);
      setError('');

      const transaction = prepareContractCall({
        contract,
        method: 'cancelListing',
        params: [tokenId],
      });

      const result = await sendTransaction(transaction);
      setTxHash(result.transactionHash);

      return result;
    } catch (error: any) {
      const message = error.reason || error.message || 'Failed to cancel listing';
      setError(message);
      throw new Error(message);
    } finally {
      setIsLoading(false);
    }
  };

  // GET ALL NFTs
  const getAllNFTs = async (): Promise<ListedToken[]> => {
    try {
      const result = await readContract({
        contract,
        method: 'getAllNFTs',
        params: [],
      });

      return (result as any[]).map((item: any) => ({
        tokenId: item.tokenId,
        owner: item.owner,
        seller: item.seller,
        creator: item.creator,
        price: item.price,
        currentlyListed: item.currentlyListed,
        createdAt: item.createdAt,
      }));
    } catch (error: any) {
      console.error('Error fetching all NFTs:', error);
      return [];
    }
  };

  // GET MY NFTs
  const getMyNFTs = async (): Promise<ListedToken[]> => {
    if (!account) return [];
    try {
      const result = await readContract({
        contract,
        method: 'getMyNFTs',
        params: [],
      });

      return (result as any[]).map((item: any) => ({
        tokenId: item.tokenId,
        owner: item.owner,
        seller: item.seller,
        creator: item.creator,
        price: item.price,
        currentlyListed: item.currentlyListed,
        createdAt: item.createdAt,
      }));
    } catch (error: any) {
      console.error('Error fetching my NFTs:', error);
      return [];
    }
  };

  // GET LISTED TOKEN FOR ID
  const getListedTokenForId = async (tokenId: bigint): Promise<ListedToken | null> => {
    try {
      const item = await readContract({
        contract,
        method: 'getListedTokenForId',
        params: [tokenId],
      });

      if (Number((item as any).tokenId) === 0) return null;
      return {
        tokenId: (item as any).tokenId,
        owner: (item as any).owner,
        seller: (item as any).seller,
        creator: (item as any).creator,
        price: (item as any).price,
        currentlyListed: (item as any).currentlyListed,
        createdAt: (item as any).createdAt,
      };
    } catch (error: any) {
      console.error(`Error fetching token ${tokenId}:`, error);
      return null;
    }
  };

  // GET LIST PRICE
  const getListPrice = async (): Promise<string> => {
    try {
      const listPrice = await readContract({
        contract,
        method: 'getListPrice',
        params: [],
      });
      return ethers.formatEther(listPrice);
    } catch (error: any) {
      console.error('Error fetching list price:', error);
      return '0.000001';
    }
  };

  // GET MIN PRICE
  const getMinPrice = async (): Promise<string> => {
    try {
      const minPrice = await readContract({
        contract,
        method: 'getMinPrice',
        params: [],
      });
      return ethers.formatEther(minPrice);
    } catch (error: any) {
      console.error('Error fetching min price:', error);
      return '0.000001';
    }
  };

  // MARKETPLACE STATS
  const getMarketplaceStats = async (): Promise<MarketplaceStats> => {
    try {
      const result = await readContract({
        contract,
        method: 'getCompanyStats',
        params: [],
      });

      const [totalTokens, totalSold, currentListings] = result as [bigint, bigint, bigint];
      return {
        totalTokens: Number(totalTokens),
        totalSold: Number(totalSold),
        currentListings: Number(currentListings),
      };
    } catch (error: any) {
      console.error('Error fetching marketplace stats:', error);
      return { totalTokens: 0, totalSold: 0, currentListings: 0 };
    }
  };

  // FETCH NFT METADATA
  const fetchNFTMetadata = async (tokenId: bigint): Promise<NFTMetadata | null> => {
    try {
      const tokenURI = await readContract({
        contract,
        method: 'tokenURI',
        params: [tokenId],
      });

      if (!tokenURI) return null;

      const response = await fetch(tokenURI as string);
      if (!response.ok) throw new Error('Failed to fetch metadata');

      const metadata: NFTMetadata = await response.json();
      return metadata;
    } catch (error: any) {
      console.error(`Error fetching metadata for token ${tokenId}:`, error);
      return null;
    }
  };

  // ENRICH NFTS WITH METADATA
  const enrichNFTsWithMetadata = async (nfts: ListedToken[]): Promise<NFTWithMetadata[]> => {
    const enrichedNFTs = await Promise.allSettled(
      nfts.map(async (nft): Promise<NFTWithMetadata> => {
        const metadata = await fetchNFTMetadata(nft.tokenId);
        return {
          ...nft,
          metadata: metadata,
          imageUrl: metadata?.image || metadata?.img_url,
          formattedPrice: ethers.formatEther(nft.price),
        };
      })
    );

    return enrichedNFTs
      .filter((result): result is PromiseFulfilledResult<NFTWithMetadata> => result.status === 'fulfilled')
      .map((result) => result.value);
  };

  // SALE COMPUTATION
  const calculateSaleDetails = (price: bigint): SaleDetails => {
    const companyFee = (price * 250n) / 10000n; // 2.5%
    const creatorRoyalty = (price * 100n) / 10000n; // 1%
    const sellerAmount = price - companyFee - creatorRoyalty; // 96.5%

    return {
      price,
      companyFee,
      creatorRoyalty,
      sellerAmount,
    };
  };

  return {
    // Contract interactions
    createToken,
    buyNFT,
    relistNFT,
    cancelListing,
    getAllNFTs,
    getMyNFTs,
    getListedTokenForId,
    getListPrice,
    getMinPrice,
    getMarketplaceStats,
    fetchNFTMetadata,
    enrichNFTsWithMetadata,
    calculateSaleDetails,

    // State
    isLoading,
    txHash,
    error,
    isConnected: !!account,
  };
};
