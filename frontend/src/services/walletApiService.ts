interface WalletConnectionData {
  address: string;
}

class WalletApiService {
  private baseUrl = '/api/wallet';

  async connectWallet(address: string) {
    const response = await fetch(`${this.baseUrl}/connect`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ address }),
    });
    
    if (!response.ok) {
      throw new Error('Failed to connect wallet');
    }
    
    return response.json();
  }

  async disconnectWallet(address: string) {
    const response = await fetch(`${this.baseUrl}/disconnect`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ address }),
    });
    
    if (!response.ok) {
      throw new Error('Failed to disconnect wallet');
    }
    
    return response.json();
  }

  async getWalletInfo(address: string) {
    const response = await fetch(`${this.baseUrl}/${address}`);
    
    if (!response.ok) {
      throw new Error('Failed to get wallet info');
    }
    
    return response.json();
  }

  async getWalletTransactions(address: string, page: number = 1, limit: number = 20) {
    const response = await fetch(`${this.baseUrl}/${address}/transactions?page=${page}&limit=${limit}`);
    
    if (!response.ok) {
      throw new Error('Failed to get wallet transactions');
    }
    
    return response.json();
  }

  async updateWalletConnection(address: string) {
    const response = await fetch(`${this.baseUrl}/update-connection`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ address }),
    });
    
    if (!response.ok) {
      throw new Error('Failed to update wallet connection');
    }
    
    return response.json();
  }
}

export const walletApiService = new WalletApiService();