import { createConfig, http } from 'wagmi'
import { 
  sepolia, 
  mainnet, 
  bsc, 
  bscTestnet, 
  polygon, 
  polygonMumbai 
} from 'wagmi/chains'
import { injected, metaMask, walletConnect } from 'wagmi/connectors'

const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || 'your-project-id'

export const config = createConfig({
  chains: [
    sepolia,
    mainnet,
    bsc,
    bscTestnet,
    polygon,
    polygonMumbai,
  ],
  connectors: [
    injected(),
    metaMask(),
    walletConnect({ projectId }),
  ],
  transports: {
    [sepolia.id]: http(),
    [mainnet.id]: http(),
    [bsc.id]: http(),
    [bscTestnet.id]: http(),
    [polygon.id]: http(),
    [polygonMumbai.id]: http(),
  },
})
