import { ethers } from 'ethers';

const SEPOLIA_RPC_LIST = [
    "https://rpc.ankr.com/eth_sepolia",
    "https://eth-sepolia.public.blastapi.io",
    "https://sepolia.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161", // Public Infura as fallback
    "https://rpc.sepolia.org",
    "https://gateway.tenderly.co/public/sepolia"
];

// Cache the provider to avoid multiple network detections
let staticProvider: ethers.JsonRpcProvider | null = null;

export const getStaticProvider = () => {
    if (staticProvider) return staticProvider;

    // Try primary RPC with static network to avoid detection overhead/errors
    // Network ID 11155111 is Sepolia
    try {
        const rpcUrl = process.env.NEXT_PUBLIC_SEPOLIA_RPC || SEPOLIA_RPC_LIST[0];
        staticProvider = new ethers.JsonRpcProvider(rpcUrl, 11155111, {
            staticNetwork: ethers.Network.from(11155111)
        });
        return staticProvider;
    } catch (error) {
        console.error("Failed to initialize static provider:", error);
        // Fallback to a secondary RPC if initialization fails
        staticProvider = new ethers.JsonRpcProvider(SEPOLIA_RPC_LIST[1], 11155111, {
            staticNetwork: ethers.Network.from(11155111)
        });
        return staticProvider;
    }
};

// Function to refresh provider if it gets stuck
export const refreshStaticProvider = (index?: number) => {
    const rpcUrl = index !== undefined ? SEPOLIA_RPC_LIST[index % SEPOLIA_RPC_LIST.length] : SEPOLIA_RPC_LIST[Math.floor(Math.random() * SEPOLIA_RPC_LIST.length)];
    staticProvider = new ethers.JsonRpcProvider(rpcUrl, 11155111, {
        staticNetwork: ethers.Network.from(11155111)
    });
    return staticProvider;
};
