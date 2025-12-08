"use client";

import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { useActiveAccount } from 'thirdweb/react';
import { ArrowUpDown, AlertCircle, Settings, RefreshCw, Wallet } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { CONTRACTS, ERC20_ABI, DEX_ABI } from '@/lib/dex/contracts';
import { loadBalances, getExplorerUrl } from '@/lib/dex/utils';
import { TokenBalance, SwapForm } from '@/types/types-dex';
import TradeNavbar from '@/components/shared/TradeNavbar';
import Navbar from '@/components/home/navbar';
import SwapSettings from '@/components/dex/SwapSettings';
import PillNavigation from '@/components/dex/PillNavigation';
import ChatBubble from '@/components/dex/ChatBubble';

// API service for DEX swap
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000/api';

class DexSwapAPI {
  static async recordSwap(swapData: any) {
    const token = localStorage.getItem('access_token');
    const response = await fetch(`${API_BASE_URL}/user/dex/swap/record`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(swapData)
    });
    return response.json();
  }

  static async updateSwapStatus(txHash: string, status: string) {
    const token = localStorage.getItem('access_token');
    const response = await fetch(`${API_BASE_URL}/user/dex/swap/${txHash}/status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ status })
    });
    return response.json();
  }

  static async getTokenPrice(token: string) {
    const response = await fetch(`${API_BASE_URL}/user/dex/price/${token}`);
    return response.json();
  }
}

export default function SwapPage() {
  const account = useActiveAccount();
  const [balances, setBalances] = useState<TokenBalance>({
    eth: '0',
    coinA: '0',
    coinB: '0'
  });
  const [loading, setLoading] = useState(false);
  const [refreshingBalances, setRefreshingBalances] = useState(false);
  const [tokenPrices, setTokenPrices] = useState({ ethCoinA: '0', ethCoinB: '0' });
  const [showSettings, setShowSettings] = useState(false);
  const [swapForm, setSwapForm] = useState<SwapForm>({
    fromToken: 'ETH',
    toToken: 'CoinA',
    fromAmount: '',
    toAmount: '',
    slippage: '1'
  });
  const [error, setError] = useState('');
  const [swapSettings, setSwapSettings] = useState({
    slippage: '1',
    deadline: '20',
    expertMode: false,
    gasPrice: 'standard'
  });

  const loadUserBalances = async () => {
    if (!account?.address || !window.ethereum) return;

    setRefreshingBalances(true);
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const { balances: newBalances, poolsData } = await loadBalances(provider, account.address);
      setBalances(newBalances);

      // Calculate prices
      const ethCoinAPrice = poolsData.coinA.ethReserve && poolsData.coinA.tokenReserve && parseFloat(poolsData.coinA.ethReserve) > 0
        ? (parseFloat(poolsData.coinA.tokenReserve) / parseFloat(poolsData.coinA.ethReserve)).toFixed(6)
        : '0';

      const ethCoinBPrice = poolsData.coinB.ethReserve && poolsData.coinB.tokenReserve && parseFloat(poolsData.coinB.ethReserve) > 0
        ? (parseFloat(poolsData.coinB.tokenReserve) / parseFloat(poolsData.coinB.ethReserve)).toFixed(6)
        : '0';

      setTokenPrices({ ethCoinA: ethCoinAPrice, ethCoinB: ethCoinBPrice });
    } catch (error) {
      console.error('Failed to load balances:', error);
      setError('Failed to load balances');
    } finally {
      setRefreshingBalances(false);
    }
  };

  const calculateOutput = async () => {
    if (!account?.address || !window.ethereum || !swapForm.fromAmount) return;

    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const dexContract = new ethers.Contract(CONTRACTS.dex, DEX_ABI, provider);

      const amountIn = ethers.parseUnits(swapForm.fromAmount, 18);
      let reserveIn: bigint, reserveOut: bigint;

      if (swapForm.fromToken === 'ETH' && swapForm.toToken === 'CoinA') {
        const pool = await dexContract.pools(CONTRACTS.coinA);
        reserveIn = pool.ethReserve;
        reserveOut = pool.tokenReserve;
      } else if (swapForm.fromToken === 'ETH' && swapForm.toToken === 'CoinB') {
        const pool = await dexContract.pools(CONTRACTS.coinB);
        reserveIn = pool.ethReserve;
        reserveOut = pool.tokenReserve;
      } else if (swapForm.fromToken === 'CoinA' && swapForm.toToken === 'ETH') {
        const pool = await dexContract.pools(CONTRACTS.coinA);
        reserveIn = pool.tokenReserve;
        reserveOut = pool.ethReserve;
      } else if (swapForm.fromToken === 'CoinB' && swapForm.toToken === 'ETH') {
        const pool = await dexContract.pools(CONTRACTS.coinB);
        reserveIn = pool.tokenReserve;
        reserveOut = pool.ethReserve;
      } else if (swapForm.fromToken === 'CoinA' && swapForm.toToken === 'CoinB') {
        const pool = await dexContract.tokenPool();
        reserveIn = pool.coinAReserve;
        reserveOut = pool.coinBReserve;
      } else if (swapForm.fromToken === 'CoinB' && swapForm.toToken === 'CoinA') {
        const pool = await dexContract.tokenPool();
        reserveIn = pool.coinBReserve;
        reserveOut = pool.coinAReserve;
      } else {
        return;
      }

      if (reserveIn === BigInt(0) || reserveOut === BigInt(0)) {
        setSwapForm(prev => ({ ...prev, toAmount: '0' }));
        return;
      }

      const amountOut = await dexContract.getAmountOut(amountIn, reserveIn, reserveOut);
      const feePercent = BigInt(50);
      const percentBase = BigInt(10000);
      const afterFee = amountOut - (amountOut * feePercent / percentBase);

      const output = parseFloat(ethers.formatUnits(afterFee, 18)).toFixed(6);
      setSwapForm(prev => ({ ...prev, toAmount: output }));
      setError('');
    } catch (error) {
      console.error('Failed to calculate swap output:', error);
      setError('Failed to calculate swap output');
    }
  };

  const executeSwap = async () => {
    if (!account?.address || !window.ethereum || !swapForm.fromAmount || !swapForm.toAmount) return;

    setLoading(true);
    setError('');

    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const dexContract = new ethers.Contract(CONTRACTS.dex, DEX_ABI, signer);

      const amountIn = ethers.parseUnits(swapForm.fromAmount, 18);
      const minAmountOut = ethers.parseUnits(swapForm.toAmount, 18) * BigInt(100 - parseInt(swapSettings.slippage)) / BigInt(100);

      let tx;

      if (swapForm.fromToken === 'ETH') {
        const tokenAddress = swapForm.toToken === 'CoinA' ? CONTRACTS.coinA : CONTRACTS.coinB;
        tx = await dexContract.swapEthForTokens(tokenAddress, minAmountOut, {
          value: amountIn,
          gasLimit: 300000
        });
      } else if (swapForm.toToken === 'ETH') {
        const tokenAddress = swapForm.fromToken === 'CoinA' ? CONTRACTS.coinA : CONTRACTS.coinB;
        const tokenContract = new ethers.Contract(tokenAddress, ERC20_ABI, signer);
        const allowance = await tokenContract.allowance(account.address, CONTRACTS.dex);

        if (allowance < amountIn) {
          const approveTx = await tokenContract.approve(CONTRACTS.dex, amountIn);
          await approveTx.wait();
        }

        tx = await dexContract.swapTokensForEth(tokenAddress, amountIn, minAmountOut, {
          gasLimit: 300000
        });
      } else {
        const tokenInAddress = swapForm.fromToken === 'CoinA' ? CONTRACTS.coinA : CONTRACTS.coinB;
        const tokenOutAddress = swapForm.toToken === 'CoinA' ? CONTRACTS.coinA : CONTRACTS.coinB;
        const tokenContract = new ethers.Contract(tokenInAddress, ERC20_ABI, signer);
        const allowance = await tokenContract.allowance(account.address, CONTRACTS.dex);

        if (allowance < amountIn) {
          const approveTx = await tokenContract.approve(CONTRACTS.dex, amountIn);
          await approveTx.wait();
        }

        tx = await dexContract.swapTokens(tokenInAddress, tokenOutAddress, amountIn, minAmountOut, {
          gasLimit: 300000
        });
      }

      // Record swap in database
      const exchangeRate = parseFloat(swapForm.toAmount) / parseFloat(swapForm.fromAmount);
      const priceImpact = Math.abs(exchangeRate - 1) * 100;

      const swapData = {
        txHash: tx.hash,
        walletAddress: account.address,
        fromToken: swapForm.fromToken,
        toToken: swapForm.toToken,
        fromAmount: swapForm.fromAmount,
        toAmount: swapForm.toAmount,
        actualFromAmount: swapForm.fromAmount,
        actualToAmount: swapForm.toAmount,
        exchangeRate,
        slippage: parseFloat(swapSettings.slippage),
        gasUsed: '300000',
        gasFee: '0.01',
        blockNumber: await provider.getBlockNumber(),
        priceImpact
      };

      try {
        await DexSwapAPI.recordSwap(swapData);
      } catch (dbError) {
        console.error('Failed to record swap in database:', dbError);
      }

      await tx.wait();

      try {
        await DexSwapAPI.updateSwapStatus(tx.hash, 'completed');
      } catch (dbError) {
        console.error('Failed to update swap status:', dbError);
      }

      toast({
        variant: "default",
        title: "Swap Successful! 🎉",
        description: (
          <div className="space-y-2">
            <p>Successfully swapped {swapForm.fromAmount} {swapForm.fromToken} for {swapForm.toAmount} {swapForm.toToken}</p>
            <a
              href={getExplorerUrl(tx.hash)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center text-blue-400 hover:text-blue-300 underline"
            >
              View on Explorer →
            </a>
          </div>
        ),
      });

      await loadUserBalances();
      setSwapForm(prev => ({ ...prev, fromAmount: '', toAmount: '' }));
    } catch (error: any) {
      console.error('Swap failed:', error);
      const errorMessage = error.reason || error.message || 'Unknown error';
      setError(`Swap failed: ${errorMessage}`);

      if (error.transaction?.hash) {
        try {
          await DexSwapAPI.updateSwapStatus(error.transaction.hash, 'failed');
        } catch (dbError) {
          console.error('Failed to update swap status to failed:', dbError);
        }
      }

      toast({
        variant: "destructive",
        title: "Swap Failed",
        description: errorMessage,
      });
    } finally {
      setLoading(false);
    }
  };

  const getTokenBalance = (token: string) => {
    switch (token) {
      case 'ETH': return balances.eth;
      case 'CoinA': return balances.coinA;
      case 'CoinB': return balances.coinB;
      default: return '0';
    }
  };

  const setMaxAmount = () => {
    const balance = getTokenBalance(swapForm.fromToken);
    if (swapForm.fromToken === 'ETH') {
      const maxAmount = Math.max(0, parseFloat(balance) - 0.01);
      setSwapForm(prev => ({ ...prev, fromAmount: maxAmount.toString() }));
    } else {
      setSwapForm(prev => ({ ...prev, fromAmount: balance }));
    }
  };

  useEffect(() => {
    if (account?.address) {
      loadUserBalances();
    }
  }, [account?.address]);

  useEffect(() => {
    if (swapForm.fromAmount && account?.address) {
      const timer = setTimeout(calculateOutput, 500);
      return () => clearTimeout(timer);
    }
  }, [swapForm.fromAmount, swapForm.fromToken, swapForm.toToken]);

  useEffect(() => {
    if (account?.address) {
      const interval = setInterval(loadUserBalances, 30000);
      return () => clearInterval(interval);
    }
  }, [account?.address]);

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
                      Balance: {parseFloat(getTokenBalance(swapForm.fromToken)).toFixed(4)}
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
                      Balance: {parseFloat(getTokenBalance(swapForm.toToken)).toFixed(4)}
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
                      {/* Price Impact or Quote Info could go here */}
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

      {/* Chat Bubble */}
      <ChatBubble />
    </div>
  );
}