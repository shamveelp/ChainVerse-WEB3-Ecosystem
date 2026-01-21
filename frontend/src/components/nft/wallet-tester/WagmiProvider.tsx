'use client';

import { createConfig, http } from 'wagmi';
import { WagmiProvider } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RainbowKitProvider, getDefaultConfig } from '@rainbow-me/rainbowkit';
import { sepolia, baseSepolia, bscTestnet } from 'wagmi/chains';
import { ReactNode } from 'react';
import { walletConnect, injected, metaMask, coinbaseWallet } from 'wagmi/connectors';

const config = getDefaultConfig({
  appName: 'Wallet App',
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || '88511e4f451458e370e28f3ea7e2a9e2',
  chains: [sepolia, baseSepolia, bscTestnet],
  transports: {
    [sepolia.id]: http(),
    [baseSepolia.id]: http(),
    [bscTestnet.id]: http(),
  },
});

const queryClient = new QueryClient();

export function WagmiProviderFn({ children }: { children: ReactNode }) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider>{children}</RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}