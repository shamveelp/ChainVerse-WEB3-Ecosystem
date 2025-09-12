'use client';

import { useState, useCallback } from 'react';
import { ethers } from 'ethers';
import { NFT_MARKETPLACE_ADDRESS, NFT_MARKETPLACE_ABI } from './contracts';
import { ListedToken, NFTWithMetadata, NFTMetadata, SaleDetails, MarketplaceStats } from './types-nft';
import { useWallet } from './wallet-provider';

export const useNFTContract = () => {
  const { signer, isConnected } = useWallet();
  const [isLoading, setIsLoading] = useState(false);
  const [txHash, setTxHash] = useState<string>('');
  const [error, setError] = useState<string>('');

  const getContract = useCallback(() => {
    if (!signer) throw new Error('Wallet not connected');
    return new ethers.Contract(NFT_MARKETPLACE_ADDRESS, NFT_MARKETPLACE_ABI, signer);
  }, [signer]);

  const createToken = async (tokenURI: string, price: string) => {
    if (!isConnected || !signer) {
      throw new Error('Wallet not connected');
    }

    try {
      setIsLoading(true);
      setError('');

      const contract = getContract();
      const priceInWei = ethers.parseEther(price);
      const listPrice = await contract.getListPrice();

      console.log('Creating token with price:', price, 'ETH');
      console.log('Listing fee:', ethers.formatEther(listPrice), 'ETH');

      const tx = await contract.createToken(tokenURI, priceInWei, {
        value: listPrice,
      });

      setTxHash(tx.hash);
      await tx.wait();

      return tx;
    } catch (error: any) {
      const message = error.reason || error.message || 'Failed to create token';
      setError(message);
      throw new Error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const buyNFT = async (tokenId: bigint, price: bigint) => {
    if (!isConnected || !signer) {
      throw new Error('Wallet not connected');
    }

    try {
      setIsLoading(true);
      setError('');

      const contract = getContract();
      
      console.log('Buying NFT:', tokenId.toString());
      console.log('Price:', ethers.formatEther(price), 'ETH');

      const tx = await contract.executeSale(tokenId, {
        value: price,
      });

      setTxHash(tx.hash);
      const receipt = await tx.wait();

      // Extract sale details from events
      const saleEvent = receipt.logs.find((log: any) => {
        try {
          const parsedLog = contract.interface.parseLog(log);
          return parsedLog?.name === 'TokenSold';
        } catch {
          return false;
        }
      });

      if (saleEvent) {
        const parsedLog = contract.interface.parseLog(saleEvent);
        console.log('Sale completed:', {
          tokenId: parsedLog?.args.tokenId.toString(),
          price: ethers.formatEther(parsedLog?.args.price),
          companyFee: ethers.formatEther(parsedLog?.args.companyFee),
          creatorRoyalty: ethers.formatEther(parsedLog?.args.creatorRoyalty)
        });
      }

      return tx;
    } catch (error: any) {
      const message = error.reason || error.message || 'Failed to buy NFT';
      setError(message);
      throw new Error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const relistNFT = async (tokenId: bigint, price: string) => {
    if (!isConnected || !signer) {
      throw new Error('Wallet not connected');
    }

    try {
      setIsLoading(true);
      setError('');

      const contract = getContract();
      const priceInWei = ethers.parseEther(price);
      const listPrice = await contract.getListPrice();

      console.log('Relisting NFT:', tokenId.toString());
      console.log('New price:', price, 'ETH');
      console.log('Listing fee:', ethers.formatEther(listPrice), 'ETH');

      const tx = await contract.relistToken(tokenId, priceInWei, {
        value: listPrice,
      });

      setTxHash(tx.hash);
      await tx.wait();

      return tx;
    } catch (error: any) {
      const message = error.reason || error.message || 'Failed to relist NFT';
      setError(message);
      throw new Error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const cancelListing = async (tokenId: bigint) => {
    if (!isConnected || !signer) {
      throw new Error('Wallet not connected');
    }

    try {
      setIsLoading(true);
      setError('');

      const contract = getContract();
      const tx = await contract.cancelListing(tokenId);

      setTxHash(tx.hash);
      await tx.wait();

      return tx;
    } catch (error: any) {
      const message = error.reason || error.message || 'Failed to cancel listing';
      setError(message);
      throw new Error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const getAllNFTs = async (): Promise<ListedToken[]> => {
    if (!signer) return [];

    try {
      const contract = getContract();
      const result = await contract.getAllNFTs();
      return result.map((item: any) => ({
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

  const getMyNFTs = async (): Promise<ListedToken[]> => {
    if (!signer) return [];

    try {
      const contract = getContract();
      const result = await contract.getMyNFTs();
      return result.map((item: any) => ({
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

  const getListedTokenForId = async (tokenId: bigint): Promise<ListedToken | null> => {
    if (!signer) return null;

    try {
      const contract = getContract();
      const item = await contract.getListedTokenForId(tokenId);
      if (Number(item.tokenId) === 0) return null;
      return {
        tokenId: item.tokenId,
        owner: item.owner,
        seller: item.seller,
        creator: item.creator,
        price: item.price,
        currentlyListed: item.currentlyListed,
        createdAt: item.createdAt,
      };
    } catch (error: any) {
      console.error(`Error fetching token ${tokenId}:`, error);
      return null;
    }
  };

  const getListPrice = async (): Promise<string> => {
    try {
      if (!signer) return '0.000001';

      const contract = getContract();
      const listPrice = await contract.getListPrice();
      return ethers.formatEther(listPrice);
    } catch (error: any) {
      console.error('Error fetching list price:', error);
      return '0.000001';
    }
  };

  const getMinPrice = async (): Promise<string> => {
    try {
      if (!signer) return '0.000001';

      const contract = getContract();
      const minPrice = await contract.getMinPrice();
      return ethers.formatEther(minPrice);
    } catch (error: any) {
      console.error('Error fetching min price:', error);
      return '0.000001';
    }
  };

  const getMarketplaceStats = async (): Promise<MarketplaceStats> => {
    try {
      if (!signer) return { totalTokens: 0, totalSold: 0, currentListings: 0 };

      const contract = getContract();
      const [totalTokens, totalSold, currentListings] = await contract.getCompanyStats();
      
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

  const fetchNFTMetadata = async (tokenId: bigint): Promise<NFTMetadata | null> => {
    if (!signer) return null;

    try {
      const contract = getContract();
      const tokenURI = await contract.tokenURI(tokenId);

      if (!tokenURI) return null;

      const response = await fetch(tokenURI);
      if (!response.ok) throw new Error('Failed to fetch metadata');

      const metadata: NFTMetadata = await response.json();
      return metadata;
    } catch (error: any) {
      console.error(`Error fetching metadata for token ${tokenId}:`, error);
      return null;
    }
  };

  const enrichNFTsWithMetadata = async (nfts: ListedToken[]): Promise<NFTWithMetadata[]> => {
    const enrichedNFTs = await Promise.allSettled(
      nfts.map(async (nft) => {
        const metadata = await fetchNFTMetadata(nft.tokenId);
        return {
          ...nft,
          metadata: metadata ?? null,
          imageUrl: metadata?.image || metadata?.img_url,
          formattedPrice: ethers.formatEther(nft.price),
        };
      })
    );

    return enrichedNFTs
      .filter((result): result is PromiseFulfilledResult<NFTWithMetadata> => 
        result.status === 'fulfilled'
      )
      .map(result => result.value as NFTWithMetadata);
  };

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
    isConnected,
  };
};