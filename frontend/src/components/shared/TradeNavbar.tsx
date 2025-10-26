'use client';

import { ConnectButton } from 'thirdweb/react';
import { client } from '@/lib/thirdweb-client';
import { useActiveAccount } from 'thirdweb/react';
import { useEffect, useRef, useState } from 'react';
import { Wallet } from 'lucide-react';

interface FloatingWalletButtonProps {
  topOffset?: string;
}

export default function TradeNavbar({ topOffset = 'top-4' }: FloatingWalletButtonProps) {
  const account = useActiveAccount();
  const [error, setError] = useState<string | null>(null);
  const lastSavedAddress = useRef<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    if (account && account.address && account.address !== lastSavedAddress.current) {
      setError(null);
      lastSavedAddress.current = account.address;
      
    }

    return () => {
      cancelled = true;
    };
  }, [account?.address]);

  return (
    <div className={`fixed ${topOffset} right-4 z-50`}>
      {error && (
        <div className="text-red-400 mb-2 text-sm bg-slate-900/80 p-2 rounded-md border border-red-700/50">{error}</div>
      )}
      <div className="relative group">
        <ConnectButton
          client={client}
          appMetadata={{
            name: 'ChainVerse WEB3',
            url: 'https://example.com',
          }}
        />
        <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-cyan-400/20 via-blue-600/20 to-cyan-400/20 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
      </div>
    </div>
  );
}
