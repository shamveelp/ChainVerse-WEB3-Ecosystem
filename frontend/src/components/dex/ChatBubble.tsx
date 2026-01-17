"use client";

import React, { useState, useEffect, useRef } from 'react';
import { MessageCircle, X, Sparkles, Send, Bot, User, ArrowUpDown, Wallet, ExternalLink, Zap } from 'lucide-react';
import { useActiveAccount } from 'thirdweb/react';
import { toast } from '@/hooks/use-toast';
import { getExplorerUrl } from '@/lib/dex/utils';
import AiTradeApiService from '@/services/ai/AiTradeApiService';

interface ChatBubbleProps {
  onExecuteSwap?: () => Promise<string | null>;
  onSetSwapForm?: (form: SwapFormState) => void;
  tokenPrices?: { ethCoinA: string; ethCoinB: string };
  currentBalances?: { eth: string; coinA: string; coinB: string };
}

interface SwapFormState {
  fromToken: string;
  toToken: string;
  fromAmount?: string;
  // Add other properties as needed based on usage
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  suggestions?: string[];
  actionRequired?: {
    type: 'connect_wallet' | 'approve_token' | 'execute_trade';
    message: string;
    data?: unknown;
  };
}

export default function AiChatBubble({ onExecuteSwap, onSetSwapForm, tokenPrices, currentBalances }: ChatBubbleProps) {
  const account = useActiveAccount();
  const [isOpen, setIsOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId] = useState(() => AiTradeApiService.generateSessionId());
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Entrance animation on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  // Initial welcome message with real data
  useEffect(() => {
    if (messages.length === 0) {
      const welcomeMessage: Message = {
        id: 'welcome',
        role: 'assistant',
        content: `👋 **Welcome to ChainVerse AI!**

I'm your personal DEX trading assistant. I can help you with:

✅ **Real-time token prices** (fetched from live APIs)
✅ **Smart swap calculations** with accurate estimates  
✅ **Trade execution** when your wallet is connected
✅ **Market analysis** and trading recommendations

**Available Tokens:**
• ETH (Ethereum Sepolia)
• CoinA (Test Token) 
• CoinB (Test Token)

${account?.address
            ? `🟢 **Wallet Connected:** ${account.address.slice(0, 6)}...${account.address.slice(-4)}\nI can execute trades for you!`
            : `🔴 **Wallet Not Connected**\nConnect your wallet to enable trade execution!`
          }

What would you like to do today? 🚀`,
        timestamp: new Date(),
        suggestions: [
          "Show current prices 💰",
          "What tokens are available? 📊",
          "Swap 0.01 ETH for CoinA 🔄",
          "Swap 100 CoinA for ETH ⚡"
        ]
      };
      setMessages([welcomeMessage]);
    }
  }, [account?.address]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (messageText?: string) => {
    const message = messageText || inputMessage.trim();
    if (!message) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: message,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      // Local Intent Processing for "Perfect Implementation" Speed
      const intent = AiTradeApiService.parseTradingIntent(message);

      let aiResponse: Message | null = null;

      // 1. Handle "Prices" intent
      if (intent.action === 'info' || message.toLowerCase().includes('price')) {
        const priceText = tokenPrices
          ? `**Current Prices:**\n• 1 ETH = ${tokenPrices.ethCoinA} CoinA\n• 1 ETH = ${tokenPrices.ethCoinB} CoinB`
          : "I couldn't fetch the latest prices just yet. Please try again in a moment.";

        aiResponse = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: priceText,
          timestamp: new Date(),
          suggestions: ["Swap ETH for CoinA", "Swap ETH for CoinB"]
        };
      }

      // 2. Handle "Pairs" / "Available" intent
      else if (message.toLowerCase().includes('pair') || message.toLowerCase().includes('available')) {
        aiResponse = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: `**Available Trading Pairs:**
• ETH ⇄ CoinA
• ETH ⇄ CoinB
• CoinA ⇄ CoinB

You can trade between any of these tokens instantly!`,
          timestamp: new Date(),
          suggestions: ["Buy 100 CoinA", "Sell CoinB"]
        };
      }

      // 3. Handle "Swap/Buy/Sell" intent
      else if (intent.isTradeIntent && intent.amount && (intent.fromToken || intent.toToken)) {

        let fromToken = intent.fromToken || 'ETH';
        let toToken = intent.toToken || 'CoinA';

        // Refine tokens based on single-token input
        if (!intent.toToken && intent.fromToken) {
          // Only one token found
          if (intent.action === 'buy') {
            toToken = intent.fromToken;
            fromToken = toToken === 'ETH' ? 'CoinA' : 'ETH';
          } else {
            // Sell or default
            fromToken = intent.fromToken;
            toToken = fromToken === 'ETH' ? 'CoinA' : 'ETH';
          }
        }

        // Prevent same token
        if (fromToken === toToken) {
          toToken = fromToken === 'ETH' ? 'CoinA' : 'ETH';
        }

        // Update the form
        if (onSetSwapForm) {
          onSetSwapForm({
            fromToken: fromToken,
            toToken: toToken,
            fromAmount: intent.amount
          });
        }

        const actionMsg = `I've prepared the transaction for you:
        
**Swap:** ${intent.amount} ${fromToken} ➝ ${toToken}
        
Please confirm the details in the swap card. When you are ready, click 'Execute Trade' below!`;

        aiResponse = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: actionMsg,
          timestamp: new Date(),
          actionRequired: {
            type: 'execute_trade',
            message: 'Transaction ready for execution'
          },
          suggestions: ["Execute Trade 🚀", "Modify amount"]
        };
      }

      // Fallback to API or General Response
      else {
        // Fallback to generic simple response
        aiResponse = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: `I can help you trade! Try saying:
• "Swap 0.1 ETH for CoinA"
• "What are the prices?"`,
          timestamp: new Date(),
          suggestions: ["Show prices", "Swap ETH to CoinA"]
        };
      }

      setTimeout(() => {
        if (aiResponse) setMessages(prev => [...prev, aiResponse as Message]);
        setIsLoading(false);
      }, 600); // Simulate typing delay

    } catch (error) {
      console.error(error);
      setIsLoading(false);
      const errResponse: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: "Sorry, I encountered an error processing your request.",
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errResponse]);
    }
  };

  const handleActionRequired = (action: NonNullable<Message['actionRequired']>) => {
    if (action.type === 'connect_wallet') {
      toast({
        variant: "default",
        title: "🔌 Wallet Connection Required",
        description: action.message + " Click the wallet button in the top right!",
      });
    } else if (action.type === 'execute_trade') {
      toast({
        variant: "default",
        title: "🚀 Trade Ready for Execution",
        description: action.message,
      });
    }
  };

  const handleExecuteTrade = async () => {
    if (!account?.address) {
      toast({
        variant: "destructive",
        title: "Wallet Required",
        description: "Please connect your wallet to execute trades",
      });
      return;
    }

    if (!onExecuteSwap) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Swap execution not available",
      });
      return;
    }

    // Call the swap function passed from parent
    const executeMessage: Message = {
      id: Date.now().toString(),
      role: 'assistant',
      content: `🔄 **Executing Trade...**
Please check your wallet for transaction approval! 💫`,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, executeMessage]);

    try {
      const txHash = await onExecuteSwap();
      if (txHash) {
        const successMsg: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: `✅ **Trade Successful!**
                
[View on Explorer]: ${getExplorerUrl(txHash)}

Is there anything else I can help you with?`,
          timestamp: new Date(),
          suggestions: ["Show Balance", "New Trade"]
        };
        setMessages(prev => [...prev, successMsg]);
      }
    } catch (err: unknown) {
      console.error(err);
      const errorMessage = err instanceof Error ? err.message : 'Something went wrong.';
      const failMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `❌ **Trade Failed**
            
${errorMessage} Please check your balance and try again.`,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, failMsg]);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    // Remove emojis and clean up suggestion
    const cleanSuggestion = suggestion.replace(/[📊💰🔄⚡💛🚀📈🔌🌐💬❌⚠️🔄]/g, '').trim();

    // Handle special suggestions
    if (cleanSuggestion.toLowerCase().includes('execute trade')) {
      handleExecuteTrade();
      return;
    }

    handleSendMessage(cleanSuggestion);
  };

  const formatMessageContent = (content: string) => {
    // Convert URLs to clickable links
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    let formattedContent = content.replace(urlRegex, '<a href="$1" target="_blank" rel="noopener noreferrer" class="text-blue-400 hover:text-blue-300 underline inline-flex items-center gap-1">$1 <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path></svg></a>');

    // Format code blocks
    formattedContent = formattedContent.replace(/`([^`]+)`/g, '<code class="bg-slate-700 px-1 py-0.5 rounded text-cyan-300 font-mono text-sm">$1</code>');

    // Format bold text
    formattedContent = formattedContent.replace(/\*\*([^*]+)\*\*/g, '<strong class="font-bold text-white">$1</strong>');

    return formattedContent;
  };

  return (
    <>
      <div
        className={`fixed bottom-6 right-6 z-50 transition-all duration-500 ease-out message-bubble-container ${isVisible
          ? 'translate-y-0 opacity-100 scale-100'
          : 'translate-y-20 opacity-0 scale-50'
          }`}
      >
        {/* Floating Chat Window */}
        {isOpen && (
          <div className="absolute bottom-20 right-0 w-[85vw] sm:w-[420px] max-h-[700px] bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-2xl shadow-2xl border border-slate-700/50 overflow-hidden backdrop-blur-xl animate-in slide-in-from-bottom-5 duration-300">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 via-cyan-600 to-blue-600 p-4 flex items-center justify-between relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>

              <div className="flex items-center space-x-3 relative z-10">
                <div className="relative">
                  <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                    <Sparkles className="h-5 w-5 text-white" />
                  </div>
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-400 rounded-full border-2 border-blue-600 animate-pulse"></div>
                </div>
                <div>
                  <h3 className="font-bold text-white text-lg">ChainVerse AI</h3>
                  <p className="text-blue-100 text-xs flex items-center">
                    <span className="w-2 h-2 bg-emerald-400 rounded-full mr-1 animate-pulse"></span>
                    {account?.address ? 'Trading Ready' : 'Connect Wallet to Trade'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="relative z-10 p-2 hover:bg-white/10 rounded-lg transition-all duration-200"
              >
                <X className="h-5 w-5 text-white" />
              </button>
            </div>

            {/* Messages Area */}
            <div className="flex flex-col h-[500px]">
              <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
                {messages.map((message) => (
                  <div key={message.id} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[90%] ${message.role === 'user' ? 'order-2' : 'order-1'}`}>
                      <div className="flex items-start space-x-2">
                        {message.role === 'assistant' && (
                          <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 flex items-center justify-center flex-shrink-0">
                            <Bot className="h-4 w-4 text-white" />
                          </div>
                        )}
                        <div className={`flex-1 ${message.role === 'user' ? 'text-right' : ''}`}>
                          <div
                            className={`p-3 rounded-2xl ${message.role === 'user'
                              ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-br-none'
                              : 'bg-slate-800/50 backdrop-blur-sm text-white border border-slate-700/30 rounded-tl-none'
                              }`}
                          >
                            <div
                              className="text-sm leading-relaxed whitespace-pre-wrap"
                              dangerouslySetInnerHTML={{
                                __html: formatMessageContent(message.content)
                              }}
                            />
                          </div>
                          <p className="text-xs text-slate-500 mt-1">
                            {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                        {message.role === 'user' && (
                          <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center flex-shrink-0">
                            <User className="h-4 w-4 text-white" />
                          </div>
                        )}
                      </div>

                      {/* Suggestions */}
                      {message.suggestions && message.suggestions.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-2">
                          {message.suggestions.map((suggestion, index) => (
                            <button
                              key={index}
                              onClick={() => handleSuggestionClick(suggestion)}
                              className="px-3 py-1.5 text-xs bg-slate-700/50 hover:bg-slate-600/50 text-slate-300 hover:text-white rounded-full border border-slate-600/30 transition-all duration-200 hover:scale-105"
                            >
                              {suggestion}
                            </button>
                          ))}
                        </div>
                      )}

                      {/* Action Required */}
                      {message.actionRequired && (
                        <div className="mt-3 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-xl">
                          <div className="flex items-center space-x-2">
                            {message.actionRequired.type === 'connect_wallet' ? (
                              <Wallet className="h-4 w-4 text-yellow-400" />
                            ) : (
                              <Zap className="h-4 w-4 text-yellow-400" />
                            )}
                            <p className="text-yellow-300 text-sm">{message.actionRequired.message}</p>
                          </div>
                          {message.actionRequired.type === 'execute_trade' && (
                            <button
                              onClick={handleExecuteTrade}
                              className="mt-2 w-full bg-yellow-500 hover:bg-yellow-600 text-black font-bold py-2 px-4 rounded-lg transition-colors"
                            >
                              Execute Trade Now
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))}

                {isLoading && (
                  <div className="flex justify-start">
                    <div className="flex items-start space-x-2">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 flex items-center justify-center">
                        <Bot className="h-4 w-4 text-white" />
                      </div>
                      <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl rounded-tl-none p-3 border border-slate-700/30">
                        <div className="flex space-x-1">
                          <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></div>
                          <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                          <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Input Area */}
              <div className="p-4 border-t border-slate-700/50 bg-slate-900/50">
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    placeholder="Ask about prices, trades, or say 'swap 0.01 ETH for CoinA'..."
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && !isLoading && handleSendMessage()}
                    disabled={isLoading}
                    className="flex-1 bg-slate-800/50 border border-slate-700/50 rounded-xl px-4 py-2.5 text-white text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent transition-all duration-200 disabled:opacity-50"
                  />
                  <button
                    onClick={() => handleSendMessage()}
                    disabled={!inputMessage.trim() || isLoading}
                    className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 disabled:from-slate-700 disabled:to-slate-700 p-2.5 rounded-xl transition-all duration-200 disabled:cursor-not-allowed"
                  >
                    <Send className="h-5 w-5 text-white" />
                  </button>
                </div>

                {/* Status Info */}
                <div className="mt-2 flex items-center justify-between text-xs">
                  <div className="flex items-center space-x-2">
                    <div className={`w-2 h-2 rounded-full ${account?.address ? 'bg-emerald-400' : 'bg-red-400'}`}></div>
                    <span className="text-slate-400">
                      {account?.address
                        ? `Connected: ${account.address.slice(0, 6)}...${account.address.slice(-4)}`
                        : 'Wallet not connected'}
                    </span>
                  </div>
                  <span className="text-slate-500">Session: {sessionId.slice(-6)}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Floating Button */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="relative group"
        >
          {/* Pulsing rings */}
          <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 animate-ping opacity-75"></div>
          <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500"></div>

          {/* Main button */}
          <div className="relative w-16 h-16 bg-gradient-to-r from-blue-600 via-cyan-600 to-blue-600 rounded-full shadow-2xl flex items-center justify-center transform transition-all duration-300 hover:scale-105 group-hover:shadow-blue-500/50">
            {/* Shimmer effect */}
            <div className="absolute inset-0 rounded-full bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>

            {/* Icon */}
            <div className="relative z-10 transition-transform duration-300">
              {isOpen ? (
                <X className="h-7 w-7 text-white" />
              ) : (
                <div className="flex items-center justify-center">
                  <Sparkles className="h-7 w-7 text-white" />
                </div>
              )}
            </div>

            {/* Notification badge */}
            {!isOpen && (
              <div className="absolute -top-1 -right-1 w-5 h-5 bg-gradient-to-r from-red-500 to-pink-500 rounded-full border-2 border-slate-900 flex items-center justify-center animate-pulse">
                <span className="text-white text-xs font-bold">AI</span>
              </div>
            )}
          </div>

          {/* Tooltip */}
          {!isOpen && (
            <div className="absolute bottom-full right-0 mb-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
              <div className="bg-slate-900 text-white text-sm px-3 py-2 rounded-lg shadow-xl border border-slate-700/50 whitespace-nowrap">
                {account?.address
                  ? 'AI Trading Assistant - Ready to trade! 🚀'
                  : 'AI Trading Assistant - Connect wallet to trade! 🤖'
                }
                <div className="absolute top-full right-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-slate-900"></div>
              </div>
            </div>
          )}
        </button>
      </div>

      {/* Custom Styles */}
      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }

        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(51, 65, 85, 0.3);
          border-radius: 10px;
        }

        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: linear-gradient(to bottom, #3b82f6, #06b6d4);
          border-radius: 10px;
        }

        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(to bottom, #2563eb, #0891b2);
        }

        .animate-in {
          animation: slideInFromBottom 0.3s ease-out;
        }

        @keyframes slideInFromBottom {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </>
  );
}