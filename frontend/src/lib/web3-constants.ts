import { parseAbi } from 'viem';

// Enhanced ABI with all required functions
export const MARKETPLACE_ABI = parseAbi([
    'function getListingPrice() view returns (uint256)',
    'function createMarketItem(address nftContract, uint256 tokenId, uint256 price) payable',
    'function createMarketSale(address nftContract, uint256 itemId) payable',
    'function mintAndList(address nftContract, string tokenURI, uint256 price) payable returns (uint256)',
    'function fetchMarketItems() view returns ((uint256 itemId, address nftContract, uint256 tokenId, address seller, address owner, uint256 price, bool sold)[])',
    'function fetchMyNFTs() view returns ((uint256 itemId, address nftContract, uint256 tokenId, address seller, address owner, uint256 price, bool sold)[])',
    'function fetchItemsListed() view returns ((uint256 itemId, address nftContract, uint256 tokenId, address seller, address owner, uint256 price, bool sold)[])',
    'function getMarketStats() view returns (uint256 totalItems, uint256 soldItems, uint256 activeItems)',
    'function getMarketItem(uint256 itemId) view returns ((uint256 itemId, address nftContract, uint256 tokenId, address seller, address owner, uint256 price, bool sold))',
    'function getTotalItemsCreated() view returns (uint256)',
    'function getTotalItemsSold() view returns (uint256)',
    'function updateListingPrice(uint256 listingPrice)',
    'function setNFTContract(address nftContract)',
    'function withdrawBalance()',
    'event MarketItemCreated(uint256 indexed itemId, address indexed nftContract, uint256 indexed tokenId, address seller, address owner, uint256 price, bool sold)',
    'event MarketItemSold(uint256 indexed itemId, address indexed nftContract, uint256 indexed tokenId, address seller, address buyer, uint256 price)',
]);

export const NFT_ABI = parseAbi([
    'function mintNFT(address recipient, string tokenURI) returns (uint256)',
    'function tokenURI(uint256 tokenId) view returns (string)',
    'function ownerOf(uint256 tokenId) view returns (address)',
    'function approve(address to, uint256 tokenId)',
    'function getApproved(uint256 tokenId) view returns (address)',
    'function setApprovalForAll(address operator, bool approved)',
    'function isApprovedForAll(address owner, address operator) view returns (bool)',
    'function transferFrom(address from, address to, uint256 tokenId)',
    'function getCurrentTokenId() view returns (uint256)',
    'function mintBatch(address recipient, string[] tokenURIs) returns (uint256[])',
    'function setMarketplaceAddress(address marketplaceAddress)',
]);

// Multi-network contract addresses - UPDATE THESE WITH YOUR DEPLOYED CONTRACTS
export const CONTRACT_ADDRESSES: Record<number, { marketplace: string; nft: string }> = {
    // Sepolia Testnet
    11155111: {
        marketplace: '0x5D0611846F0a45443C00E2361024b99b43109977', // UPDATE THIS
        nft: '0x61737430791fD1e75e563Cd46E08aD3466e59b51', // UPDATE THIS
    },
    // Base Sepolia
    84532: {
        marketplace: '0xYourMarketplaceAddressHere', // Deploy and update
        nft: '0xYourNFTContractAddressHere', // Deploy and update
    },
    // BSC Testnet
    97: {
        marketplace: '0xYourMarketplaceAddressHere', // Deploy and update
        nft: '0xYourNFTContractAddressHere', // Deploy and update
    },
    // Add other networks as needed
};

export const getContractAddress = (chainId: number | undefined, contract: 'marketplace' | 'nft') => {
    if (!chainId || !CONTRACT_ADDRESSES[chainId]) {
        console.warn(`Chain ID ${chainId} not found, using Sepolia as default`);
        return CONTRACT_ADDRESSES[11155111][contract]; // Default to Sepolia
    }
    return CONTRACT_ADDRESSES[chainId][contract];
};

// Legacy exports for backward compatibility
export const MARKETPLACE_ADDRESS = CONTRACT_ADDRESSES[11155111].marketplace;
export const NFT_CONTRACT_ADDRESS = CONTRACT_ADDRESSES[11155111].nft;
