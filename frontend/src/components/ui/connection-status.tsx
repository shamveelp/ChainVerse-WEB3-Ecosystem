import React from 'react';
import { Wifi, WifiOff } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ConnectionStatusProps {
  isConnected: boolean;
  className?: string;
}

export function ConnectionStatus({ isConnected, className }: ConnectionStatusProps) {
  return (
    <div className={cn(
      "flex items-center gap-1 px-2 py-1 rounded-full text-xs",
      isConnected 
        ? "bg-green-500/10 text-green-400 border border-green-500/20" 
        : "bg-yellow-500/10 text-yellow-400 border border-yellow-500/20",
      className
    )}>
      {isConnected ? (
        <>
          <Wifi className="h-3 w-3" />
          <span>Real-time</span>
        </>
      ) : (
        <>
          <WifiOff className="h-3 w-3" />
          <span>HTTP mode</span>
        </>
      )}
    </div>
  );
}