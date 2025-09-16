'use client';

import { ThirdwebProvider } from 'thirdweb/react';
import { client } from '@/lib/thirdweb-client';
import { ReactNode, useEffect, useRef } from 'react';
import { useActiveAccount } from 'thirdweb/react';
import { saveWallet } from '@/services/WalletApiService';

function WalletSaver({ children }: { children: ReactNode }) {
  const account = useActiveAccount();
  const lastSavedAddress = useRef<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    
    if (account && account.address && account.address !== lastSavedAddress.current) {
      lastSavedAddress.current = account.address;
      
      saveWallet(account.address)
        .then(() => {
          if (!cancelled) {
            console.log('Wallet saved successfully:', account.address);
          }
        })
        .catch((err) => {
          if (!cancelled) {
            console.error('Wallet save error:', err);
          }
        });
    }
    
    return () => {
      cancelled = true;
    };
  }, [account?.address]);

  return <>{children}</>;
}

export function CustomThirdwebProvider({ children }: { children: ReactNode }) {
  return (
    <ThirdwebProvider>
      <WalletSaver>
        {children}
      </WalletSaver>
    </ThirdwebProvider>
  );
}