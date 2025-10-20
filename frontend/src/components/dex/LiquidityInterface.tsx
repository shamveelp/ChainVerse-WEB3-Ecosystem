'use client';

import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { useActiveAccount } from 'thirdweb/react';
import { Plus, Info, Droplets, TrendingUp, Zap, AlertCircle, RefreshCw, Wallet } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { CONTRACTS, ERC20_ABI, DEX_ABI } from '@/lib/dex/contracts';
import { loadBalances, getExplorerUrl } from '@/lib/dex/utils';
import { TokenBalance, LiquidityForm } from '@/types/types-dex';

export default function LiquidityInterface() {
  const account = useActiveAccount();
  const [balances, setBalances] = useState<TokenBalance>({
    eth: '0',
    coinA: '0',
    coinB: '0'
  });
  const [loading, setLoading] = useState(false);
  const [refreshingBalances, setRefreshingBalances] = useState(false);
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
        title: "Liquidity Added Successfully! 🎉",
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

  const setMaxAmount = (isEth: boolean) => {
    if (isEth) {
      const balance = balances.eth;
      const maxAmount = Math.max(0, parseFloat(balance) - 0.01);
      setLiquidityForm(prev => ({ ...prev, ethAmount: maxAmount.toString() }));
    } else {
      const balance = liquidityForm.poolType === 'eth-coinA' ? balances.coinA : balances.coinB;
      setLiquidityForm(prev => ({ ...prev, tokenAmount: balance }));
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
    <div className="space-y-6">
      {/* Add Liquidity Form */}
      <div className="bg-slate-900/50 backdrop-blur-xl rounded-2xl border border-slate-700/50 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white flex items-center">
            <Droplets className="h-5 w-5 mr-2 text-blue-400" />
            Add Liquidity
          </h2>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex items-start space-x-3 mb-6">
            <AlertCircle className="h-5 w-5 text-red-400 flex-shrink-0 mt-0.5" />
            <p className="text-red-300 text-sm">{error}</p>
          </div>
        )}

        <div className="space-y-4">
          {/* Pool Type Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-300">Pool Type</label>
            <select
              className="w-full bg-slate-800/30 border border-slate-700/50 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-blue-500/50 focus:border-transparent outline-none"
              value={liquidityForm.poolType}
              onChange={(e) => setLiquidityForm(prev => ({ ...prev, poolType: e.target.value }))}
            >
              <option value="eth-coinA" className="bg-slate-800">ETH / CoinA</option>
              <option value="eth-coinB" className="bg-slate-800">ETH / CoinB</option>
              <option value="token-token" className="bg-slate-800">CoinA / CoinB</option>
            </select>
          </div>

          {liquidityForm.poolType === 'token-token' ? (
            <>
              {/* CoinA Amount */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-slate-300">CoinA Amount</label>
                  <button
                    onClick={() => setLiquidityForm(prev => ({ ...prev, coinAAmount: balances.coinA }))}
                    className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
                  >
                    Balance: {parseFloat(balances.coinA).toFixed(4)} • MAX
                  </button>
                </div>
                <div className="bg-slate-800/30 rounded-xl p-4 border border-slate-700/50">
                  <input
                    type="number"
                    placeholder="0.0"
                    className="w-full bg-transparent text-xl text-white outline-none placeholder-slate-400 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    value={liquidityForm.coinAAmount}
                    onChange={(e) => setLiquidityForm(prev => ({ ...prev, coinAAmount: e.target.value }))}
                  />
                </div>
              </div>

              {/* Plus Icon */}
              <div className="flex justify-center">
                <div className="p-3 bg-slate-800/50 border border-slate-600/50 rounded-xl">
                  <Plus className="h-5 w-5 text-slate-400" />
                </div>
              </div>

              {/* CoinB Amount */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-slate-300">CoinB Amount</label>
                  <button
                    onClick={() => setLiquidityForm(prev => ({ ...prev, coinBAmount: balances.coinB }))}
                    className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
                  >
                    Balance: {parseFloat(balances.coinB).toFixed(4)} • MAX
                  </button>
                </div>
                <div className="bg-slate-800/30 rounded-xl p-4 border border-slate-700/50">
                  <input
                    type="number"
                    placeholder="0.0"
                    className="w-full bg-transparent text-xl text-white outline-none placeholder-slate-400 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    value={liquidityForm.coinBAmount}
                    onChange={(e) => setLiquidityForm(prev => ({ ...prev, coinBAmount: e.target.value }))}
                  />
                </div>
              </div>
            </>
          ) : (
            <>
              {/* ETH Amount */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-slate-300">ETH Amount</label>
                  <button
                    onClick={() => setMaxAmount(true)}
                    className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
                  >
                    Balance: {parseFloat(balances.eth).toFixed(4)} • MAX
                  </button>
                </div>
                <div className="bg-slate-800/30 rounded-xl p-4 border border-slate-700/50">
                  <input
                    type="number"
                    placeholder="0.0"
                    className="w-full bg-transparent text-xl text-white outline-none placeholder-slate-400 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    value={liquidityForm.ethAmount}
                    onChange={(e) => setLiquidityForm(prev => ({ ...prev, ethAmount: e.target.value }))}
                  />
                </div>
              </div>

              {/* Plus Icon */}
              <div className="flex justify-center">
                <div className="p-3 bg-slate-800/50 border border-slate-600/50 rounded-xl">
                  <Plus className="h-5 w-5 text-slate-400" />
                </div>
              </div>

              {/* Token Amount */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-slate-300">
                    {liquidityForm.poolType === 'eth-coinA' ? 'CoinA' : 'CoinB'} Amount
                  </label>
                  <button
                    onClick={() => setMaxAmount(false)}
                    className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
                  >
                    Balance: {parseFloat(liquidityForm.poolType === 'eth-coinA' ? balances.coinA : balances.coinB).toFixed(4)} • MAX
                  </button>
                </div>
                <div className="bg-slate-800/30 rounded-xl p-4 border border-slate-700/50">
                  <input
                    type="number"
                    placeholder="0.0"
                    className="w-full bg-transparent text-xl text-white outline-none placeholder-slate-400 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    value={liquidityForm.tokenAmount}
                    onChange={(e) => setLiquidityForm(prev => ({ ...prev, tokenAmount: e.target.value }))}
                  />
                </div>
              </div>
            </>
          )}

          {/* Pool Information */}
          <div className="bg-slate-800/20 rounded-xl p-4 space-y-3 border border-slate-700/30">
            <div className="flex items-center space-x-2 mb-2">
              <Info className="h-4 w-4 text-blue-400" />
              <h4 className="font-semibold text-white">Pool Information</h4>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex justify-between text-slate-400">
                <span>Pool Share:</span>
                <span className="text-white">0%</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>LP Tokens:</span>
                <span className="text-white">0</span>
              </div>
            </div>
          </div>

          {/* Add Liquidity Button */}
          <button
            onClick={addLiquidity}
            disabled={
              loading ||
              !account ||
              (liquidityForm.poolType === 'token-token' 
                ? (!liquidityForm.coinAAmount || !liquidityForm.coinBAmount)
                : (!liquidityForm.ethAmount || !liquidityForm.tokenAmount)
              )
            }
            className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 disabled:from-slate-700 disabled:to-slate-700 text-white py-4 rounded-xl font-bold transition-all duration-300 disabled:cursor-not-allowed flex items-center justify-center space-x-2 transform hover:scale-[1.02] disabled:hover:scale-100"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-white"></div>
                <span>Adding Liquidity...</span>
              </>
            ) : (
              <>
                <Droplets className="h-5 w-5" />
                <span>
                  {!account ? 'Connect Wallet' : 'Add Liquidity'}
                </span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Portfolio Section */}
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
    </div>
  );
}