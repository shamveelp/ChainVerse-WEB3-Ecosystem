"use client";

import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { useActiveAccount } from 'thirdweb/react';
import { ArrowUpDown, AlertCircle, Settings, TrendingUp, Wallet, RefreshCw, Info, Zap } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { CONTRACTS, ERC20_ABI, DEX_ABI } from '@/lib/dex/contracts';
import { loadBalances, getExplorerUrl } from '@/lib/dex/utils';
import { TokenBalance, SwapForm } from '@/types/types-dex';
import TradeNavbar from '@/components/shared/TradeNavbar';
import Navbar from '@/components/home/navbar';
import TradingChart from '@/components/dex/TradingChart';
import SwapSettings from '@/components/dex/SwapSettings';
import PillNavigation from '@/components/dex/PillNavigation';
import LiquidityInterface from '@/components/dex/LiquidityInterface';
import BuyCryptoInterface from '@/components/dex/BuyCryptoInterface';
import AnalyticsInterface from '@/components/dex/AnalyticsInterface';
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

  static async getChartData(baseToken: string, quoteToken: string, timeframe: string) {
    const response = await fetch(`${API_BASE_URL}/user/dex/chart?baseToken=${baseToken}&quoteToken=${quoteToken}&timeframe=${timeframe}&limit=100`);
    return response.json();
  }

  static async getTokenPrice(token: string) {
    const response = await fetch(`${API_BASE_URL}/user/dex/price/${token}`);
    return response.json();
  }

  static async getTradingPairStats(baseToken: string, quoteToken: string) {
    const response = await fetch(`${API_BASE_URL}/user/dex/stats/pair/${baseToken}/${quoteToken}`);
    return response.json();
  }
}

export default function SwapPage() {
  const account = useActiveAccount();
  const [activeTab, setActiveTab] = useState('swap');
  const [balances, setBalances] = useState<TokenBalance>({
    eth: '0',
    coinA: '0',
    coinB: '0'
  });
  const [loading, setLoading] = useState(false);
  const [refreshingBalances, setRefreshingBalances] = useState(false);
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
  const [tokenPrices, setTokenPrices] = useState<{
    ethCoinA: string;
    ethCoinB: string;
    coinACoinB: string;
  }>({
    ethCoinA: '0',
    ethCoinB: '0',
    coinACoinB: '0'
  });

  const loadUserBalances = async () => {
    if (!account?.address || !window.ethereum) return;

    setRefreshingBalances(true);
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const { balances: newBalances } = await loadBalances(provider, account.address);
      setBalances(newBalances);
    } catch (error) {
      console.error('Failed to load balances:', error);
      setError('Failed to load balances');
    } finally {
      setRefreshingBalances(false);
    }
  };

  const fetchTokenPrices = async () => {
    if (!window.ethereum) return;

    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const dexContract = new ethers.Contract(CONTRACTS.dex, DEX_ABI, provider);

      // Fetch ETH/CoinA pool
      const poolA = await dexContract.pools(CONTRACTS.coinA);
      const ethReserveA = poolA.ethReserve;
      const tokenReserveA = poolA.tokenReserve;

      // Fetch ETH/CoinB pool
      const poolB = await dexContract.pools(CONTRACTS.coinB);
      const ethReserveB = poolB.ethReserve;
      const tokenReserveB = poolB.tokenReserve;

      // Fetch CoinA/CoinB pool
      const tokenPool = await dexContract.tokenPool();
      const coinAReserve = tokenPool.coinAReserve;
      const coinBReserve = tokenPool.coinBReserve;

      // Calculate prices (1 ETH = X tokens)
      let ethCoinAPrice = '0';
      let ethCoinBPrice = '0';
      let coinACoinBPrice = '0';

      if (ethReserveA > BigInt(0) && tokenReserveA > BigInt(0)) {
        ethCoinAPrice = ethers.formatUnits(tokenReserveA * BigInt(1e18) / ethReserveA, 18);
      }

      if (ethReserveB > BigInt(0) && tokenReserveB > BigInt(0)) {
        ethCoinBPrice = ethers.formatUnits(tokenReserveB * BigInt(1e18) / ethReserveB, 18);
      }

      if (coinAReserve > BigInt(0) && coinBReserve > BigInt(0)) {
        coinACoinBPrice = ethers.formatUnits(coinBReserve * BigInt(1e18) / coinAReserve, 18);
      }

      setTokenPrices({
        ethCoinA: ethCoinAPrice,
        ethCoinB: ethCoinBPrice,
        coinACoinB: coinACoinBPrice
      });
    } catch (error) {
      console.error('Failed to fetch token prices:', error);
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
      await fetchTokenPrices();
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
    fetchTokenPrices();
    const interval = setInterval(fetchTokenPrices, 15000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (swapForm.fromAmount && account?.address && activeTab === 'swap') {
      const timer = setTimeout(calculateOutput, 500);
      return () => clearTimeout(timer);
    }
  }, [swapForm.fromAmount, swapForm.fromToken, swapForm.toToken, activeTab]);

  useEffect(() => {
    if (account?.address) {
      const interval = setInterval(loadUserBalances, 30000);
      return () => clearInterval(interval);
    }
  }, [account?.address]);

  const renderTabContent = () => {
    switch (activeTab) {
      case 'swap':
        return (
          <>
            {/* Swap Interface */}
            <div className="bg-slate-900/50 backdrop-blur-xl rounded-2xl border border-slate-700/50 p-6">
              {/* Settings and Header */}
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-white">
                  Swap Tokens
                </h2>
                <button
                  onClick={() => setShowSettings(true)}
                  className="p-2 text-slate-400 hover:text-white transition-all duration-300 hover:bg-slate-800/50 rounded-xl"
                >
                  <Settings className="h-5 w-5" />
                </button>
              </div>

              {/* Error Display */}
              {error && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex items-start space-x-3 mb-6">
                  <AlertCircle className="h-5 w-5 text-red-400 flex-shrink-0 mt-0.5" />
                  <p className="text-red-300 text-sm">{error}</p>
                </div>
              )}

              <div className="space-y-4">
                {/* From Token */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-slate-300">From</label>
                    <button
                      onClick={setMaxAmount}
                      className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
                    >
                      Balance: {parseFloat(getTokenBalance(swapForm.fromToken)).toFixed(4)} • MAX
                    </button>
                  </div>
                  <div className="bg-slate-800/30 rounded-xl p-4 border border-slate-700/50">
                    <div className="flex items-center space-x-3">
                      <select
                        className="bg-slate-700/50 border border-slate-600/50 rounded-lg px-3 py-2 text-white text-sm min-w-[80px] focus:ring-2 focus:ring-blue-500/50 focus:border-transparent outline-none"
                        value={swapForm.fromToken}
                        onChange={(e) => setSwapForm(prev => ({ ...prev, fromToken: e.target.value }))}
                      >
                        <option value="ETH" className="bg-slate-800">ETH</option>
                        <option value="CoinA" className="bg-slate-800">CoinA</option>
                        <option value="CoinB" className="bg-slate-800">CoinB</option>
                      </select>
                      <input
                        type="number"
                        placeholder="0.0"
                        className="flex-1 bg-transparent text-xl text-white outline-none placeholder-slate-400 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        value={swapForm.fromAmount}
                        onChange={(e) => setSwapForm(prev => ({ ...prev, fromAmount: e.target.value }))}
                      />
                    </div>
                  </div>
                </div>

                {/* Swap Direction Button */}
                <div className="flex justify-center">
                  <button
                    onClick={() => setSwapForm(prev => ({
                      ...prev,
                      fromToken: prev.toToken,
                      toToken: prev.fromToken,
                      fromAmount: prev.toAmount,
                      toAmount: prev.fromAmount
                    }))}
                    className="p-3 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 border border-slate-600/50 rounded-xl transition-all duration-300 transform hover:scale-110"
                  >
                    <ArrowUpDown className="h-5 w-5 text-white" />
                  </button>
                </div>

                {/* To Token */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300">To</label>
                  <div className="bg-slate-800/30 rounded-xl p-4 border border-slate-700/50">
                    <div className="flex items-center space-x-3">
                      <select
                        className="bg-slate-700/50 border border-slate-600/50 rounded-lg px-3 py-2 text-white text-sm min-w-[80px] focus:ring-2 focus:ring-blue-500/50 focus:border-transparent outline-none"
                        value={swapForm.toToken}
                        onChange={(e) => setSwapForm(prev => ({ ...prev, toToken: e.target.value }))}
                      >
                        <option value="ETH" className="bg-slate-800">ETH</option>
                        <option value="CoinA" className="bg-slate-800">CoinA</option>
                        <option value="CoinB" className="bg-slate-800">CoinB</option>
                      </select>
                      <input
                        type="number"
                        placeholder="0.0"
                        className="flex-1 bg-transparent text-xl text-white outline-none placeholder-slate-400 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        value={swapForm.toAmount}
                        readOnly
                      />
                    </div>
                  </div>
                </div>

                {/* Swap Details */}
                {swapForm.fromAmount && swapForm.toAmount && (
                  <div className="bg-slate-800/20 rounded-xl p-4 space-y-2 text-sm border border-slate-700/30">
                    <div className="flex justify-between text-slate-400">
                      <span>Exchange Rate:</span>
                      <span className="text-white">1 {swapForm.fromToken} = {(parseFloat(swapForm.toAmount) / parseFloat(swapForm.fromAmount)).toFixed(6)} {swapForm.toToken}</span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>Slippage Tolerance:</span>
                      <span className="text-white">{swapSettings.slippage}%</span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>Minimum Received:</span>
                      <span className="text-white">{(parseFloat(swapForm.toAmount) * (100 - parseFloat(swapSettings.slippage)) / 100).toFixed(6)} {swapForm.toToken}</span>
                    </div>
                  </div>
                )}

                {/* Swap Button */}
                <button
                  onClick={executeSwap}
                  disabled={loading || !swapForm.fromAmount || !swapForm.toAmount || swapForm.fromToken === swapForm.toToken || !account}
                  className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 disabled:from-slate-700 disabled:to-slate-700 text-white py-4 rounded-xl font-bold transition-all duration-300 disabled:cursor-not-allowed flex items-center justify-center space-x-2 transform hover:scale-[1.02] disabled:hover:scale-100"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-white"></div>
                      <span>Processing Swap...</span>
                    </>
                  ) : (
                    <span>
                      {!account ? 'Connect Wallet' :
                        swapForm.fromToken === swapForm.toToken ? 'Select Different Tokens' :
                          !swapForm.fromAmount ? 'Enter Amount' :
                            'Execute Swap'}
                    </span>
                  )}
                </button>
              </div>
            </div>

            {/* Portfolio Section - Below Swap */}
            <div className="bg-slate-900/50 backdrop-blur-xl rounded-2xl border border-slate-700/50 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <Wallet className="h-5 w-5 text-blue-400" />
                  <h3 className="text-lg font-bold text-white">Your Portfolio</h3>
                </div>
                <button
                  onClick={loadUserBalances}
                  disabled={refreshingBalances}
                  className="p-2 text-slate-400 hover:text-white transition-colors hover:bg-slate-800/50 rounded-lg"
                >
                  <RefreshCw className={`h-4 w-4 ${refreshingBalances ? 'animate-spin' : ''}`} />
                </button>
              </div>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { token: 'ETH', balance: balances.eth, color: 'from-blue-500 to-cyan-500', symbol: 'Ξ' },
                  { token: 'CoinA', balance: balances.coinA, color: 'from-emerald-500 to-teal-500', symbol: 'A' },
                  { token: 'CoinB', balance: balances.coinB, color: 'from-amber-500 to-orange-500', symbol: 'B' }
                ].map((item, index) => (
                  <div key={index} className="text-center p-3 bg-slate-800/30 rounded-xl border border-slate-700/30">
                    <div className={`w-8 h-8 rounded-lg bg-gradient-to-r ${item.color} mx-auto mb-2 flex items-center justify-center text-white text-sm font-bold`}>
                      {item.symbol}
                    </div>
                    <p className="text-xs text-slate-400 mb-1">{item.token}</p>
                    <p className="font-bold text-white text-sm">
                      {parseFloat(item.balance).toFixed(4)}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </>
        );
      case 'liquidity':
        return <LiquidityInterface />;
      case 'buy':
        return <BuyCryptoInterface />;
      case 'analytics':
        return <AnalyticsInterface />;
      default:
        return null;
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-950">
      {/* Main Content */}
      <div className="flex-1 lg:ml-0">
        <Navbar />
        <TradeNavbar topOffset="top-16" />

        {/* Content Area */}
        <div className="pt-20 px-4 lg:px-6 pb-8">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">

              {/* Left Side - Chart and Market Info */}
              <div className="xl:col-span-8 space-y-6">
                {/* Market Header */}
                <div className="bg-slate-900/50 backdrop-blur-xl rounded-2xl border border-slate-700/50 p-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center space-x-4">
                      <div className="h-12 w-12 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-500 flex items-center justify-center">
                        <Zap className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <h1 className="text-2xl font-bold text-white">
                          {activeTab === 'swap' ? `${swapForm.fromToken}/${swapForm.toToken}` : 'ChainVerse DEX'}
                        </h1>
                        <p className="text-slate-400 text-sm">Advanced Trading Platform</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <p className="text-2xl font-bold text-white">
                          {swapForm.fromToken === 'ETH' && swapForm.toToken === 'CoinA' && tokenPrices.ethCoinA !== '0'
                            ? `1 ETH = ${parseFloat(tokenPrices.ethCoinA).toFixed(4)} CoinA`
                            : swapForm.fromToken === 'ETH' && swapForm.toToken === 'CoinB' && tokenPrices.ethCoinB !== '0'
                              ? `1 ETH = ${parseFloat(tokenPrices.ethCoinB).toFixed(4)} CoinB`
                              : swapForm.fromToken === 'CoinA' && swapForm.toToken === 'ETH' && tokenPrices.ethCoinA !== '0'
                                ? `1 CoinA = ${(1 / parseFloat(tokenPrices.ethCoinA)).toFixed(6)} ETH`
                                : swapForm.fromToken === 'CoinB' && swapForm.toToken === 'ETH' && tokenPrices.ethCoinB !== '0'
                                  ? `1 CoinB = ${(1 / parseFloat(tokenPrices.ethCoinB)).toFixed(6)} ETH`
                                  : swapForm.fromToken === 'CoinA' && swapForm.toToken === 'CoinB' && tokenPrices.coinACoinB !== '0'
                                    ? `1 CoinA = ${parseFloat(tokenPrices.coinACoinB).toFixed(4)} CoinB`
                                    : swapForm.fromToken === 'CoinB' && swapForm.toToken === 'CoinA' && tokenPrices.coinACoinB !== '0'
                                      ? `1 CoinB = ${(1 / parseFloat(tokenPrices.coinACoinB)).toFixed(4)} CoinA`
                                      : 'Loading...'}
                        </p>
                        <p className="text-sm text-emerald-400 flex items-center justify-end">
                          <TrendingUp className="h-4 w-4 mr-1" />
                          Live Price
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Trading Chart - Only show for swap and analytics */}
                {(activeTab === 'swap' || activeTab === 'analytics') && (
                  <div className="bg-slate-900/50 backdrop-blur-xl rounded-2xl border border-slate-700/50 p-6 h-96">
                    <TradingChart
                      fromToken={swapForm.fromToken}
                      toToken={swapForm.toToken}
                    />
                  </div>
                )}

                {/* Market Stats - Desktop Only for swap */}
                {activeTab === 'swap' && (
                  <div className="hidden lg:block bg-slate-900/50 backdrop-blur-xl rounded-2xl border border-slate-700/50 p-6">
                    <h3 className="text-lg font-bold text-white mb-4 flex items-center">
                      <Info className="h-5 w-5 mr-2 text-blue-400" />
                      Market Statistics
                    </h3>
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                      {[
                        { label: '24h Volume', value: '$4.7M', color: 'text-blue-400' },
                        { label: 'Total Liquidity', value: '$28.9M', color: 'text-emerald-400' },
                        { label: 'Active Traders', value: '3,847', color: 'text-cyan-400' },
                        { label: 'Avg. Gas Fee', value: '0.008 ETH', color: 'text-amber-400' }
                      ].map((stat, index) => (
                        <div key={index} className="bg-slate-800/30 rounded-xl p-4 text-center border border-slate-700/30">
                          <p className="text-slate-400 text-sm mb-1">{stat.label}</p>
                          <p className={`font-bold text-lg ${stat.color}`}>{stat.value}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Right Side - Interface */}
              <div className="xl:col-span-4 space-y-6">
                {/* Pill Navigation */}
                <PillNavigation activeTab={activeTab} onTabChange={setActiveTab} />

                {/* Tab Content */}
                {renderTabContent()}
              </div>
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