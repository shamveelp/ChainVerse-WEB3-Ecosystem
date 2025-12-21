'use client';

import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { useActiveAccount } from 'thirdweb/react';
import { Plus, AlertCircle, RefreshCw, Wallet, Droplets } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { CONTRACTS, ERC20_ABI, DEX_ABI } from '@/lib/dex/contracts';
import { loadBalances, getExplorerUrl } from '@/lib/dex/utils';
import { TokenBalance, LiquidityForm } from '@/types/types-dex';
import TradeNavbar from '@/components/shared/TradeNavbar';
import Navbar from '@/components/home/navbar';
import PillNavigation from '@/components/dex/PillNavigation';

export default function LiquidityPage() {
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
    } catch (error: unknown) {
      console.error('Add liquidity failed:', error);
      let errorMessage = 'Unknown error';
      if (error && typeof error === 'object' && 'reason' in error) {
        errorMessage = (error as { reason: string }).reason;
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }

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
    <div className="flex min-h-screen bg-slate-950">
      <div className="flex-1 lg:ml-0">
        <Navbar />
        <TradeNavbar topOffset="top-16" />

        <div className="pt-32 px-4 lg:px-6 pb-20">
          <div className="max-w-lg mx-auto">

            <PillNavigation />

            {/* Liquidity Interface */}
            <div className="bg-slate-900/50 backdrop-blur-xl rounded-[24px] border border-slate-700/50 p-4 shadow-2xl shadow-indigo-500/10">
              {/* Header */}
              <div className="flex items-center justify-between mb-4 px-2">
                <h2 className="text-xl font-bold text-white flex items-center">
                  Liquidity
                </h2>
                <button
                  onClick={loadUserBalances}
                  disabled={refreshingBalances}
                  className="p-2 text-slate-400 hover:text-white transition-all duration-300 hover:bg-slate-800/50 rounded-xl"
                >
                  <RefreshCw className={`h-5 w-5 ${refreshingBalances ? 'animate-spin' : ''}`} />
                </button>
              </div>

              {error && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex items-start space-x-3 mb-6">
                  <AlertCircle className="h-5 w-5 text-red-400 flex-shrink-0 mt-0.5" />
                  <p className="text-red-300 text-sm">{error}</p>
                </div>
              )}

              <div className="space-y-4">
                {/* Pool Type Selection */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-400 px-2">Pool Type</label>
                  <div className="relative">
                    <select
                      className="w-full bg-slate-800/40 border border-slate-800/60 rounded-2xl px-4 py-4 text-white hover:border-slate-700 focus:ring-2 focus:ring-blue-500/50 focus:border-transparent outline-none appearance-none cursor-pointer text-lg font-medium transition-colors"
                      value={liquidityForm.poolType}
                      onChange={(e) => setLiquidityForm(prev => ({ ...prev, poolType: e.target.value }))}
                    >
                      <option value="eth-coinA" className="bg-slate-900">ETH / CoinA</option>
                      <option value="eth-coinB" className="bg-slate-900">ETH / CoinB</option>
                      <option value="token-token" className="bg-slate-900">CoinA / CoinB</option>
                    </select>
                  </div>
                </div>

                {liquidityForm.poolType === 'token-token' ? (
                  <>
                    <LiquidityInput
                      label="CoinA Amount"
                      value={liquidityForm.coinAAmount}
                      onChange={(val) => setLiquidityForm(prev => ({ ...prev, coinAAmount: val }))}
                      balance={balances.coinA}
                      symbol="CoinA"
                    />
                    <LiquidityInput
                      label="CoinB Amount"
                      value={liquidityForm.coinBAmount}
                      onChange={(val) => setLiquidityForm(prev => ({ ...prev, coinBAmount: val }))}
                      balance={balances.coinB}
                      symbol="CoinB"
                      showAddIcon
                    />
                  </>
                ) : (
                  <>
                    <LiquidityInput
                      label="ETH Amount"
                      value={liquidityForm.ethAmount}
                      onChange={(val) => setLiquidityForm(prev => ({ ...prev, ethAmount: val }))}
                      balance={balances.eth}
                      symbol="ETH"
                    />
                    <LiquidityInput
                      label={`${liquidityForm.poolType === 'eth-coinA' ? 'CoinA' : 'CoinB'} Amount`}
                      value={liquidityForm.tokenAmount}
                      onChange={(val) => setLiquidityForm(prev => ({ ...prev, tokenAmount: val }))}
                      balance={liquidityForm.poolType === 'eth-coinA' ? balances.coinA : balances.coinB}
                      symbol={liquidityForm.poolType === 'eth-coinA' ? 'CoinA' : 'CoinB'}
                      showAddIcon
                    />
                  </>
                )}

                <div className="pt-2">
                  <button
                    onClick={addLiquidity}
                    disabled={loading || !account || (liquidityForm.poolType === 'token-token' ? (!liquidityForm.coinAAmount || !liquidityForm.coinBAmount) : (!liquidityForm.ethAmount || !liquidityForm.tokenAmount))}
                    className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:from-slate-800 disabled:to-slate-800 disabled:text-slate-500 text-white py-4 rounded-2xl font-bold text-lg transition-all duration-300 disabled:cursor-not-allowed flex items-center justify-center space-x-2 shadow-lg shadow-indigo-500/20 disabled:shadow-none"
                  >
                    {loading ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-2 border-white/30 border-t-white"></div>
                        <span>Adding Liquidity...</span>
                      </>
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

            {/* Balances Summary */}
            <div className="mt-8 flex justify-center gap-4 text-xs text-slate-500">
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
    </div>
  );
}

// Helper Component for inputs
function LiquidityInput({ label, value, onChange, balance, symbol, showAddIcon = false }: { label: string, value: string, onChange: (val: string) => void, balance: string, symbol: string, showAddIcon?: boolean }) {
  return (
    <div className="relative">
      {showAddIcon && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10 bg-slate-900 border-[3px] border-slate-950 rounded-xl p-1 text-slate-400">
          <Plus className="h-4 w-4" />
        </div>
      )}
      <div className="bg-slate-800/40 rounded-2xl p-4 border border-slate-800/60 hover:border-slate-700 transition-colors">
        <div className="flex justify-between mb-2">
          <span className="text-slate-400 text-sm font-medium">{label}</span>
          <span className="text-xs text-slate-500">
            Balance: {parseFloat(balance).toFixed(4)}
          </span>
        </div>
        <div className="flex items-center space-x-3">
          <input
            type="number"
            placeholder="0.0"
            className="flex-1 bg-transparent text-3xl text-white outline-none placeholder-slate-500 font-medium [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none min-w-0"
            value={value}
            onChange={(e) => onChange(e.target.value)}
          />
          <div className="bg-slate-700/80 border border-slate-600/50 rounded-full px-4 py-2 text-white text-lg font-semibold cursor-default">
            {symbol}
          </div>
        </div>
      </div>
    </div>
  );
}