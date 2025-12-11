import { USER_API_ROUTES } from '../../routes/api.routes';
import {
  AIChatMessageRequest,
  AIChatResponse,
  AIAnalysisRequest,
  AIExecuteTradeRequest,
  AIParseIntentResult,
  AITradeDetails
} from "@/types/user/ai-trading.types";

class AiTradeApiService {
  private static readonly BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

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
    try {
      const response = await fetch(`${this.BASE_URL}${USER_API_ROUTES.AI_TRADING.CHAT_MESSAGE}`, {
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
    } catch (error: any) {
      console.error('API Error:', error);

      // If it's a network error, provide user-friendly message
      if (error.message.includes('Failed to fetch')) {
        throw new Error('Unable to connect to server. Please check your connection and try again.');
      }

      throw error;
    }
  }

  // Get available tokens
  static async getAvailableTokens() {
    try {
      const response = await fetch(`${this.BASE_URL}${USER_API_ROUTES.AI_TRADING.TOKENS}`);

      if (!response.ok) {
        throw new Error('Failed to fetch available tokens');
      }

      return response.json();
    } catch (error) {
      console.error('Error fetching tokens:', error);
      throw error;
    }
  }

  // Get current token prices
  static async getTokenPrices() {
    try {
      const response = await fetch(`${this.BASE_URL}${USER_API_ROUTES.AI_TRADING.PRICES}`);

      if (!response.ok) {
        throw new Error('Failed to fetch token prices');
      }

      return response.json();
    } catch (error) {
      console.error('Error fetching prices:', error);
      throw error;
    }
  }

  // Calculate swap estimate
  static async calculateSwapEstimate(
    fromToken: string,
    toToken: string,
    amount: string
  ) {
    try {
      const params = new URLSearchParams({
        fromToken,
        toToken,
        amount,
      });

      const response = await fetch(`${this.BASE_URL}${USER_API_ROUTES.AI_TRADING.SWAP_ESTIMATE}?${params}`);

      if (!response.ok) {
        throw new Error('Failed to calculate swap estimate');
      }

      return response.json();
    } catch (error) {
      console.error('Error calculating estimate:', error);
      throw error;
    }
  }

  // Analyze trade opportunity
  static async analyzeTradeOpportunity(data: {
    fromToken: string;
    toToken: string;
    amount: string;
    walletAddress?: string;
  }) {
    try {
      const response = await fetch(`${this.BASE_URL}${USER_API_ROUTES.AI_TRADING.TRADE_ANALYZE}`, {
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
    } catch (error) {
      console.error('Error analyzing trade:', error);
      throw error;
    }
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
    try {
      const response = await fetch(`${this.BASE_URL}${USER_API_ROUTES.AI_TRADING.TRADE_EXECUTE}`, {
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
    } catch (error) {
      console.error('Error executing trade:', error);
      throw error;
    }
  }

  // Get chat history
  static async getChatHistory(sessionId: string, limit: number = 20) {
    try {
      const response = await fetch(
        `${this.BASE_URL}${USER_API_ROUTES.AI_TRADING.CHAT_HISTORY(sessionId)}?limit=${limit}`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch chat history');
      }

      return response.json();
    } catch (error) {
      console.error('Error fetching history:', error);
      throw error;
    }
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
    const tokens = ['eth', 'ethereum', 'coina', 'coinb', 'coin a', 'coin b'];
    const foundTokens = tokens.filter(token => lowerMessage.includes(token));

    // Detect amounts
    const amountRegex = /\b(\d+(?:\.\d+)?)\b/g;
    const amounts = lowerMessage.match(amountRegex);

    // Detect trading keywords
    const buyKeywords = ['buy', 'purchase', 'get', 'acquire'];
    const sellKeywords = ['sell', 'dispose', 'liquidate'];
    const swapKeywords = ['swap', 'exchange', 'trade', 'convert', 'change'];
    const infoKeywords = ['price', 'cost', 'worth', 'value', 'how much', 'current'];

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

    // Normalize tokens
    const normalizedTokens = foundTokens.map(token => {
      if (token.includes('eth') || token === 'ethereum') return 'ETH';
      if (token.includes('coina') || token === 'coin a') return 'CoinA';
      if (token.includes('coinb') || token === 'coin b') return 'CoinB';
      return token.toUpperCase();
    }).filter((token, index, self) => self.indexOf(token) === index);

    return {
      isTradeIntent,
      fromToken: normalizedTokens[0],
      toToken: normalizedTokens[1],
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
        "Check my balance 💛",
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
      !validTokens.includes(toToken.toUpperCase())) {
      return { isValid: false, error: 'Invalid token specified' };
    }

    return { isValid: true };
  }

  // Extract trade details from AI response
  static extractTradeDetailsFromResponse(response: string): {
    hasTradeDetails: boolean;
    fromToken?: string;
    toToken?: string;
    amount?: string;
    estimatedOutput?: string;
  } {
    const lowerResponse = response.toLowerCase();

    // Look for common trade patterns
    const swapPattern = /swap\s+(\d+(?:\.\d+)?)\s+(eth|coina|coinb).*?(\d+(?:\.\d+)?)\s+(eth|coina|coinb)/i;
    const tradeMatch = response.match(swapPattern);

    if (tradeMatch) {
      return {
        hasTradeDetails: true,
        amount: tradeMatch[1],
        fromToken: tradeMatch[2].toUpperCase(),
        estimatedOutput: tradeMatch[3],
        toToken: tradeMatch[4].toUpperCase()
      };
    }

    return { hasTradeDetails: false };
  }

  // Check if response contains executable trade
  static isExecutableTradeResponse(response: string): boolean {
    const executionKeywords = [
      'execute trade', 'proceed with swap', 'confirm trade',
      'execute this trade', 'ready to proceed'
    ];

    const lowerResponse = response.toLowerCase();
    return executionKeywords.some(keyword => lowerResponse.includes(keyword));
  }

  // Generate context for better AI responses
  static generateContextForAI(
    walletAddress?: string,
    recentTransactions?: any[],
    tokenBalances?: any
  ): any {
    return {
      walletConnected: !!walletAddress,
      walletAddress: walletAddress ? `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}` : null,
      hasRecentActivity: !!(recentTransactions && recentTransactions.length > 0),
      balancesAvailable: !!tokenBalances,
      timestamp: new Date().toISOString()
    };
  }
}

export default AiTradeApiService;