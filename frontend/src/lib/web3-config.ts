import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { sepolia, mainnet, bsc, bscTestnet, polygon, polygonMumbai, base, baseSepolia } from 'wagmi/chains';

export const config = getDefaultConfig({
  appName: 'ChainVerse NFT Marketplace',
  // Use a public open ID for dev if none provided to avoid allowlist issues
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || '88511e4f451458e370e28f3ea7e2a9e2',
  chains: [sepolia],
  ssr: true,
});