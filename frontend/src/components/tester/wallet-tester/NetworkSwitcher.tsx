'use client';

import { useChainId, useSwitchChain } from 'wagmi';
import { sepolia, baseSepolia, bscTestnet } from 'wagmi/chains';

export default function NetworkSwitcher() {
  const chainId = useChainId();
  const { switchChain, isPending } = useSwitchChain();

  const networks = [sepolia, baseSepolia, bscTestnet];

  const handleNetworkChange = (newChainId: string) => {
    const chainIdNum = Number(newChainId);
    if (chainIdNum !== chainId) {
      switchChain({ chainId: chainIdNum });
    }
  };

  return (
    <select
      value={chainId || sepolia.id}
      onChange={(e) => handleNetworkChange(e.target.value)}
      disabled={isPending}
      className={`bg-gray-700 text-white px-4 py-2 rounded transition-colors ${
        isPending ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-600'
      }`}
    >
      {networks.map((network) => (
        <option key={network.id} value={network.id}>
          {network.name}
        </option>
      ))}
    </select>
  );
}