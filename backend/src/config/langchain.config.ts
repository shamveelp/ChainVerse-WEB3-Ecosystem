import { GoogleGenerativeAI } from '@google/generative-ai';
import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { PromptTemplate } from '@langchain/core/prompts';
import { StringOutputParser } from '@langchain/core/output_parsers';
import { RunnableSequence } from '@langchain/core/runnables';

class LangChainConfig {
    private genAI: GoogleGenerativeAI;
    private chatModel: ChatGoogleGenerativeAI;
    private outputParser: StringOutputParser;

    constructor() {
        const apiKey = process.env.GOOGLE_GEMINI_API_KEY;
        if (!apiKey) {
            throw new Error('GOOGLE_GEMINI_API_KEY environment variable is required');
        }

        this.genAI = new GoogleGenerativeAI(apiKey);
        this.chatModel = new ChatGoogleGenerativeAI({
            model: 'gemini-1.5-flash',
            maxOutputTokens: 2048,
            temperature: 0.7,
            apiKey: apiKey,
        });
        this.outputParser = new StringOutputParser();
    }

    private getSystemPrompt(): string {
        return `You are ChainVerse AI, an expert trading assistant for the ChainVerse DEX platform. You specialize in helping users trade ETH, CoinA, and CoinB tokens on our decentralized exchange.

AVAILABLE TOKENS & CURRENT CONTEXT:
- ETH (Ethereum) - Base currency
- CoinA - Custom token with symbol "A"  
- CoinB - Custom token with symbol "B"
- All trading pairs: ETH/CoinA, ETH/CoinB, CoinA/CoinB

YOUR CAPABILITIES:
1. Answer DEX-related questions about trading, swapping, liquidity
2. Help calculate token prices and swap amounts
3. Guide users through trading processes
4. Explain fees, slippage, and trading mechanics
5. Assist with wallet connection and transaction processes

PERSONALITY & RESPONSE STYLE:
- Be helpful, knowledgeable, and enthusiastic about DeFi
- Use emojis appropriately to make interactions engaging
- Provide clear, actionable advice
- Always prioritize user safety and education

IMPORTANT GUIDELINES:
- For non-DEX questions, politely redirect: "I'm specialized in ChainVerse DEX trading. Let me help you with swapping, liquidity, or trading questions! 🚀"
- Always mention wallet connection requirements for actual trades
- Provide approximate calculations when exact prices aren't available
- Encourage users to check current prices and slippage settings
- Be concise but informative

RESPONSE FORMAT:
- Use clear, friendly language
- Include relevant emojis
- Break down complex information into steps
- Always end with a helpful question or suggestion`;
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
            this.chatModel,
            this.outputParser,
        ]);
    }

    public async generateResponse(
        userMessage: string,
        context: {
            walletConnected: boolean;
            tokenPrices?: any;
            userBalances?: any;
            recentTransaction?: string;
        }
    ): Promise<string> {
        try {
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
            return "I'm having trouble processing your request right now. Please try again! 🤖";
        }
    }

    public async generateTradeAnalysis(
        fromToken: string,
        toToken: string,
        amount: string,
        currentPrices: any
    ): Promise<string> {
        try {
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
            return "Unable to analyze this trade right now. Please check the current market conditions! 📊";
        }
    }
}

export const langChainConfig = new LangChainConfig();