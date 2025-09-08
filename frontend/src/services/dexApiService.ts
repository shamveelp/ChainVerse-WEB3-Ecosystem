interface SwapData {
  walletAddress: string;
  fromToken: string;
  toToken: string;
  fromAmount: string;
  toAmount: string;
  transactionHash: string;
  network?: string;
}

interface QuoteParams {
  fromToken: string;
  toToken: string;
  amount: string;
}

class DexApiService {
  private baseUrl = '/api/dex';

  async executeSwap(swapData: SwapData) {
    const response = await fetch(`${this.baseUrl}/swap`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(swapData),
    });
    
    if (!response.ok) {
      throw new Error('Failed to execute swap');
    }
    
    return response.json();
  }

  async getSwapQuote(params: QuoteParams) {
    const queryParams = new URLSearchParams({
      fromToken: params.fromToken,
      toToken: params.toToken,
      amount: params.amount,
    });
    
    const response = await fetch(`${this.baseUrl}/quote?${queryParams}`);
    
    if (!response.ok) {
      throw new Error('Failed to get swap quote');
    }
    
    return response.json();
  }

  async getTransactionHistory(walletAddress: string, page: number = 1, limit: number = 20) {
    const response = await fetch(`${this.baseUrl}/transactions/${walletAddress}?page=${page}&limit=${limit}`);
    
    if (!response.ok) {
      throw new Error('Failed to get transaction history');
    }
    
    return response.json();
  }

  async getTransactionDetails(hash: string) {
    const response = await fetch(`${this.baseUrl}/transaction/${hash}`);
    
    if (!response.ok) {
      throw new Error('Failed to get transaction details');
    }
    
    return response.json();
  }

  async getAvailablePairs() {
    const response = await fetch(`${this.baseUrl}/pairs`);
    
    if (!response.ok) {
      throw new Error('Failed to get available pairs');
    }
    
    return response.json();
  }

  async updateTransactionStatus(hash: string, status: 'completed' | 'failed', additionalData?: any) {
    const response = await fetch(`${this.baseUrl}/transaction/${hash}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ status, ...additionalData }),
    });
    
    if (!response.ok) {
      throw new Error('Failed to update transaction status');
    }
    
    return response.json();
  }
}

export const dexApiService = new DexApiService();