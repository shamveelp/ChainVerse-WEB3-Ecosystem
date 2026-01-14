'use client';
import { ConnectButton } from 'thirdweb/react';
import { client } from '@/lib/thirdweb-client';
import { supportedChains } from '@/lib/thirdweb-config';
import { useActiveAccount } from 'thirdweb/react';
import { useEffect, useRef, useState } from 'react';
import { saveWallet } from '@/services/WalletApiService';

export default function TradeNavbar() {
  const account = useActiveAccount(); // Thirdweb hook to get the connected wallet
  const [error, setError] = useState<string | null>(null);
  const lastSavedAddress = useRef<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    // Check if wallet is connected and address exists
    if (account && account.address && account.address !== lastSavedAddress.current) {
      setError(null); // Clear previous errors
      lastSavedAddress.current = account.address;
      saveWallet(account.address)
        .then(() => {
          if (!cancelled) {

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
  }, [account?.address]); // Run effect when address changes

  return (
    <div className="fixed top-28 left-0 w-full bg-gray-900 bg-opacity-80 backdrop-blur-md shadow-md z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between py-3">
        <h2 className="text-lg font-semibold text-gray-200">Trade</h2>
        <div>
          {error && (
            <div className="text-red-500 mb-2 text-sm">{error}</div>
          )}
          <ConnectButton
            client={client}
            chains={supportedChains}
            appMetadata={{
              name: 'ChainVerse WEB3',
              url: 'https://example.com',
            }}
          />
        </div>
      </div>
    </div>
  );
}