import { ethers } from 'ethers';
import { NFT_MARKETPLACE_ADDRESS, NFT_MARKETPLACE_ABI } from '../../lib/nft/contracts';

// Public providers for read-only operations
const SEPOLIA_RPC = 'https://sepolia.infura.io/v3/84842078b09946638c03157f83405213';
const publicProvider = new ethers.JsonRpcProvider(SEPOLIA_RPC);

export const getPublicContract = () => {
  return new ethers.Contract(NFT_MARKETPLACE_ADDRESS, NFT_MARKETPLACE_ABI, publicProvider);
};

export const isValidEthereumAddress = (address: string): boolean => {
  try {
    return ethers.isAddress(address);
  } catch {
    return false;
  }
};

// Public read-only functions that work without wallet connection
export const publicContractMethods = {
  getAllNFTs: async () => {
    const contract = getPublicContract();
    return await contract.getAllNFTs();
  },
  
  getListedTokenForId: async (tokenId: bigint) => {
    const contract = getPublicContract();
    return await contract.getListedTokenForId(tokenId);
  },
  
  getTokenURI: async (tokenId: bigint) => {
    const contract = getPublicContract();
    return await contract.tokenURI(tokenId);
  },
  
  getOwnerOf: async (tokenId: bigint) => {
    const contract = getPublicContract();
    return await contract.ownerOf(tokenId);
  },
  
  getMarketplaceStats: async () => {
    const contract = getPublicContract();
    return await contract.getCompanyStats();
  },
  
  getListPrice: async () => {
    const contract = getPublicContract();
    return await contract.getListPrice();
  }
};