'use client'
import { getDefaultConfig } from 'connectkit'
import { createConfig } from 'wagmi'
import { sepolia, mainnet } from 'wagmi/chains'

const walletConnectProjectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || 'your-project-id'

export const config = createConfig(
  getDefaultConfig({
    // Your dApps chains
    chains: [sepolia, mainnet],
    transports: {
      // RPC URL for each chain
      [sepolia.id]: `https://sepolia.infura.io/v3/${process.env.NEXT_PUBLIC_INFURA_KEY}`,
      [mainnet.id]: `https://mainnet.infura.io/v3/${process.env.NEXT_PUBLIC_INFURA_KEY}`,
    },

    // Required API Keys
    walletConnectProjectId,

    // Required App Info
    appName: "NFTorium",
    appDescription: "Decentralized NFT Marketplace",
    appUrl: "https://nftorium.io", // your app's url
    appIcon: "https://nftorium.io/logo.png", // your app's icon, no bigger than 1024x1024px (max. 1MB)
  }),
)