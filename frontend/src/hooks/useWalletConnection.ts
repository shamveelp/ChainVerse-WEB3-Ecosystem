import { useEffect } from 'react';
import { useAccount } from 'wagmi';

export const useWalletConnection = () => {
  const { address, isConnected } = useAccount();

  const trackConnection = async (walletAddress: string) => {
    try {
      await fetch('/api/wallet/connect', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ address: walletAddress }),
      });
    } catch (error) {
      console.error('Error tracking wallet connection:', error);
    }
  };

  const trackDisconnection = async (walletAddress: string) => {
    try {
      await fetch('/api/wallet/disconnect', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ address: walletAddress }),
      });
    } catch (error) {
      console.error('Error tracking wallet disconnection:', error);
    }
  };

  useEffect(() => {
    if (isConnected && address) {
      trackConnection(address);
    }
    
    return () => {
      if (address) {
        trackDisconnection(address);
      }
    };
  }, [isConnected, address]);

  return { address, isConnected };
};