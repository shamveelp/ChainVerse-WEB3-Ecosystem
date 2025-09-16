'use client';

import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { useActiveAccount } from 'thirdweb/react';
import { Plus, AlertCircle } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { CONTRACTS, ERC20_ABI, DEX_ABI } from '@/lib/dex/contracts';
import { loadBalances, getExplorerUrl } from '@/lib/dex/utils';
import { TokenBalance, LiquidityForm } from '@/types/types-dex';
import TradeNavbar from '@/components/shared/TradeNavbar';
import Navbar from '@/components/home/navbar';

export default function LiquidityPage() {
  const account = useActiveAccount();
  const [balances, setBalances] = useState<TokenBalance>({
    eth: '0',
    coinA: '0',
    coinB: '0'
  });
  const [loading, setLoading] = useState(false);
  const [liquidityForm, setLiquidityForm] = useState<LiquidityForm>({
    poolType: 'eth-coinA',
    ethAmount: '',
    tokenAmount: '',
    coinAAmount: '',
    coinBAmount: ''
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

  const addLiquidity = async () => {
    if (!account?.address || !window.ethereum) return;
    
    setLoading(true);
    setError('');
    
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const dexContract = new ethers.Contract(CONTRACTS.dex, DEX_ABI, signer);
      
      let tx;
      
      if (liquidityForm.poolType === 'token-token') {
        if (!liquidityForm.coinAAmount || !liquidityForm.coinBAmount) return;
        
        const coinAAmount = ethers.parseUnits(liquidityForm.coinAAmount, 18);
        const coinBAmount = ethers.parseUnits(liquidityForm.coinBAmount, 18);
        
        const coinAContract = new ethers.Contract(CONTRACTS.coinA, ERC20_ABI, signer);
        const coinBContract = new ethers.Contract(CONTRACTS.coinB, ERC20_ABI, signer);
        
        const coinAAllowance = await coinAContract.allowance(account.address, CONTRACTS.dex);
        const coinBAllowance = await coinBContract.allowance(account.address, CONTRACTS.dex);
        
        if (coinAAllowance < coinAAmount) {
          const approveTx = await coinAContract.approve(CONTRACTS.dex, coinAAmount);
          await approveTx.wait();
        }
        
        if (coinBAllowance < coinBAmount) {
          const approveTx = await coinBContract.approve(CONTRACTS.dex, coinBAmount);
          await approveTx.wait();
        }
        
        tx = await dexContract.addTokenLiquidity(coinAAmount, coinBAmount, {
          gasLimit: 400000
        });
      } else {
        if (!liquidityForm.ethAmount || !liquidityForm.tokenAmount) return;
        
        const ethAmount = ethers.parseEther(liquidityForm.ethAmount);
        const tokenAmount = ethers.parseUnits(liquidityForm.tokenAmount, 18);
        const tokenAddress = liquidityForm.poolType === 'eth-coinA' ? CONTRACTS.coinA : CONTRACTS.coinB;
        
        const tokenContract = new ethers.Contract(tokenAddress, ERC20_ABI, signer);
        const allowance = await tokenContract.allowance(account.address, CONTRACTS.dex);
        
        if (allowance < tokenAmount) {
          const approveTx = await tokenContract.approve(CONTRACTS.dex, tokenAmount);
          await approveTx.wait();
        }
        
        tx = await dexContract.addLiquidity(tokenAddress, tokenAmount, { 
          value: ethAmount,
          gasLimit: 400000
        });
      }
      
      await tx.wait();
      
      const poolName = liquidityForm.poolType === 'eth-coinA' ? 'ETH/CoinA' : 
                       liquidityForm.poolType === 'eth-coinB' ? 'ETH/CoinB' : 'CoinA/CoinB';
      
      toast({
        variant: "default",
        title: "Liquidity Added Successfully!",
        description: (
          <div className="space-y-2">
            <p>Successfully added liquidity to {poolName} pool</p>
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
      setLiquidityForm({
        poolType: 'eth-coinA',
        ethAmount: '',
        tokenAmount: '',
        coinAAmount: '',
        coinBAmount: ''
      });
    } catch (error: any) {
      console.error('Add liquidity failed:', error);
      const errorMessage = error.reason || error.message || 'Unknown error';
      setError(`Add liquidity failed: ${errorMessage}`);
      toast({
        variant: "destructive",
        title: "Add Liquidity Failed",
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

          {/* Liquidity Interface */}
          <div className="md:w-2/3 bg-gray-900/80 backdrop-blur-lg rounded-2xl p-6 border border-gray-800">
            {error && (
              <div className="bg-red-900/50 border border-red-700 rounded-xl p-4 flex items-start space-x-3 mb-6">
                <AlertCircle className="h-5 w-5 text-red-400 flex-shrink-0 mt-0.5" />
                <p className="text-red-300 text-sm">{error}</p>
              </div>
            )}

            <div className="text-center mb-6">
              <h1 className="text-3xl font-bold bg-gradient-to-r from-green-400 to-blue-500 bg-clip-text text-transparent">
                Add Liquidity
              </h1>
              <p className="text-gray-400 text-sm mt-2">Provide liquidity to earn trading fees</p>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-300">Pool Type</label>
                <select
                  className="w-full bg-gray-800/50 border border-gray-700 rounded-lg px-3 py-3 text-gray-100 focus:ring-2 focus:ring-cyan-500 focus:border-transparent outline-none"
                  value={liquidityForm.poolType}
                  onChange={(e) => setLiquidityForm(prev => ({ ...prev, poolType: e.target.value }))}
                >
                  <option value="eth-coinA" className="bg-gray-900">ETH / CoinA</option>
                  <option value="eth-coinB" className="bg-gray-900">ETH / CoinB</option>
                  <option value="token-token" className="bg-gray-900">CoinA / CoinB</option>
                </select>
              </div>

              {liquidityForm.poolType === 'token-token' ? (
                <>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-300">CoinA Amount</label>
                    <input
                      type="number"
                      placeholder="0.0"
                      className="w-full bg-gray-800/50 border border-gray-700 rounded-lg px-3 py-3 text-gray-100 focus:ring-2 focus:ring-cyan-500 focus:border-transparent outline-none"
                      value={liquidityForm.coinAAmount}
                      onChange={(e) => setLiquidityForm(prev => ({ ...prev, coinAAmount: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-300">CoinB Amount</label>
                    <input
                      type="number"
                      placeholder="0.0"
                      className="w-full bg-gray-800/50 border border-gray-700 rounded-lg px-3 py-3 text-gray-100 focus:ring-2 focus:ring-cyan-500 focus:border-transparent outline-none"
                      value={liquidityForm.coinBAmount}
                      onChange={(e) => setLiquidityForm(prev => ({ ...prev, coinBAmount: e.target.value }))}
                    />
                  </div>
                </>
              ) : (
                <>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-300">ETH Amount</label>
                    <input
                      type="number"
                      placeholder="0.0"
                      className="w-full bg-gray-800/50 border border-gray-700 rounded-lg px-3 py-3 text-gray-100 focus:ring-2 focus:ring-cyan-500 focus:border-transparent outline-none"
                      value={liquidityForm.ethAmount}
                      onChange={(e) => setLiquidityForm(prev => ({ ...prev, ethAmount: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-300">
                      {liquidityForm.poolType === 'eth-coinA' ? 'CoinA' : 'CoinB'} Amount
                    </label>
                    <input
                      type="number"
                      placeholder="0.0"
                      className="w-full bg-gray-800/50 border border-gray-700 rounded-lg px-3 py-3 text-gray-100 focus:ring-2 focus:ring-cyan-500 focus:border-transparent outline-none"
                      value={liquidityForm.tokenAmount}
                      onChange={(e) => setLiquidityForm(prev => ({ ...prev, tokenAmount: e.target.value }))}
                    />
                  </div>
                </>
              )}

              <button
                onClick={addLiquidity}
                disabled={loading || !account || (liquidityForm.poolType === 'token-token' ? (!liquidityForm.coinAAmount || !liquidityForm.coinBAmount) : (!liquidityForm.ethAmount || !liquidityForm.tokenAmount))}
                className="w-full bg-gradient-to-r from-green-500 to-blue-500 text-white py-4 rounded-xl font-semibold hover:from-green-600 hover:to-blue-600 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 transform hover:scale-105"
              >
                {loading ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-white"></div>
                ) : (
                  <>
                    <Plus className="h-5 w-5" />
                    <span>
                      {!account ? 'Connect Wallet' : 'Add Liquidity'}
                    </span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}