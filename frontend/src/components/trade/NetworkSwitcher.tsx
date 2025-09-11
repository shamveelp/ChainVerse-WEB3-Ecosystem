'use client';

import { useState } from 'react';
import { useChainId, useSwitchChain } from 'wagmi';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ChevronDown, Network, Check } from 'lucide-react';
import { sepolia, baseSepolia, bscTestnet } from 'wagmi/chains';

const supportedChains = [
  {
    ...sepolia,
    icon: '🔷',
    color: 'bg-blue-600/20 text-blue-400 border-blue-400/30',
  },
  {
    ...baseSepolia,
    icon: '🔵',
    color: 'bg-indigo-600/20 text-indigo-400 border-indigo-400/30',
  },
  {
    ...bscTestnet,
    icon: '🟡',
    color: 'bg-yellow-600/20 text-yellow-400 border-yellow-400/30',
  },
];

export function NetworkSwitcher() {
  const chainId = useChainId();
  const { switchChain, isPending } = useSwitchChain();
  const [open, setOpen] = useState(false);

  const currentChain = supportedChains.find((chain) => chain.id === chainId);

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={`${
            currentChain?.color || 'bg-gray-600/20 text-gray-400 border-gray-400/30'
          } font-medium transition-all duration-200`}
          disabled={isPending}
        >
          <Network className="w-4 h-4 mr-2" />
          {currentChain ? (
            <>
              <span className="mr-1">{currentChain.icon}</span>
              {currentChain.name}
            </>
          ) : (
            'Unknown Network'
          )}
          <ChevronDown className="w-4 h-4 ml-2" />
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent className="bg-gray-900/95 border border-white/20 backdrop-blur-lg">
        {supportedChains.map((chain) => (
          <DropdownMenuItem
            key={chain.id}
            onClick={() => {
              switchChain({ chainId: chain.id });
              setOpen(false);
            }}
            className="text-white hover:bg-white/10 cursor-pointer"
          >
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-2">
                <span>{chain.icon}</span>
                <span>{chain.name}</span>
              </div>
              {chainId === chain.id && (
                <Check className="w-4 h-4 text-green-400" />
              )}
            </div>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}