"use client";

import React, { useState, useEffect } from 'react';
import { MessageCircle, X, Sparkles, Send } from 'lucide-react';

export default function ChatBubble() {
    const [isOpen, setIsOpen] = useState(false);
    const [isVisible, setIsVisible] = useState(false);
    const [messages, setMessages] = useState([
        {
            type: 'bot',
            text: 'Hey there! 👋 Need help with your swap?',
            timestamp: new Date()
        }
    ]);

    // Entrance animation on mount
    useEffect(() => {
        const timer = setTimeout(() => {
            setIsVisible(true);
        }, 1000);
        return () => clearTimeout(timer);
    }, []);

    const staticMessages = [
        "💡 Pro tip: Check slippage settings for better rates!",
        "🔥 Current gas fees are optimal for swapping",
        "⚡ Fast swaps with minimal slippage available now",
        "🎯 Need help? I'm here to assist with your trades!"
    ];

    return (
        <>
            {/* Chat Bubble Button */}
            <div
                className={`fixed bottom-6 right-6 z-50 transition-all duration-500 ease-out ${isVisible
                    ? 'translate-y-0 opacity-100 scale-100'
                    : 'translate-y-20 opacity-0 scale-50'
                    }`}
            >
                {/* Floating Chat Window */}
                {isOpen && (
                    <div
                        className="absolute bottom-20 right-0 w-96 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-2xl shadow-2xl border border-slate-700/50 overflow-hidden backdrop-blur-xl animate-in slide-in-from-bottom-5 duration-300"
                    >
                        {/* Header */}
                        <div className="bg-gradient-to-r from-blue-600 via-cyan-600 to-blue-600 p-4 flex items-center justify-between relative overflow-hidden">
                            {/* Animated background effect */}
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>

                            <div className="flex items-center space-x-3 relative z-10">
                                <div className="relative">
                                    <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                                        <Sparkles className="h-5 w-5 text-white" />
                                    </div>
                                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-400 rounded-full border-2 border-blue-600"></div>
                                </div>
                                <div>
                                    <h3 className="font-bold text-white text-lg">AI Trading Assistant</h3>
                                    <p className="text-blue-100 text-xs flex items-center">
                                        <span className="w-2 h-2 bg-emerald-400 rounded-full mr-1"></span>
                                        Always here to help
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
                        <div className="p-4 space-y-3 max-h-96 overflow-y-auto custom-scrollbar">
                            {/* Welcome Message */}
                            <div className="flex items-start space-x-2">
                                <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 flex items-center justify-center flex-shrink-0">
                                    <Sparkles className="h-4 w-4 text-white" />
                                </div>
                                <div className="flex-1">
                                    <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl rounded-tl-none p-3 border border-slate-700/30">
                                        <p className="text-white text-sm leading-relaxed">
                                            Hey there! 👋 Welcome to ChainVerse DEX. I'm your AI trading assistant!
                                        </p>
                                    </div>
                                    <p className="text-xs text-slate-500 mt-1 ml-2">Just now</p>
                                </div>
                            </div>

                            {/* Static Info Cards */}
                            <div className="space-y-2">
                                {staticMessages.map((msg, index) => (
                                    <div
                                        key={index}
                                        className="bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border border-blue-500/20 rounded-xl p-3 backdrop-blur-sm hover:from-blue-500/20 hover:to-cyan-500/20 transition-all duration-200 cursor-pointer"
                                    >
                                        <p className="text-slate-200 text-sm">{msg}</p>
                                    </div>
                                ))}
                            </div>

                            {/* Quick Actions */}
                            <div className="pt-2">
                                <p className="text-xs text-slate-400 mb-2 font-medium">Quick Actions</p>
                                <div className="grid grid-cols-2 gap-2">
                                    {[
                                        { icon: '📊', label: 'View Stats' },
                                        { icon: '💰', label: 'Add Liquidity' },
                                        { icon: '⚙️', label: 'Settings' },
                                        { icon: '📚', label: 'Learn More' }
                                    ].map((action, index) => (
                                        <button
                                            key={index}
                                            className="bg-slate-800/50 hover:bg-slate-700/50 border border-slate-700/30 rounded-lg p-3 text-left transition-all duration-200 hover:border-blue-500/30"
                                        >
                                            <span className="text-lg mb-1 block">{action.icon}</span>
                                            <span className="text-xs text-slate-300">{action.label}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Input Area */}
                        <div className="p-4 border-t border-slate-700/50 bg-slate-900/50">
                            <div className="flex items-center space-x-2">
                                <input
                                    type="text"
                                    placeholder="Type your message..."
                                    className="flex-1 bg-slate-800/50 border border-slate-700/50 rounded-xl px-4 py-2.5 text-white text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent transition-all duration-200"
                                />
                                <button className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 p-2.5 rounded-xl transition-all duration-200">
                                    <Send className="h-5 w-5 text-white" />
                                </button>
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
                    <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500"></div>
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
                                <MessageCircle className="h-7 w-7 text-white" />
                            )}
                        </div>

                        {/* Notification badge */}
                        {!isOpen && (
                            <div className="absolute -top-1 -right-1 w-5 h-5 bg-gradient-to-r from-red-500 to-pink-500 rounded-full border-2 border-slate-900 flex items-center justify-center">
                                <span className="text-white text-xs font-bold">1</span>
                            </div>
                        )}
                    </div>

                    {/* Tooltip */}
                    {!isOpen && (
                        <div className="absolute bottom-full right-0 mb-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
                            <div className="bg-slate-900 text-white text-sm px-3 py-2 rounded-lg shadow-xl border border-slate-700/50 whitespace-nowrap">
                                Trade with AI - Need help?
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
      `}</style>
        </>
    );
}
