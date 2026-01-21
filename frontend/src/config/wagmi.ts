import { createConfig, http } from 'wagmi'
import {
  sepolia,
  mainnet,
  bsc,
  bscTestnet,
  polygon,
  polygonMumbai,
  base,
  baseSepolia,
  arbitrumSepolia
} from 'wagmi/chains'
import { injected, metaMask, walletConnect } from 'wagmi/connectors'

const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || '88511e4f451458e370e28f3ea7e2a9e2'

export const config = createConfig({
  chains: [
    sepolia,
    baseSepolia,
    bscTestnet,
    mainnet,
    base,
    bsc,
    polygon,
    polygonMumbai,
    arbitrumSepolia
  ],
  connectors: [
    injected(),
    metaMask(),
    walletConnect({ projectId }),
  ],
  transports: {
    [sepolia.id]: http(),
    [baseSepolia.id]: http(),
    [bscTestnet.id]: http(),
    [mainnet.id]: http(),
    [base.id]: http(),
    [bsc.id]: http(),
    [polygon.id]: http(),
    [polygonMumbai.id]: http(),
    [arbitrumSepolia.id]: http(),
  },
})