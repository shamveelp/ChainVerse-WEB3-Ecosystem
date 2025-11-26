class AiTradeApiService {
  private static readonly BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
  private static readonly AI_TRADING_ENDPOINT = `${this.BASE_URL}/ai-trading`;

  // Generate unique session ID for chat
  static generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Send message to AI
  static async sendMessage(data: {
    message: string;
    sessionId: string;
    walletAddress?: string;
    walletConnected?: boolean;
    context?: any;
  }) {
    const response = await fetch(`${this.AI_TRADING_ENDPOINT}/chat/message`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    const contentType = response.headers.get("content-type");
    if (contentType && contentType.indexOf("application/json") !== -1) {
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || 'Failed to send message');
      }
      return result;
    } else {
      const text = await response.text();
      console.error('Received non-JSON response:', text);
      throw new Error(`Server returned unexpected response: ${response.status} ${response.statusText}`);
    }
  }

  // Get available tokens
  static async getAvailableTokens() {
    const response = await fetch(`${this.AI_TRADING_ENDPOINT}/tokens`);

    if (!response.ok) {
      throw new Error('Failed to fetch available tokens');
    }

    return response.json();
  }

  // Get current token prices
  static async getTokenPrices() {
    const response = await fetch(`${this.AI_TRADING_ENDPOINT}/prices`);

    if (!response.ok) {
      throw new Error('Failed to fetch token prices');
    }

    return response.json();
  }

  // Calculate swap estimate
  static async calculateSwapEstimate(
    fromToken: string,
    toToken: string,
    amount: string
  ) {
    const params = new URLSearchParams({
      fromToken,
      toToken,
      amount,
    });

    const response = await fetch(`${this.AI_TRADING_ENDPOINT}/swap/estimate?${params}`);

    if (!response.ok) {
      throw new Error('Failed to calculate swap estimate');
    }

    return response.json();
  }

  // Analyze trade opportunity
  static async analyzeTradeOpportunity(data: {
    fromToken: string;
    toToken: string;
    amount: string;
    walletAddress?: string;
  }) {
    const response = await fetch(`${this.AI_TRADING_ENDPOINT}/trade/analyze`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to analyze trade');
    }

    return response.json();
  }

  // Execute trade with AI assistance
  static async executeTradeWithAI(data: {
    fromToken: string;
    toToken: string;
    amount: string;
    sessionId: string;
    walletAddress: string;
    slippage?: string;
  }) {
    const response = await fetch(`${this.AI_TRADING_ENDPOINT}/trade/execute`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to execute trade');
    }

    return response.json();
  }

  // Get chat history
  static async getChatHistory(sessionId: string, limit: number = 20) {
    const response = await fetch(
      `${this.AI_TRADING_ENDPOINT}/chat/history/${sessionId}?limit=${limit}`
    );

    if (!response.ok) {
      throw new Error('Failed to fetch chat history');
    }

    return response.json();
  }

  // Parse trading intent from user message
  static parseTradingIntent(message: string): {
    isTradeIntent: boolean;
    fromToken?: string;
    toToken?: string;
    amount?: string;
    action: 'buy' | 'sell' | 'swap' | 'info' | 'general';
  } {
    const lowerMessage = message.toLowerCase();

    // Detect tokens
    const tokens = ['eth', 'coina', 'coinb'];
    const foundTokens = tokens.filter(token => lowerMessage.includes(token));

    // Detect amounts
    const amountRegex = /\b\d+(?:\.\d+)?\b/g;
    const amounts = lowerMessage.match(amountRegex);

    // Detect trading keywords
    const buyKeywords = ['buy', 'purchase', 'get'];
    const sellKeywords = ['sell', 'dispose'];
    const swapKeywords = ['swap', 'exchange', 'trade', 'convert'];
    const infoKeywords = ['price', 'cost', 'worth', 'value', 'how much'];

    const isBuy = buyKeywords.some(keyword => lowerMessage.includes(keyword));
    const isSell = sellKeywords.some(keyword => lowerMessage.includes(keyword));
    const isSwap = swapKeywords.some(keyword => lowerMessage.includes(keyword));
    const isInfo = infoKeywords.some(keyword => lowerMessage.includes(keyword));

    const isTradeIntent = isBuy || isSell || isSwap || isInfo || foundTokens.length > 0;

    let action: 'buy' | 'sell' | 'swap' | 'info' | 'general' = 'general';
    if (isBuy) action = 'buy';
    else if (isSell) action = 'sell';
    else if (isSwap) action = 'swap';
    else if (isInfo) action = 'info';

    return {
      isTradeIntent,
      fromToken: foundTokens[0]?.toUpperCase(),
      toToken: foundTokens[1]?.toUpperCase(),
      amount: amounts?.[0],
      action
    };
  }

  // Get suggested responses based on context
  static getSuggestedResponses(context?: any): string[] {
    const baseResponses = [
      "What tokens are available? 📊",
      "Show current prices 💰",
      "How to swap ETH for CoinA? 🔄",
      "Calculate swap for 0.01 ETH ⚡"
    ];

    if (context?.walletConnected) {
      return [
        ...baseResponses,
        "Check my balance 👛",
        "Execute a trade 🚀",
        "View transaction history 📈"
      ];
    }

    return baseResponses;
  }

  // Format currency amounts
  static formatCurrency(amount: string | number, token: string): string {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;

    if (token === 'ETH') {
      return `${num.toFixed(6)} ${token}`;
    } else {
      return `${num.toFixed(4)} ${token}`;
    }
  }

  // Generate trading summary
  static generateTradingSummary(
    fromToken: string,
    toToken: string,
    fromAmount: string,
    toAmount: string,
    transactionHash?: string
  ): string {
    const summary = `Swapped ${this.formatCurrency(fromAmount, fromToken)} for ${this.formatCurrency(toAmount, toToken)}`;

    if (transactionHash) {
      return `${summary}\n\n🔗 Transaction: ${transactionHash.slice(0, 10)}...${transactionHash.slice(-10)}`;
    }

    return summary;
  }

  // Check if wallet connection is required for action
  static requiresWallet(action: string): boolean {
    const walletRequiredActions = ['buy', 'sell', 'swap', 'execute', 'trade'];
    return walletRequiredActions.some(requiredAction =>
      action.toLowerCase().includes(requiredAction)
    );
  }

  // Get error message for common errors
  static getErrorMessage(error: any): string {
    if (error.message) {
      return error.message;
    }

    if (typeof error === 'string') {
      return error;
    }

    return 'An unexpected error occurred. Please try again.';
  }

  // Validate trading parameters
  static validateTradeParams(
    fromToken: string,
    toToken: string,
    amount: string
  ): { isValid: boolean; error?: string } {
    if (!fromToken || !toToken || !amount) {
      return { isValid: false, error: 'Missing required trading parameters' };
    }

    if (fromToken === toToken) {
      return { isValid: false, error: 'Cannot trade the same token' };
    }

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      return { isValid: false, error: 'Invalid amount specified' };
    }

    const validTokens = ['ETH', 'COINA', 'COINB'];
    if (!validTokens.includes(fromToken.toUpperCase()) ||
      validTokens.includes(toToken.toUpperCase())) {
      return { isValid: false, error: 'Invalid token specified' };
    }

    return { isValid: true };
  }
}

export default AiTradeApiService;