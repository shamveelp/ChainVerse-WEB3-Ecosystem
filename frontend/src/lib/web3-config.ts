import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { sepolia, mainnet, bsc, bscTestnet, polygon, polygonMumbai, base, baseSepolia } from 'wagmi/chains';

export const config = getDefaultConfig({
  appName: 'ChainVerse NFT Marketplace',
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || 'YOUR_PROJECT_ID',
  chains: [sepolia],
  ssr: true,
});