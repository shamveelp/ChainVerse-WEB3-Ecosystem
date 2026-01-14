"use client";

import React, { useState } from 'react';
import { useActiveAccount } from 'thirdweb/react';
import { ArrowUpDown, AlertCircle, Settings, RefreshCw, Wallet, Info } from 'lucide-react';
import { getExplorerUrl } from '@/lib/dex/utils';
import TradeNavbar from '@/components/shared/TradeNavbar';
import Navbar from '@/components/home/navbar';
import SwapSettings from '@/components/dex/SwapSettings';
import PillNavigation from '@/components/dex/PillNavigation';
import ChatBubble from '@/components/dex/ChatBubble';
import { useDexSwap } from '@/hooks/useDexSwap';

export default function SwapPage() {
  const account = useActiveAccount();
  const [showSettings, setShowSettings] = useState(false);

  const {
    balances,
    loading,
    refreshingBalances,
    tokenPrices,
    swapForm,
    setSwapForm,
    swapSettings,
    setSwapSettings,
    error,
    loadUserBalances,
    executeSwap,
    setMaxAmount
  } = useDexSwap();

  return (
    <div className="flex min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-black text-white selection:bg-blue-500/30">

      {/* Background decoration */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl mix-blend-screen animate-pulse" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl mix-blend-screen animate-pulse delay-1000" />
      </div>

      <div className="flex-1 lg:ml-0 relative z-10">
        <Navbar />
        <TradeNavbar topOffset="top-[130px]" />

        <div className="pt-32 md:pt-32 px-4 pb-20 flex flex-col items-center min-h-screen">

          <div className="w-full max-w-lg mx-auto space-y-6">
            <PillNavigation />

            {/* Main Swap Card */}
            <div className="relative group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-cyan-500 to-purple-600 rounded-[28px] opacity-30 group-hover:opacity-50 blur transition duration-1000"></div>
              <div className="relative bg-slate-950/80 backdrop-blur-xl rounded-[26px] border border-white/10 p-5 md:p-6 shadow-2xl">

                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
                    Swap Tokens
                  </h2>
                  <div className="flex gap-2">
                    <button
                      onClick={loadUserBalances}
                      disabled={refreshingBalances}
                      className="p-2 text-slate-400 hover:text-white transition-all duration-300 hover:bg-white/5 rounded-xl active:scale-95"
                    >
                      <RefreshCw className={`h-5 w-5 ${refreshingBalances ? 'animate-spin' : ''}`} />
                    </button>
                    <button
                      onClick={() => setShowSettings(true)}
                      className="p-2 text-slate-400 hover:text-white transition-all duration-300 hover:bg-white/5 rounded-xl active:scale-95"
                    >
                      <Settings className="h-5 w-5" />
                    </button>
                  </div>
                </div>

                {error && (
                  <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4 flex items-start space-x-3 mb-6 animate-in fade-in slide-in-from-top-2">
                    <AlertCircle className="h-5 w-5 text-red-400 flex-shrink-0 mt-0.5" />
                    <p className="text-red-300 text-sm">{error}</p>
                  </div>
                )}

                <div className="space-y-1">
                  {/* From Token Section */}
                  <div className="bg-slate-900/50 rounded-2xl p-4 border border-white/5 hover:border-white/10 transition-colors group/input focus-within:border-blue-500/30">
                    <div className="flex justify-between mb-3">
                      <span className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Sell</span>
                      <div className="flex items-center gap-1.5 cursor-pointer hover:bg-white/5 px-2 py-0.5 rounded-full transition-colors" onClick={setMaxAmount}>
                        <Wallet className="h-3 w-3 text-slate-500" />
                        <span className="text-xs text-slate-400 font-medium">
                          {parseFloat(
                            swapForm.fromToken === 'ETH' ? balances.eth :
                              swapForm.fromToken === 'CoinA' ? balances.coinA : balances.coinB
                          ).toFixed(4)}
                        </span>
                        <span className="text-xs text-blue-400 font-bold ml-1">MAX</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 sm:gap-4">
                      <input
                        type="number"
                        placeholder="0.0"
                        className="flex-1 w-0 bg-transparent text-3xl md:text-4xl font-bold text-white outline-none placeholder-slate-700 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none min-w-0"
                        value={swapForm.fromAmount}
                        onChange={(e) => setSwapForm(prev => ({ ...prev, fromAmount: e.target.value }))}
                      />
                      <div className="shrink-0 relative">
                        <select
                          className="w-[90px] sm:w-[110px] appearance-none bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white font-semibold rounded-full py-2 pl-3 pr-8 sm:pl-4 transition-colors cursor-pointer outline-none focus:ring-2 focus:ring-blue-500/20 text-sm sm:text-base"
                          value={swapForm.fromToken}
                          onChange={(e) => setSwapForm(prev => ({ ...prev, fromToken: e.target.value }))}
                        >
                          <option value="ETH">ETH</option>
                          <option value="CoinA">CoinA</option>
                          <option value="CoinB">CoinB</option>
                        </select>
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                          <svg width="10" height="6" viewBox="0 0 10 6" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M1 1L5 5L9 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Switcher */}
                  <div className="flex justify-center -my-3 relative z-10 w-full">
                    <button
                      onClick={() => setSwapForm(prev => ({
                        ...prev,
                        fromToken: prev.toToken,
                        toToken: prev.fromToken,
                        fromAmount: prev.toAmount,
                        toAmount: prev.fromAmount
                      }))}
                      className="group bg-slate-950 border-[4px] border-slate-950 rounded-xl p-2 hover:bg-slate-800 transition-all duration-300 hover:scale-110 active:scale-95 active:rotate-180"
                    >
                      <ArrowUpDown className="h-4 w-4 text-slate-400 group-hover:text-cyan-400 transition-colors" />
                    </button>
                  </div>

                  {/* To Token Section */}
                  <div className="bg-slate-900/50 rounded-2xl p-4 border border-white/5 hover:border-white/10 transition-colors group/input focus-within:border-purple-500/30">
                    <div className="flex justify-between mb-3">
                      <span className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Buy</span>
                      <span className="text-xs text-slate-400 font-medium">
                        Balance: {parseFloat(
                          swapForm.toToken === 'ETH' ? balances.eth :
                            swapForm.toToken === 'CoinA' ? balances.coinA : balances.coinB
                        ).toFixed(4)}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 sm:gap-4">
                      <input
                        type="number"
                        placeholder="0.0"
                        className="flex-1 w-0 bg-transparent text-3xl md:text-4xl font-bold text-white outline-none placeholder-slate-700 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none min-w-0"
                        value={swapForm.toAmount}
                        readOnly
                      />
                      <div className="shrink-0 relative">
                        <select
                          className="w-[90px] sm:w-[110px] appearance-none bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white font-semibold rounded-full py-2 pl-3 pr-8 sm:pl-4 transition-colors cursor-pointer outline-none focus:ring-2 focus:ring-blue-500/20 text-sm sm:text-base"
                          value={swapForm.toToken}
                          onChange={(e) => setSwapForm(prev => ({ ...prev, toToken: e.target.value }))}
                        >
                          <option value="ETH">ETH</option>
                          <option value="CoinA">CoinA</option>
                          <option value="CoinB">CoinB</option>
                        </select>
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                          <svg width="10" height="6" viewBox="0 0 10 6" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M1 1L5 5L9 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Info Row */}
                  {(swapForm.fromAmount && swapForm.toAmount) ? (
                    <div className="px-2 pt-2 flex flex-wrap justify-between items-center gap-2 text-xs font-medium text-slate-400 animate-in fade-in slide-in-from-top-1">
                      <div className="flex items-center gap-1.5 bg-white/5 px-2 py-1 rounded-lg">
                        <Settings className="h-3 w-3" />
                        <span>Slippage {swapSettings.slippage}%</span>
                      </div>
                      <div className="flex items-center gap-1.5 bg-white/5 px-2 py-1 rounded-lg">
                        <Info className="h-3 w-3" />
                        <span>1 {swapForm.fromToken} ≈ {(parseFloat(swapForm.toAmount) / parseFloat(swapForm.fromAmount)).toFixed(4)} {swapForm.toToken}</span>
                      </div>
                    </div>
                  ) : <div className="h-6" />}

                  {/* Action Button */}
                  <button
                    onClick={executeSwap}
                    disabled={loading || !swapForm.fromAmount || !swapForm.toAmount || swapForm.fromToken === swapForm.toToken || !account}
                    className="w-full mt-4 bg-gradient-to-r from-cyan-500 via-blue-500 to-indigo-600 hover:from-cyan-400 hover:via-blue-400 hover:to-indigo-500 text-white py-4 rounded-2xl font-bold text-lg transition-all duration-300 transform active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40 relative overflow-hidden group/btn"
                  >
                    <div className="absolute inset-0 bg-white/20 translate-y-full group-hover/btn:translate-y-0 transition-transform duration-300" />
                    {loading ? (
                      <div className="flex items-center justify-center gap-2">
                        <div className="animate-spin rounded-full h-5 w-5 border-2 border-white/30 border-t-white"></div>
                        <span>Processing...</span>
                      </div>
                    ) : (
                      <span className="relative z-10">
                        {!account ? 'Connect Wallet' :
                          swapForm.fromToken === swapForm.toToken ? 'Select Different Tokens' :
                            !swapForm.fromAmount ? 'Enter Amount' :
                              'Swap Tokens'}
                      </span>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 gap-3 md:gap-4">
              <div className="bg-slate-900/40 backdrop-blur-md rounded-2xl p-4 border border-white/5 flex flex-col items-center justify-center text-center hover:bg-slate-900/60 transition-colors">
                <span className="text-xs text-slate-500 mb-1 font-medium tracking-wide">ETH / CoinA</span>
                <span className="text-sm md:text-base font-bold text-white">1 ETH = {tokenPrices.ethCoinA} A</span>
              </div>
              <div className="bg-slate-900/40 backdrop-blur-md rounded-2xl p-4 border border-white/5 flex flex-col items-center justify-center text-center hover:bg-slate-900/60 transition-colors">
                <span className="text-xs text-slate-500 mb-1 font-medium tracking-wide">ETH / CoinB</span>
                <span className="text-sm md:text-base font-bold text-white">1 ETH = {tokenPrices.ethCoinB} B</span>
              </div>
            </div>

          </div>
        </div>
      </div>

      {showSettings && (
        <SwapSettings
          settings={swapSettings}
          onSettingsChange={setSwapSettings}
          onClose={() => setShowSettings(false)}
        />
      )}

      <ChatBubble
        onExecuteSwap={executeSwap}
        onSetSwapForm={(form: Partial<typeof swapForm>) => setSwapForm((prev: typeof swapForm) => ({ ...prev, ...form }))}
        tokenPrices={tokenPrices}
        currentBalances={balances}
      />
    </div>
  );
}