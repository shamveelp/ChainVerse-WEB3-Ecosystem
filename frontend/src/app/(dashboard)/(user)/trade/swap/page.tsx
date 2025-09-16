'use client';

import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { useActiveAccount } from 'thirdweb/react';
import { ArrowUpDown, AlertCircle } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { CONTRACTS, ERC20_ABI, DEX_ABI } from '@/lib/dex/contracts';
import { loadBalances, calculateSwapOutput, getExplorerUrl } from '@/lib/dex/utils';
import { TokenBalance, SwapForm } from '@/types/types-dex';
import TradeNavbar from '@/components/shared/TradeNavbar';
import Navbar from '@/components/home/navbar';

export default function SwapPage() {
  const account = useActiveAccount();
  const [balances, setBalances] = useState<TokenBalance>({
    eth: '0',
    coinA: '0',
    coinB: '0'
  });
  const [loading, setLoading] = useState(false);
  const [swapForm, setSwapForm] = useState<SwapForm>({
    fromToken: 'ETH',
    toToken: 'CoinA',
    fromAmount: '',
    toAmount: '',
    slippage: '1'
  });
  const [error, setError] = useState('');

  const loadUserBalances = async () => {
    if (!account?.address || !window.ethereum) return;
    
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const { balances: newBalances } = await loadBalances(provider, account.address);
      setBalances(newBalances);
    } catch (error) {
      console.error('Failed to load balances:', error);
      setError('Failed to load balances');
    }
  };

  const calculateOutput = async () => {
    if (!account?.address || !window.ethereum) return;
    
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const output = await calculateSwapOutput(
        provider,
        swapForm.fromToken,
        swapForm.toToken,
        swapForm.fromAmount
      );
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
      const minAmountOut = ethers.parseUnits(swapForm.toAmount, 18) * BigInt(100 - parseInt(swapForm.slippage)) / BigInt(100);
      
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
      
      await tx.wait();
      
      toast({
        variant: "default",
        title: "Swap Successful!",
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
      toast({
        variant: "destructive",
        title: "Swap Failed",
        description: errorMessage,
      });
    } finally {
      setLoading(false);
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
    <>
      <Navbar />
      <TradeNavbar topOffset="top-16" />
      <div className="min-h-screen bg-gradient-to-br from-gray-950 via-blue-950 to-gray-950 pt-20 px-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row gap-6">
          {/* Balance Display */}
          <div className="md:w-1/3 bg-gray-900/80 backdrop-blur-lg rounded-2xl p-6 border border-gray-800">
            <h3 className="text-lg font-semibold text-gray-100 mb-4">Your Balances</h3>
            <div className="space-y-4">
              <div>
                <span className="text-gray-400 text-sm">ETH</span>
                <p className="font-semibold text-white">{parseFloat(balances.eth).toFixed(4)}</p>
              </div>
              <div>
                <span className="text-gray-400 text-sm">CoinA</span>
                <p className="font-semibold text-white">{parseFloat(balances.coinA).toFixed(2)}</p>
              </div>
              <div>
                <span className="text-gray-400 text-sm">CoinB</span>
                <p className="font-semibold text-white">{parseFloat(balances.coinB).toFixed(2)}</p>
              </div>
            </div>
          </div>

          {/* Swap Interface */}
          <div className="md:w-2/3 bg-gray-900/80 backdrop-blur-lg rounded-2xl p-6 border border-gray-800">
            {error && (
              <div className="bg-red-900/50 border border-red-700 rounded-xl p-4 flex items-start space-x-3 mb-6">
                <AlertCircle className="h-5 w-5 text-red-400 flex-shrink-0 mt-0.5" />
                <p className="text-red-300 text-sm">{error}</p>
              </div>
            )}

            <div className="text-center mb-6">
              <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
                Swap Tokens
              </h1>
              <p className="text-gray-400 text-sm mt-2">Exchange tokens instantly with best rates</p>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-300">From</label>
                <div className="flex items-center space-x-2 bg-gray-800/50 rounded-xl p-3 border border-gray-700">
                  <select
                    className="w-28 bg-transparent border border-gray-700 rounded-lg px-3 py-2 text-gray-100 focus:ring-2 focus:ring-cyan-500 focus:border-transparent outline-none"
                    value={swapForm.fromToken}
                    onChange={(e) => setSwapForm(prev => ({ ...prev, fromToken: e.target.value }))}
                  >
                    <option value="ETH" className="bg-gray-900">ETH</option>
                    <option value="CoinA" className="bg-gray-900">CoinA</option>
                    <option value="CoinB" className="bg-gray-900">CoinB</option>
                  </select>
                  <input
                    type="number"
                    placeholder="0.0"
                    className="flex-1 bg-transparent text-lg text-gray-100 outline-none"
                    value={swapForm.fromAmount}
                    onChange={(e) => setSwapForm(prev => ({ ...prev, fromAmount: e.target.value }))}
                  />
                </div>
              </div>

              <div className="flex justify-center">
                <button
                  onClick={() => setSwapForm(prev => ({ 
                    ...prev, 
                    fromToken: prev.toToken, 
                    toToken: prev.fromToken,
                    fromAmount: prev.toAmount,
                    toAmount: prev.fromAmount
                  }))}
                  className="p-3 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full hover:from-cyan-600 hover:to-blue-600 transition-all duration-300 transform hover:scale-110"
                >
                  <ArrowUpDown className="h-5 w-5 text-white" />
                </button>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-300">To</label>
                <div className="flex items-center space-x-2 bg-gray-800/50 rounded-xl p-3 border border-gray-700">
                  <select
                    className="w-28 bg-transparent border border-gray-700 rounded-lg px-3 py-2 text-gray-100 focus:ring-2 focus:ring-cyan-500 focus:border-transparent outline-none"
                    value={swapForm.toToken}
                    onChange={(e) => setSwapForm(prev => ({ ...prev, toToken: e.target.value }))}
                  >
                    <option value="ETH" className="bg-gray-900">ETH</option>
                    <option value="CoinA" className="bg-gray-900">CoinA</option>
                    <option value="CoinB" className="bg-gray-900">CoinB</option>
                  </select>
                  <input
                    type="number"
                    placeholder="0.0"
                    className="flex-1 bg-transparent text-lg text-gray-100 outline-none"
                    value={swapForm.toAmount}
                    readOnly
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-300">Slippage Tolerance (%)</label>
                <input
                  type="number"
                  className="w-full bg-gray-800/50 border border-gray-700 rounded-lg px-3 py-2 text-gray-100 focus:ring-2 focus:ring-cyan-500 focus:border-transparent outline-none"
                  value={swapForm.slippage}
                  onChange={(e) => setSwapForm(prev => ({ ...prev, slippage: e.target.value }))}
                  min="0.1"
                  max="50"
                  step="0.1"
                />
              </div>

              <button
                onClick={executeSwap}
                disabled={loading || !swapForm.fromAmount || !swapForm.toAmount || swapForm.fromToken === swapForm.toToken || !account}
                className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 text-white py-4 rounded-xl font-semibold hover:from-cyan-600 hover:to-blue-600 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 transform hover:scale-105"
              >
                {loading ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-white"></div>
                ) : (
                  <span>
                    {!account ? 'Connect Wallet' : 'Swap'}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}