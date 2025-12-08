"use client";

import React, { useState } from 'react';
import { useActiveAccount } from 'thirdweb/react';
import { ArrowUpDown, AlertCircle, Settings, RefreshCw, Wallet } from 'lucide-react';
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
    <div className="flex min-h-screen bg-slate-950">
      {/* Main Content */}
      <div className="flex-1 lg:ml-0">
        <Navbar />
        <TradeNavbar topOffset="top-16" />

        {/* Content Area */}
        <div className="pt-32 px-4 lg:px-6 pb-20">
          <div className="max-w-lg mx-auto">

            <PillNavigation />

            {/* Swap Interface */}
            <div className="bg-slate-900/50 backdrop-blur-xl rounded-[24px] border border-slate-700/50 p-4 shadow-2xl shadow-indigo-500/10">
              {/* Settings and Header */}
              <div className="flex items-center justify-between mb-4 px-2">
                <h2 className="text-xl font-bold text-white">
                  Swap
                </h2>
                <div className="flex gap-2">
                  <button
                    onClick={loadUserBalances}
                    disabled={refreshingBalances}
                    className="p-2 text-slate-400 hover:text-white transition-all duration-300 hover:bg-slate-800/50 rounded-xl"
                  >
                    <RefreshCw className={`h-5 w-5 ${refreshingBalances ? 'animate-spin' : ''}`} />
                  </button>
                  <button
                    onClick={() => setShowSettings(true)}
                    className="p-2 text-slate-400 hover:text-white transition-all duration-300 hover:bg-slate-800/50 rounded-xl"
                  >
                    <Settings className="h-5 w-5" />
                  </button>
                </div>
              </div>

              {/* Error Display */}
              {error && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex items-start space-x-3 mb-6">
                  <AlertCircle className="h-5 w-5 text-red-400 flex-shrink-0 mt-0.5" />
                  <p className="text-red-300 text-sm">{error}</p>
                </div>
              )}

              <div className="space-y-1">
                {/* From Token */}
                <div className="bg-slate-800/40 rounded-2xl p-4 border border-slate-800/60 hover:border-slate-700 transition-colors">
                  <div className="flex justify-between mb-2">
                    <span className="text-slate-400 text-sm font-medium">Sell</span>
                    <button
                      onClick={setMaxAmount}
                      className="text-xs text-blue-400 hover:text-blue-300 transition-colors font-medium"
                    >
                      Balance: {parseFloat(
                        swapForm.fromToken === 'ETH' ? balances.eth :
                          swapForm.fromToken === 'CoinA' ? balances.coinA : balances.coinB
                      ).toFixed(4)}
                    </button>
                  </div>
                  <div className="flex items-center space-x-3">
                    <input
                      type="number"
                      placeholder="0"
                      className="flex-1 bg-transparent text-3xl text-white outline-none placeholder-slate-500 font-medium [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none min-w-0"
                      value={swapForm.fromAmount}
                      onChange={(e) => setSwapForm(prev => ({ ...prev, fromAmount: e.target.value }))}
                    />
                    <select
                      className="bg-slate-700/80 hover:bg-slate-700 border border-slate-600/50 rounded-full px-3 py-1.5 text-white text-lg font-semibold min-w-[100px] focus:ring-2 focus:ring-blue-500/50 focus:border-transparent outline-none cursor-pointer transition-colors"
                      value={swapForm.fromToken}
                      onChange={(e) => setSwapForm(prev => ({ ...prev, fromToken: e.target.value }))}
                    >
                      <option value="ETH" className="bg-slate-800">ETH</option>
                      <option value="CoinA" className="bg-slate-800">CoinA</option>
                      <option value="CoinB" className="bg-slate-800">CoinB</option>
                    </select>
                  </div>
                </div>

                {/* Swap Direction Button */}
                <div className="flex justify-center -my-3 relative z-10 h-8">
                  <button
                    onClick={() => setSwapForm(prev => ({
                      ...prev,
                      fromToken: prev.toToken,
                      toToken: prev.fromToken,
                      fromAmount: prev.toAmount,
                      toAmount: prev.fromAmount
                    }))}
                    className="p-2 bg-slate-900 border-[3px] border-slate-950 rounded-xl text-slate-400 hover:text-white transition-all duration-300 hover:scale-110 hover:bg-slate-700"
                  >
                    <ArrowUpDown className="h-4 w-4" />
                  </button>
                </div>

                {/* To Token */}
                <div className="bg-slate-800/40 rounded-2xl p-4 border border-slate-800/60 hover:border-slate-700 transition-colors">
                  <div className="flex justify-between mb-2">
                    <span className="text-slate-400 text-sm font-medium">Buy</span>
                    <span className="text-xs text-slate-500">
                      Balance: {parseFloat(
                        swapForm.toToken === 'ETH' ? balances.eth :
                          swapForm.toToken === 'CoinA' ? balances.coinA : balances.coinB
                      ).toFixed(4)}
                    </span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <input
                      type="number"
                      placeholder="0"
                      className="flex-1 bg-transparent text-3xl text-white outline-none placeholder-slate-500 font-medium [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none min-w-0"
                      value={swapForm.toAmount}
                      readOnly
                    />
                    <select
                      className="bg-slate-700/80 hover:bg-slate-700 border border-slate-600/50 rounded-full px-3 py-1.5 text-white text-lg font-semibold min-w-[100px] focus:ring-2 focus:ring-blue-500/50 focus:border-transparent outline-none cursor-pointer transition-colors"
                      value={swapForm.toToken}
                      onChange={(e) => setSwapForm(prev => ({ ...prev, toToken: e.target.value }))}
                    >
                      <option value="ETH" className="bg-slate-800">ETH</option>
                      <option value="CoinA" className="bg-slate-800">CoinA</option>
                      <option value="CoinB" className="bg-slate-800">CoinB</option>
                    </select>
                  </div>
                </div>

                {/* Swap Details */}
                {swapForm.fromAmount && swapForm.toAmount && (
                  <div className="pt-2 px-2">
                    <div className="flex justify-between items-center text-xs text-slate-400">
                      <span className="flex items-center gap-1"><Settings className="h-3 w-3" /> Slippage {swapSettings.slippage}%</span>
                      <span>1 {swapForm.fromToken} = {(parseFloat(swapForm.toAmount) / parseFloat(swapForm.fromAmount)).toFixed(6)} {swapForm.toToken}</span>
                    </div>
                  </div>
                )}

                {/* Swap Button */}
                <div className="pt-3">
                  <button
                    onClick={executeSwap}
                    disabled={loading || !swapForm.fromAmount || !swapForm.toAmount || swapForm.fromToken === swapForm.toToken || !account}
                    className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:from-slate-800 disabled:to-slate-800 disabled:text-slate-500 text-white py-4 rounded-2xl font-bold text-lg transition-all duration-300 disabled:cursor-not-allowed flex items-center justify-center space-x-2 shadow-lg shadow-indigo-500/20 disabled:shadow-none"
                  >
                    {loading ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-white/30 border-b-2 border-white"></div>
                        <span>Swapping...</span>
                      </>
                    ) : (
                      <span>
                        {!account ? 'Connect Wallet' :
                          swapForm.fromToken === swapForm.toToken ? 'Select Different Tokens' :
                            !swapForm.fromAmount ? 'Enter Amount' :
                              'Swap'}
                      </span>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Prices & Portfolio Summary */}
            <div className="mt-6 grid grid-cols-2 gap-4">
              <div className="bg-slate-900/40 rounded-xl p-3 border border-slate-800/50 flex flex-col items-center justify-center">
                <span className="text-xs text-slate-500 mb-1">ETH / CoinA</span>
                <span className="text-sm font-semibold text-white">1 ETH = {tokenPrices.ethCoinA} CoinA</span>
              </div>
              <div className="bg-slate-900/40 rounded-xl p-3 border border-slate-800/50 flex flex-col items-center justify-center">
                <span className="text-xs text-slate-500 mb-1">ETH / CoinB</span>
                <span className="text-sm font-semibold text-white">1 ETH = {tokenPrices.ethCoinB} CoinB</span>
              </div>
            </div>

            <div className="mt-4 flex justify-center gap-4 text-xs text-slate-500">
              <div className="flex items-center gap-1">
                <Wallet className="h-3 w-3" />
                <span>ETH: {parseFloat(balances.eth).toFixed(4)}</span>
              </div>
              <span>•</span>
              <span>CoinA: {parseFloat(balances.coinA).toFixed(2)}</span>
              <span>•</span>
              <span>CoinB: {parseFloat(balances.coinB).toFixed(2)}</span>
            </div>

          </div>
        </div>
      </div>

      {/* Settings Modal */}
      {showSettings && (
        <SwapSettings
          settings={swapSettings}
          onSettingsChange={setSwapSettings}
          onClose={() => setShowSettings(false)}
        />
      )}

      {/* Chat Bubble with Props */}
      <ChatBubble
        onExecuteSwap={executeSwap}
        onSetSwapForm={(form: any) => setSwapForm((prev: any) => ({ ...prev, ...form }))}
        tokenPrices={tokenPrices}
        currentBalances={balances}
      />
    </div>
  );
}