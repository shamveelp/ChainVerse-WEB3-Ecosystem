// web3-config.ts
import { parseAbi } from 'viem';
import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { sepolia } from 'wagmi/chains';

export const config = getDefaultConfig({
  appName: 'NFT Marketplace',
  projectId: 'YOUR_PROJECT_ID',
  chains: [sepolia],
  ssr: true,
});

// NOTE: Converted to viem Abi via parseAbi and removed `memory`.
// Also valid to replace these with the full JSON ABI objects from your build artifacts.
export const MARKETPLACE_ABI = parseAbi([
  'function getListingPrice() view returns (uint256)',
  'function createMarketItem(address nftContract, uint256 tokenId, uint256 price) payable',
  'function createMarketSale(address nftContract, uint256 itemId) payable',
  'function fetchMarketItems() view returns ((uint256 itemId, address nftContract, uint256 tokenId, address seller, address owner, uint256 price, bool sold)[])',
  'function fetchMyNFTs() view returns ((uint256 itemId, address nftContract, uint256 tokenId, address seller, address owner, uint256 price, bool sold)[])',
  'function fetchItemsListed() view returns ((uint256 itemId, address nftContract, uint256 tokenId, address seller, address owner, uint256 price, bool sold)[])',
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
]);

// Keep your addresses the same (ensure these are actually deployed on Sepolia)
export const MARKETPLACE_ADDRESS = '0xd9145CCE52D386f254917e481eB44e9943F39138';
export const NFT_CONTRACT_ADDRESS = '0xd8b934580fcE35a11B58C6D73aDeE468a2833fa8';
