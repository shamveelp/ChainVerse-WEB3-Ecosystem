'use client';

import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { useActiveAccount } from 'thirdweb/react';
import { Plus, AlertCircle, RefreshCw, Wallet, Info } from 'lucide-react';
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
    <div className="flex min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-black text-white selection:bg-purple-500/30">
      {/* Background decoration */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl mix-blend-screen animate-pulse" />
        <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl mix-blend-screen animate-pulse delay-1000" />
      </div>

      <div className="flex-1 lg:ml-0 relative z-10">
        <Navbar />
        <TradeNavbar topOffset="top-[130px]" />

        <div className="pt-32 md:pt-32 px-4 pb-20 flex flex-col items-center min-h-screen">
          <div className="w-full max-w-lg mx-auto space-y-6">

            <PillNavigation />

            {/* Liquidity Card */}
            <div className="relative group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-500 to-indigo-600 rounded-[28px] opacity-30 group-hover:opacity-50 blur transition duration-1000"></div>
              <div className="relative bg-slate-950/80 backdrop-blur-xl rounded-[26px] border border-white/10 p-5 md:p-6 shadow-2xl">

                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
                    Add Liquidity
                  </h2>
                  <button
                    onClick={loadUserBalances}
                    disabled={refreshingBalances}
                    className="p-2 text-slate-400 hover:text-white transition-all duration-300 hover:bg-white/5 rounded-xl active:scale-95"
                  >
                    <RefreshCw className={`h-5 w-5 ${refreshingBalances ? 'animate-spin' : ''}`} />
                  </button>
                </div>

                {error && (
                  <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4 flex items-start space-x-3 mb-6 animate-in fade-in slide-in-from-top-2">
                    <AlertCircle className="h-5 w-5 text-red-400 flex-shrink-0 mt-0.5" />
                    <p className="text-red-300 text-sm">{error}</p>
                  </div>
                )}

                <div className="space-y-4">
                  {/* Pool Type Selection */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-400 ml-1">Select Pair</label>
                    <div className="relative">
                      <select
                        className="w-full bg-slate-900/50 border border-white/10 rounded-2xl px-4 py-3 text-white hover:border-white/20 focus:ring-2 focus:ring-purple-500/30 focus:border-transparent outline-none appearance-none cursor-pointer text-base font-semibold transition-all shadow-inner"
                        value={liquidityForm.poolType}
                        onChange={(e) => setLiquidityForm(prev => ({ ...prev, poolType: e.target.value }))}
                      >
                        <option value="eth-coinA" className="bg-slate-900">ETH / CoinA</option>
                        <option value="eth-coinB" className="bg-slate-900">ETH / CoinB</option>
                        <option value="token-token" className="bg-slate-900">CoinA / CoinB</option>
                      </select>
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                        <svg width="12" height="8" viewBox="0 0 12 8" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M1 1.5L6 6.5L11 1.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-400" />
                        </svg>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1">
                    {liquidityForm.poolType === 'token-token' ? (
                      <>
                        <LiquidityInput
                          label="CoinA Amount"
                          value={liquidityForm.coinAAmount}
                          onChange={(val) => setLiquidityForm(prev => ({ ...prev, coinAAmount: val }))}
                          balance={balances.coinA}
                          symbol="CoinA"
                        />

                        <div className="flex justify-center -my-3 relative z-10 w-full">
                          <div className="bg-slate-950 border-[4px] border-slate-950 rounded-full p-2">
                            <Plus className="h-4 w-4 text-slate-400" />
                          </div>
                        </div>

                        <LiquidityInput
                          label="CoinB Amount"
                          value={liquidityForm.coinBAmount}
                          onChange={(val) => setLiquidityForm(prev => ({ ...prev, coinBAmount: val }))}
                          balance={balances.coinB}
                          symbol="CoinB"
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

                        <div className="flex justify-center -my-3 relative z-10 w-full">
                          <div className="bg-slate-950 border-[4px] border-slate-950 rounded-full p-2">
                            <Plus className="h-4 w-4 text-slate-400" />
                          </div>
                        </div>

                        <LiquidityInput
                          label={`${liquidityForm.poolType === 'eth-coinA' ? 'CoinA' : 'CoinB'} Amount`}
                          value={liquidityForm.tokenAmount}
                          onChange={(val) => setLiquidityForm(prev => ({ ...prev, tokenAmount: val }))}
                          balance={liquidityForm.poolType === 'eth-coinA' ? balances.coinA : balances.coinB}
                          symbol={liquidityForm.poolType === 'eth-coinA' ? 'CoinA' : 'CoinB'}
                        />
                      </>
                    )}
                  </div>

                  {/* Info Box */}
                  <div className="bg-blue-500/5 rounded-2xl p-4 border border-blue-500/10 flex gap-3">
                    <Info className="h-5 w-5 text-blue-400 shrink-0" />
                    <p className="text-xs text-blue-200/80 leading-relaxed">
                      By adding liquidity, you'll earn 0.3% of all trades on this pair proportional to your share of the pool.
                    </p>
                  </div>

                  <div className="pt-2">
                    <button
                      onClick={addLiquidity}
                      disabled={loading || !account || (liquidityForm.poolType === 'token-token' ? (!liquidityForm.coinAAmount || !liquidityForm.coinBAmount) : (!liquidityForm.ethAmount || !liquidityForm.tokenAmount))}
                      className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white py-4 rounded-2xl font-bold text-lg transition-all duration-300 transform active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none shadow-lg shadow-purple-500/20 hover:shadow-purple-500/40"
                    >
                      {loading ? (
                        <div className="flex items-center justify-center gap-2">
                          <div className="animate-spin rounded-full h-5 w-5 border-2 border-white/30 border-t-white"></div>
                          <span>Adding Liquidity...</span>
                        </div>
                      ) : (
                        <span>
                          {!account ? 'Connect Wallet' : 'Add Liquidity'}
                        </span>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Balances Summary */}
            <div className="flex justify-center gap-3 md:gap-6 flex-wrap">
              <div className="flex items-center gap-2 bg-slate-900/40 px-3 py-1.5 rounded-full border border-white/5">
                <Wallet className="h-3 w-3 text-slate-400" />
                <span className="text-xs text-slate-300">ETH: <span className="text-white font-medium">{parseFloat(balances.eth).toFixed(4)}</span></span>
              </div>
              <div className="flex items-center gap-2 bg-slate-900/40 px-3 py-1.5 rounded-full border border-white/5">
                <span className="w-2 h-2 rounded-full bg-cyan-500"></span>
                <span className="text-xs text-slate-300">CoinA: <span className="text-white font-medium">{parseFloat(balances.coinA).toFixed(2)}</span></span>
              </div>
              <div className="flex items-center gap-2 bg-slate-900/40 px-3 py-1.5 rounded-full border border-white/5">
                <span className="w-2 h-2 rounded-full bg-purple-500"></span>
                <span className="text-xs text-slate-300">CoinB: <span className="text-white font-medium">{parseFloat(balances.coinB).toFixed(2)}</span></span>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}

// Helper Component for inputs
function LiquidityInput({ label, value, onChange, balance, symbol }: { label: string, value: string, onChange: (val: string) => void, balance: string, symbol: string }) {
  return (
    <div className="bg-slate-900/50 rounded-2xl p-4 border border-white/5 hover:border-white/10 transition-colors focus-within:border-purple-500/30 group">
      <div className="flex justify-between mb-2">
        <span className="text-slate-400 text-xs font-semibold uppercase tracking-wider">{label}</span>
        <span className="text-xs text-slate-400 font-medium">
          Balance: {parseFloat(balance).toFixed(4)}
        </span>
      </div>
      <div className="flex items-center gap-2 sm:gap-3">
        <input
          type="number"
          placeholder="0.0"
          className="flex-1 w-0 bg-transparent text-xl sm:text-2xl md:text-3xl font-bold text-white outline-none placeholder-slate-700 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none min-w-0"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
        <div className="shrink-0 bg-slate-800 border border-slate-700/50 rounded-full px-3 py-1.5 sm:px-4 sm:py-2 text-white font-semibold shadow-sm text-sm sm:text-base">
          {symbol}
        </div>
      </div>
    </div>
  );
}