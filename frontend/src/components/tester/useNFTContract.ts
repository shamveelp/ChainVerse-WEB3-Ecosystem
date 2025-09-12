'use client';

import { useState, useCallback } from 'react';
import { ethers } from 'ethers';
import { NFT_MARKETPLACE_ADDRESS, NFT_MARKETPLACE_ABI } from './contracts';
import { ListedToken, NFTWithMetadata, NFTMetadata } from './types-nft';
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

      const tx = await contract.createToken(tokenURI, priceInWei, {
        value: listPrice,
      });

      setTxHash(tx.hash);
      await tx.wait();
      
      return tx;
    } catch (error: any) {
      setError(error.message || 'Failed to create token');
      throw error;
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
      const tx = await contract.executeSale(tokenId, {
        value: price,
      });

      setTxHash(tx.hash);
      await tx.wait();
      
      return tx;
    } catch (error: any) {
      setError(error.message || 'Failed to buy NFT');
      throw error;
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

      const tx = await contract.relistToken(tokenId, priceInWei, {
        value: listPrice,
      });

      setTxHash(tx.hash);
      await tx.wait();
      
      return tx;
    } catch (error: any) {
      setError(error.message || 'Failed to relist NFT');
      throw error;
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
        price: item.price,
        currentlyListed: item.currentlyListed,
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
        price: item.price,
        currentlyListed: item.currentlyListed,
      }));
    } catch (error: any) {
      console.error('Error fetching my NFTs:', error);
      return [];
    }
  };

  const getListPrice = async (): Promise<string> => {
    if (!signer) return '0.01';

    try {
      const contract = getContract();
      const listPrice = await contract.getListPrice();
      return ethers.formatEther(listPrice);
    } catch (error: any) {
      console.error('Error fetching list price:', error);
      return '0.01';
    }
  };

  const fetchNFTMetadata = async (tokenId: bigint): Promise<NFTMetadata | null> => {
    if (!signer) return null;

    try {
      const contract = getContract();
      const tokenURI = await contract.tokenURI(tokenId);
      
      const response = await fetch(tokenURI);
      const metadata: NFTMetadata = await response.json();
      return metadata;
    } catch (error: any) {
      console.error(`Error fetching metadata for token ${tokenId}:`, error);
      return null;
    }
  };

  const enrichNFTsWithMetadata = async (nfts: ListedToken[]): Promise<NFTWithMetadata[]> => {
    const enrichedNFTs = await Promise.all(
      nfts.map(async (nft) => {
        const metadata = await fetchNFTMetadata(nft.tokenId);
        return {
          ...nft,
          metadata,
          imageUrl: metadata?.image || metadata?.img_url,
          formattedPrice: ethers.formatEther(nft.price),
        };
      })
    );

    return enrichedNFTs as NFTWithMetadata[];
  };

  return {
    // Contract interactions
    createToken,
    buyNFT,
    relistNFT,
    getAllNFTs,
    getMyNFTs,
    getListPrice,
    fetchNFTMetadata,
    enrichNFTsWithMetadata,
    
    // State
    isLoading,
    txHash,
    error,
    isConnected,
  };
};