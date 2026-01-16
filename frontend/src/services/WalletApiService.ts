import API from '@/lib/api-client';
import { AxiosError } from 'axios';

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
