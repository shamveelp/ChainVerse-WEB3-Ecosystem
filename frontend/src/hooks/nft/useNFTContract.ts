'use client';

import { useState, useCallback, useMemo } from 'react';
import { ethers } from 'ethers';
import { useActiveAccount, useSendTransaction } from 'thirdweb/react';
import { prepareContractCall, getContract, readContract } from 'thirdweb';
import { NFT_MARKETPLACE_ADDRESS, NFT_MARKETPLACE_ABI } from '@/lib/nft/contracts';
import { ListedToken, NFTWithMetadata, NFTMetadata, SaleDetails, MarketplaceStats } from '@/types/types-nft';
import { client } from '@/lib/thirdweb-client';
import { sepolia } from 'thirdweb/chains';

interface RawToken {
  tokenId: bigint;
  owner: string;
  seller: string;
  creator: string;
  price: bigint;
  currentlyListed: boolean;
  createdAt: bigint;
}

export const useNFTContract = () => {
  const account = useActiveAccount();
  const { mutateAsync: sendTransaction } = useSendTransaction();
  const [isLoading, setIsLoading] = useState(false);
  const [txHash, setTxHash] = useState<string>('');
  const [error, setError] = useState<string>('');

  // Initialize contract with ABI - Memoized to prevent infinite loops in hooks
  const contract = useMemo(() => getContract({
    client,
    address: NFT_MARKETPLACE_ADDRESS,
    chain: sepolia,
    abi: NFT_MARKETPLACE_ABI,
  }), []);

  // CREATE TOKEN
  const createToken = useCallback(async (tokenURI: string, price: string) => {
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
    } catch (err) {
      const error = err as Error & { reason?: string };
      const message = error.reason || error.message || 'Failed to create token';
      setError(message);
      throw new Error(message);
    } finally {
      setIsLoading(false);
    }
  }, [account, contract, sendTransaction]);

  // BUY NFT
  const buyNFT = useCallback(async (tokenId: bigint, price: bigint) => {
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
    } catch (err) {
      const error = err as Error & { reason?: string };
      const message = error.reason || error.message || 'Failed to buy NFT';
      setError(message);
      throw new Error(message);
    } finally {
      setIsLoading(false);
    }
  }, [account, contract, sendTransaction]);

  // RELIST NFT
  const relistNFT = useCallback(async (tokenId: bigint, price: string) => {
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
    } catch (err) {
      const error = err as Error & { reason?: string };
      const message = error.reason || error.message || 'Failed to relist NFT';
      setError(message);
      throw new Error(message);
    } finally {
      setIsLoading(false);
    }
  }, [account, contract, sendTransaction]);

  // CANCEL LISTING
  const cancelListing = useCallback(async (tokenId: bigint) => {
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
    } catch (err) {
      const error = err as Error & { reason?: string };
      const message = error.reason || error.message || 'Failed to cancel listing';
      setError(message);
      throw new Error(message);
    } finally {
      setIsLoading(false);
    }
  }, [account, contract, sendTransaction]);

  // GET ALL NFTs
  const getAllNFTs = useCallback(async (): Promise<ListedToken[]> => {
    try {
      const result = await readContract({
        contract,
        method: 'getAllNFTs',
        params: [],
      });

      return (result as unknown as RawToken[]).map((item) => ({
        tokenId: item.tokenId,
        owner: item.owner,
        seller: item.seller,
        creator: item.creator,
        price: item.price,
        currentlyListed: item.currentlyListed,
        createdAt: item.createdAt,
      }));
    } catch (error) {
      console.error('Error fetching all NFTs:', error);
      return [];
    }
  }, [contract]);

  // GET MY NFTs
  const getMyNFTs = useCallback(async (): Promise<ListedToken[]> => {
    if (!account) return [];
    try {
      const result = await readContract({
        contract,
        method: 'getMyNFTs',
        params: [],
      });

      return (result as unknown as RawToken[]).map((item) => ({
        tokenId: item.tokenId,
        owner: item.owner,
        seller: item.seller,
        creator: item.creator,
        price: item.price,
        currentlyListed: item.currentlyListed,
        createdAt: item.createdAt,
      }));
    } catch (error) {
      console.error('Error fetching my NFTs:', error);
      return [];
    }
  }, [account, contract]);

  // GET LISTED TOKEN FOR ID
  const getListedTokenForId = useCallback(async (tokenId: bigint): Promise<ListedToken | null> => {
    try {
      const item = await readContract({
        contract,
        method: 'getListedTokenForId',
        params: [tokenId],
      });

      const rawItem = item as unknown as RawToken;

      if (Number(rawItem.tokenId) === 0) return null;
      return {
        tokenId: rawItem.tokenId,
        owner: rawItem.owner,
        seller: rawItem.seller,
        creator: rawItem.creator,
        price: rawItem.price,
        currentlyListed: rawItem.currentlyListed,
        createdAt: rawItem.createdAt,
      };
    } catch (error) {
      console.error(`Error fetching token ${tokenId}:`, error);
      return null;
    }
  }, [contract]);

  // GET LIST PRICE
  const getListPrice = useCallback(async (): Promise<string> => {
    try {
      const listPrice = await readContract({
        contract,
        method: 'getListPrice',
        params: [],
      });
      return ethers.formatEther(listPrice);
    } catch (error) {
      console.error('Error fetching list price:', error);
      return '0.000001';
    }
  }, [contract]);

  // GET MIN PRICE
  const getMinPrice = useCallback(async (): Promise<string> => {
    try {
      const minPrice = await readContract({
        contract,
        method: 'getMinPrice',
        params: [],
      });
      return ethers.formatEther(minPrice);
    } catch (error) {
      console.error('Error fetching min price:', error);
      return '0.000001';
    }
  }, [contract]);

  // MARKETPLACE STATS
  const getMarketplaceStats = useCallback(async (): Promise<MarketplaceStats> => {
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
    } catch (error) {
      console.error('Error fetching marketplace stats:', error);
      return { totalTokens: 0, totalSold: 0, currentListings: 0 };
    }
  }, [contract]);

  // FETCH NFT METADATA
  const fetchNFTMetadata = useCallback(async (tokenId: bigint): Promise<NFTMetadata | null> => {
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
    } catch (error) {
      console.error(`Error fetching metadata for token ${tokenId}:`, error);
      return null;
    }
  }, [contract]);

  // ENRICH NFTS WITH METADATA
  const enrichNFTsWithMetadata = useCallback(async (nfts: ListedToken[]): Promise<NFTWithMetadata[]> => {
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
  }, [fetchNFTMetadata]);

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
