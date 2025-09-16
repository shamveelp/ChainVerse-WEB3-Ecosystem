'use client';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount } from 'wagmi';
import { useEffect, useRef, useState } from 'react';
import { saveWallet } from '@/services/WalletApiService';

export default function WalletConnect() {
  const { address, isConnected } = useAccount();
  const [error, setError] = useState<string | null>(null);
  const lastSavedAddress = useRef<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    if (isConnected && address && address !== lastSavedAddress.current) {
      setError(null); // Clear previous errors
      lastSavedAddress.current = address;
      saveWallet(address)
        .then(() => {
          if (!cancelled) {
            // Only log, don't update state if unnecessary
            console.log('Wallet saved successfully:', address);
          }
        })
        .catch((err) => {
          if (!cancelled) {
            setError('Failed to save wallet address. Please try again.');
            console.error('Wallet save error:', err);
          }
        });
    }
    return () => {
      cancelled = true;
    };
  }, [isConnected, address]); // Only runs when connection or address changes

  return (
    <div>
      {error && (
        <div className="text-red-500 mb-2 text-sm">{error}</div>
      )}
      <ConnectButton
        label="Connect Wallet"
        chainStatus="icon"
        showBalance={false}
        accountStatus={{
          smallScreen: 'avatar',
          largeScreen: 'full',
        }}
      />
    </div>
  );
}
