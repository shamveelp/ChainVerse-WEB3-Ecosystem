import API from '@/lib/api-client';
import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_WALLET_API_URL || 'http://localhost:5000';

export const saveWallet = async (address: string) => {
  try {
    await API.post(`/api/wallet/wallets`, { address });
  } catch (error) {
    console.error('Error saving wallet:', error);
  }
};


