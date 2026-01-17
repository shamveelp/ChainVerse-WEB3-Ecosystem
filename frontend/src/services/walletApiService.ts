import API from '@/lib/api-client';
import { AxiosError } from 'axios';
import { BrowserProvider, formatEther, Eip1193Provider } from 'ethers';

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
  if (typeof window === 'undefined' || !window.ethereum) {
    throw new Error('MetaMask is not installed');
  }

  const provider = new BrowserProvider(window.ethereum as Eip1193Provider);
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
  if (typeof window === 'undefined' || !window.ethereum) {
    return "0";
  }
  const provider = new BrowserProvider(window.ethereum as Eip1193Provider);
  const balance = await provider.getBalance(address);
  return formatEther(balance);
};

export const setupWalletListeners = (onAccountChange: (accounts: string[]) => void, onNetworkChange: (chainId: string) => void) => {
  if (typeof window !== 'undefined' && window.ethereum) {
    window.ethereum.on('accountsChanged', (accounts: unknown) => onAccountChange(accounts as string[]));
    window.ethereum.on('chainChanged', (chainId: unknown) => onNetworkChange(chainId as string));
  }
};

export const removeWalletListeners = (onAccountChange: (accounts: string[]) => void, onNetworkChange: (chainId: string) => void) => {
  if (typeof window !== 'undefined' && window.ethereum) {
    window.ethereum.removeListener('accountsChanged', (accounts: unknown) => onAccountChange(accounts as string[]));
    window.ethereum.removeListener('chainChanged', (chainId: unknown) => onNetworkChange(chainId as string));
  }
};

export const checkWalletConnection = async () => {
  if (typeof window === 'undefined' || !window.ethereum) {
    return false;
  }
  const accounts = await window.ethereum.request({ method: 'eth_accounts' }) as string[];
  return accounts && accounts.length > 0;
};
