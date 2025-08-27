import axios, { AxiosInstance } from 'axios';

interface WalletData {
  address: string;
  lastConnected: Date;
}

class WalletApiService {
  private api: AxiosInstance;

  constructor() {
    this.api = axios.create({
      baseURL: 'http://localhost:5000/api',
      timeout: 5000,
    });
  }

  async saveWalletConnection(walletAddress: string): Promise<WalletData> {
    try {
      const response = await this.api.post<WalletData>('/wallets', {
        address: walletAddress,
        lastConnected: new Date(),
      });
      return response.data;
    } catch (error) {
      console.error('Error saving wallet connection:', error);
      throw error;
    }
  }

  async getWallet(walletAddress: string): Promise<WalletData> {
    try {
      const response = await this.api.get<WalletData>(`/wallets/${walletAddress}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching wallet:', error);
      throw error;
    }
  }
}

export default new WalletApiService();