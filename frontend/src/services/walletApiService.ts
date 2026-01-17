import API from '@/lib/api-client';
import { AxiosError } from 'axios';
import { BrowserProvider, formatEther } from 'ethers';

interface ApiErrorResponse {
  error?: string;
  message?: string;
}

export const saveWallet = async (address: string) => {
  try {
    await API.post(`/api/wallet/wallets`, { address });
  } catch (error) {
    const axiosError = error as AxiosError<ApiErrorResponse>;
    console.error('Error saving wallet:', axiosError.response?.data || axiosError.message);
  }
};

export const connectWallet = async () => {
  if (typeof window === 'undefined' || !(window as any).ethereum) {
    throw new Error('MetaMask is not installed');
  }

  const provider = new BrowserProvider((window as any).ethereum);
  const accounts = await provider.send("eth_requestAccounts", []);
  const address = accounts[0];
  const balance = await provider.getBalance(address);

  // Save to backend
  await saveWallet(address);

  return {
    address,
    balance: formatEther(balance)
  };
};

export const getWalletBalance = async (address: string) => {
  if (typeof window === 'undefined' || !(window as any).ethereum) {
    return "0";
  }
  const provider = new BrowserProvider((window as any).ethereum);
  const balance = await provider.getBalance(address);
  return formatEther(balance);
};

export const setupWalletListeners = (onAccountChange: (accounts: string[]) => void, onNetworkChange: (chainId: string) => void) => {
  if (typeof window !== 'undefined' && (window as any).ethereum) {
    (window as any).ethereum.on('accountsChanged', onAccountChange);
    (window as any).ethereum.on('chainChanged', onNetworkChange);
  }
};

export const removeWalletListeners = (onAccountChange: (accounts: string[]) => void, onNetworkChange: (chainId: string) => void) => {
  if (typeof window !== 'undefined' && (window as any).ethereum) {
    (window as any).ethereum.removeListener('accountsChanged', onAccountChange);
    (window as any).ethereum.removeListener('chainChanged', onNetworkChange);
  }
};

export const checkWalletConnection = async () => {
  if (typeof window === 'undefined' || !(window as any).ethereum) {
    return false;
  }
  const accounts = await (window as any).ethereum.request({ method: 'eth_accounts' });
  return accounts && accounts.length > 0;
};
