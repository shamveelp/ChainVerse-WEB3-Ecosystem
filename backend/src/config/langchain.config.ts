import { GoogleGenerativeAI } from '@google/generative-ai';
import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { PromptTemplate } from '@langchain/core/prompts';
import { StringOutputParser } from '@langchain/core/output_parsers';
import { RunnableSequence } from '@langchain/core/runnables';

class LangChainConfig {
    private genAI?: GoogleGenerativeAI;
    private chatModel?: ChatGoogleGenerativeAI;
    private outputParser: StringOutputParser;

    constructor() {
        // Use free tier API key or skip if not available
        const apiKey = process.env.GOOGLE_GEMINI_API_KEY;

        if (apiKey) {
            this.genAI = new GoogleGenerativeAI(apiKey);
            this.chatModel = new ChatGoogleGenerativeAI({
                model: 'gemini-1.5-flash',
                maxOutputTokens: 2048,
                temperature: 0.7,
                apiKey: apiKey,
            });
        } else {
            console.warn('GOOGLE_GEMINI_API_KEY not provided. AI responses will use fallback logic.');
        }

        this.outputParser = new StringOutputParser();
    }

    private getSystemPrompt(): string {
        return `You are ChainVerse AI, an expert trading assistant for the ChainVerse DEX platform. You specialize in helping users trade ETH, CoinA, and CoinB tokens on our decentralized exchange.

AVAILABLE TOKENS & CURRENT CONTEXT:
- ETH (Ethereum) - Base currency for Sepolia testnet
- CoinA - Custom test token with symbol "A"  
- CoinB - Custom test token with symbol "B"
- All trading pairs: ETH/CoinA, ETH/CoinB, CoinA/CoinB

YOUR CAPABILITIES:
1. Answer DEX-related questions about trading, swapping, liquidity
2. Help calculate token prices and swap amounts with REAL market data
3. Guide users through trading processes step-by-step
4. Execute trades when wallet is connected
5. Explain fees, slippage, and trading mechanics
6. Assist with wallet connection and transaction processes

PERSONALITY & RESPONSE STYLE:
- Be helpful, knowledgeable, and enthusiastic about DeFi
- Use emojis appropriately to make interactions engaging
- Provide clear, actionable advice with specific numbers
- Always prioritize user safety and education
- Be concise but informative

IMPORTANT GUIDELINES:
- For non-DEX questions, politely redirect: "I'm specialized in ChainVerse DEX trading. Let me help you with swapping, liquidity, or trading questions! 🚀"
- Always mention wallet connection requirements for actual trades
- Provide REAL calculations when possible, not just approximates
- Encourage users to check current prices and slippage settings
- When giving price info, use current market data from context
- For trade execution, be specific about steps and requirements

RESPONSE FORMAT:
- Use clear, friendly language with proper formatting
- Include relevant emojis for visual appeal
- Break down complex information into numbered steps
- Always end with a helpful question or actionable next step
- Use **bold** for important information
- Use bullet points for lists and comparisons

TRADE EXECUTION PROTOCOL:
When user wants to execute a trade:
1. Confirm wallet connection status
2. Show exact trade details with current prices
3. Explain approval requirements if needed
4. Guide through transaction confirmation
5. Provide transaction hash and explorer link after completion`;
    }

    public createDEXPrompt(): PromptTemplate {
        return PromptTemplate.fromTemplate(`
${this.getSystemPrompt()}

CURRENT CONTEXT:
- User wallet connected: {walletConnected}
- Current token prices: {tokenPrices}
- Available balances: {userBalances}
- Recent transaction: {recentTransaction}

USER MESSAGE: {userMessage}

RESPONSE:`);
    }

    public createTradingChain() {
        const prompt = this.createDEXPrompt();

        return RunnableSequence.from([
            prompt,
            this.chatModel || this.createFallbackModel(),
            this.outputParser,
        ]);
    }

    private createFallbackModel() {
        // Fallback when no API key is available
        return {
            invoke: async (prompt: string) => {
                return this.generateFallbackResponse(prompt);
            }
        };
    }

    private generateFallbackResponse(prompt: string): { content: string } {
        const userMessage = this.extractUserMessage(prompt);

        // Simple rule-based responses for common queries
        const lowerMessage = userMessage.toLowerCase();

        if (lowerMessage.includes('price')) {
            return {
                content: `💰 **Current Token Prices:**

• **ETH**: $2,800.00 (Sepolia testnet)
• **CoinA**: $2.37 (~0.000847 ETH)
• **CoinB**: $3.45 (~0.001234 ETH)

**Exchange Rates:**
• 1 ETH = 1,180.5 CoinA
• 1 ETH = 810.2 CoinB
• 1 CoinA = 1.45 CoinB

Need to make a trade? Just tell me what you want to swap! 🚀`
            };
        }

        if (lowerMessage.includes('swap') || lowerMessage.includes('trade')) {
            return {
                content: `🔄 **Ready to Help You Swap!**

I can help you trade between ETH, CoinA, and CoinB. Here's what I need:

**For a swap, tell me:**
1. Which token you want to trade FROM
2. Which token you want to trade TO  
3. How much you want to swap

**Example:** "Swap 0.01 ETH for CoinA"

**Make sure your wallet is connected** for me to execute the trade! 💫`
            };
        }

        if (lowerMessage.includes('token') || lowerMessage.includes('available')) {
            return {
                content: `📊 **Available Tokens on ChainVerse DEX:**

🔹 **ETH (Ethereum)**
   • Base currency for all trades
   • Current: $2,800.00
   
🔹 **CoinA (Coin Alpha)**  
   • Test token for DEX
   • Current: $2.37 (~0.000847 ETH)
   
🔹 **CoinB (Coin Beta)**
   • Test token for DEX  
   • Current: $3.45 (~0.001234 ETH)

**Trading Pairs Available:**
• ETH ↔ CoinA
• ETH ↔ CoinB  
• CoinA ↔ CoinB

Ready to trade? Connect your wallet and let's go! 🚀`
            };
        }

        return {
            content: `👋 **Hi! I'm ChainVerse AI**

I'm here to help you trade on our DEX! I can assist with:

✅ **Token prices & market info**
✅ **Swap calculations & estimates** 
✅ **Trade execution (wallet required)**
✅ **Trading guidance & tips**

**Popular commands:**
• "Show current prices"
• "Swap 0.01 ETH for CoinA"  
• "What tokens are available?"
• "Calculate swap for X amount"

What would you like to do today? 🚀`
        };
    }

    private extractUserMessage(prompt: string): string {
        const lines = prompt.split('\n');
        const userMessageLine = lines.find(line => line.startsWith('USER MESSAGE:'));
        return userMessageLine ? userMessageLine.replace('USER MESSAGE:', '').trim() : prompt;
    }

    public async generateResponse(
        userMessage: string,
        context: {
            walletConnected: boolean;
            tokenPrices?: Record<string, unknown>;
            userBalances?: Record<string, unknown>;
            recentTransaction?: string;
        }
    ): Promise<string> {
        try {
            if (!this.chatModel) {
                // Use fallback when no API key
                const fallbackResponse = this.generateFallbackResponse(userMessage);
                return fallbackResponse.content;
            }

            const chain = this.createTradingChain();

            const response = await chain.invoke({
                userMessage,
                walletConnected: context.walletConnected ? 'Yes' : 'No',
                tokenPrices: context.tokenPrices ? JSON.stringify(context.tokenPrices) : 'Not available',
                userBalances: context.userBalances ? JSON.stringify(context.userBalances) : 'Not available',
                recentTransaction: context.recentTransaction || 'None'
            });

            return response;
        } catch (error) {
            console.error('Error generating AI response:', error);
            // Fallback to rule-based response on error
            const fallbackResponse = this.generateFallbackResponse(userMessage);
            return fallbackResponse.content;
        }
    }

    public async generateTradeAnalysis(
        fromToken: string,
        toToken: string,
        amount: string,
        currentPrices: Record<string, unknown>
    ): Promise<string> {
        try {
            if (!this.chatModel) {
                // Fallback analysis
                return this.generateFallbackTradeAnalysis(fromToken, toToken, amount);
            }

            const analysisPrompt = `
As ChainVerse AI, analyze this potential trade:
- From: ${amount} ${fromToken}
- To: ${toToken}
- Current prices: ${JSON.stringify(currentPrices)}

Provide a brief analysis including:
1. Estimated output amount
2. Price impact assessment
3. Trading recommendation
4. Risk factors to consider

Keep it concise and actionable.`;

            const response = await this.chatModel.invoke(analysisPrompt);
            return response.content as string;
        } catch (error) {
            console.error('Error generating trade analysis:', error);
            return this.generateFallbackTradeAnalysis(fromToken, toToken, amount);
        }
    }

    private generateFallbackTradeAnalysis(
        fromToken: string,
        toToken: string,
        amount: string
    ): string {
        const numAmount = parseFloat(amount);
        let estimatedOutput = 0;
        let priceImpact = 0;

        // Simple calculation based on mock exchange rates
        if (fromToken === 'ETH' && toToken === 'CoinA') {
            estimatedOutput = numAmount * 1180.5;
            priceImpact = numAmount * 0.1;
        } else if (fromToken === 'ETH' && toToken === 'CoinB') {
            estimatedOutput = numAmount * 810.2;
            priceImpact = numAmount * 0.1;
        } else if (fromToken === 'CoinA' && toToken === 'ETH') {
            estimatedOutput = numAmount / 1180.5;
            priceImpact = (numAmount / 1180.5) * 0.1;
        } else if (fromToken === 'CoinB' && toToken === 'ETH') {
            estimatedOutput = numAmount / 810.2;
            priceImpact = (numAmount / 810.2) * 0.1;
        }

        const riskLevel = priceImpact > 5 ? 'HIGH' : priceImpact > 2 ? 'MEDIUM' : 'LOW';
        const recommendation = riskLevel === 'HIGH' ? 'CAUTION' : 'PROCEED';

        return `📊 **Trade Analysis for ${amount} ${fromToken} → ${toToken}**

**Estimated Output:** ${estimatedOutput.toFixed(6)} ${toToken}
**Price Impact:** ${priceImpact.toFixed(2)}%
**Risk Level:** ${riskLevel}
**Recommendation:** ${recommendation}

**Key Points:**
${riskLevel === 'HIGH' ? '⚠️ High price impact - consider smaller amount' : '✅ Reasonable price impact'}
${priceImpact < 1 ? '✅ Minimal slippage expected' : '⚠️ Monitor slippage settings'}

${recommendation === 'PROCEED' ? 'Trade looks good to proceed! 🚀' : 'Consider reducing trade size for better execution 📉'}`;
    }
}

export const langChainConfig = new LangChainConfig();