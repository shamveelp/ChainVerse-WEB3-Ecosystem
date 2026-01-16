'use client';

import { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import { useActiveAccount } from 'thirdweb/react';
import { Plus, AlertCircle, RefreshCw, Coins, Activity } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { CONTRACTS, ERC20_ABI, DEX_ABI } from '@/lib/dex/contracts';
import { loadBalances, getExplorerUrl } from '@/lib/dex/utils';
import { TokenBalance, LiquidityForm, PoolData } from '@/types/types-dex';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import FloatingWalletButton from '@/components/shared/TradeNavbar';

export default function AdminDexManagementPage() {
  const account = useActiveAccount();
  const [balances, setBalances] = useState<TokenBalance>({
    eth: '0',
    coinA: '0',
    coinB: '0',
  });
  const [poolsData, setPoolsData] = useState<{ [key: string]: PoolData }>({});
  const [loading, setLoading] = useState(false);
  const [liquidityForm, setLiquidityForm] = useState<LiquidityForm>({
    poolType: 'eth-coinA',
    ethAmount: '',
    tokenAmount: '',
    coinAAmount: '',
    coinBAmount: '',
  });
  const [error, setError] = useState('');

  const loadUserBalances = useCallback(async () => {
    if (!account?.address || !window.ethereum) return;

    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const { balances: newBalances, poolsData: newPoolsData } = await loadBalances(provider, account.address);
      setBalances(newBalances);
      setPoolsData(newPoolsData);
    } catch (error) {
      console.error('Failed to load balances:', error);
      setError('Failed to load balances');
    }
  }, [account?.address]);

  const getTestTokens = async () => {
    if (!account?.address || !window.ethereum) return;

    setLoading(true);
    setError('');

    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const coinAContract = new ethers.Contract(CONTRACTS.coinA, ERC20_ABI, signer);
      const coinBContract = new ethers.Contract(CONTRACTS.coinB, ERC20_ABI, signer);

      const amount = ethers.parseUnits('1000', 18);

      const txA = await coinAContract.mint(account.address, amount);
      await txA.wait();

      const txB = await coinBContract.mint(account.address, amount);
      await txB.wait();

      toast({
        variant: 'default',
        title: 'Test Tokens Claimed Successfully!',
        description: (
          <div className="space-y-2">
            <p>Received 1000 CoinA and 1000 CoinB tokens</p>
            <a
              href={getExplorerUrl(txB.hash)}
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
    } catch (error) {
      const err = error as Error;
      console.error('Get test tokens failed:', err);
      const errorMessage = 'Failed to claim test tokens (you might not be the owner)';
      setError(errorMessage);
      toast({
        variant: 'destructive',
        title: 'Claim Failed',
        description: errorMessage,
      });
    } finally {
      setLoading(false);
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
          gasLimit: 400000,
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
          gasLimit: 400000,
        });
      }

      await tx.wait();

      const poolName =
        liquidityForm.poolType === 'eth-coinA' ? 'ETH/CoinA' : liquidityForm.poolType === 'eth-coinB' ? 'ETH/CoinB' : 'CoinA/CoinB';

      toast({
        variant: 'default',
        title: 'Liquidity Added Successfully!',
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
        coinBAmount: '',
      });
    } catch (error) {
      const err = error as Error & { reason?: string };
      console.error('Add liquidity failed:', err);
      const errorMessage = err.reason || err.message || 'Unknown error';
      setError(`Add liquidity failed: ${errorMessage}`);
      toast({
        variant: 'destructive',
        title: 'Add Liquidity Failed',
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
  }, [loadUserBalances, account?.address]);

  useEffect(() => {
    if (account?.address) {
      const interval = setInterval(loadUserBalances, 30000);
      return () => clearInterval(interval);
    }
  }, [loadUserBalances, account?.address]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 pt-20 px-6">
      <FloatingWalletButton topOffset="top-16" />
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-cyan-400 via-purple-500 to-pink-600 bg-clip-text text-transparent flex items-center gap-3">
              <Activity className="h-8 w-8 text-cyan-400" />
              Admin DEX Management
            </h1>
            <p className="text-slate-400 text-lg">Manage liquidity pools and test tokens</p>
          </div>
          <Button
            onClick={loadUserBalances}
            variant="outline"
            className="bg-slate-800/50 border-slate-600/50 hover:bg-slate-700/50 hover:border-cyan-400/50 text-slate-300 hover:text-cyan-400"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>

        {/* Balances & Test Tokens */}
        <div className="grid md:grid-cols-2 gap-6">
          <Card className="bg-slate-900/80 backdrop-blur-xl border-slate-700/50">
            <CardHeader className="border-b border-slate-700/50">
              <CardTitle className="text-white flex items-center gap-2">
                <Coins className="h-5 w-5 text-cyan-400" />
                Your Balances
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <span className="text-slate-400 text-sm">ETH</span>
                  <p className="font-semibold text-white">{parseFloat(balances.eth).toFixed(4)}</p>
                </div>
                <div className="text-center">
                  <span className="text-slate-400 text-sm">CoinA</span>
                  <p className="font-semibold text-white">{parseFloat(balances.coinA).toFixed(2)}</p>
                </div>
                <div className="text-center">
                  <span className="text-slate-400 text-sm">CoinB</span>
                  <p className="font-semibold text-white">{parseFloat(balances.coinB).toFixed(2)}</p>
                </div>
              </div>
              <Button
                onClick={getTestTokens}
                disabled={loading || !account}
                className="w-full mt-6 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-400 hover:to-emerald-400 text-white font-semibold transition-all duration-300 shadow-lg hover:shadow-green-400/25 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
              >
                {loading ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-white"></div>
                ) : (
                  <>
                    <Coins className="h-5 w-5" />
                    <span>Claim Test Tokens</span>
                  </>
                )}
              </Button>
              <p className="text-slate-400 text-sm mt-4">
                Claim 1000 CoinA and 1000 CoinB tokens for testing (only for contract owner)
              </p>
            </CardContent>
          </Card>

          {/* Liquidity Management */}
          <Card className="bg-slate-900/80 backdrop-blur-xl border-slate-700/50">
            <CardHeader className="border-b border-slate-700/50">
              <CardTitle className="text-white flex items-center gap-2">
                <Plus className="h-5 w-5 text-cyan-400" />
                Add Liquidity
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300">Pool Type</label>
                  <select
                    className="w-full bg-slate-800/50 border-slate-600/50 rounded-lg px-3 py-3 text-slate-100 focus:ring-2 focus:ring-cyan-400/50 focus:border-cyan-400/50 outline-none transition-all duration-300"
                    value={liquidityForm.poolType}
                    onChange={(e) => setLiquidityForm((prev) => ({ ...prev, poolType: e.target.value }))}
                  >
                    <option value="eth-coinA" className="bg-slate-800">ETH / CoinA</option>
                    <option value="eth-coinB" className="bg-slate-800">ETH / CoinB</option>
                    <option value="token-token" className="bg-slate-800">CoinA / CoinB</option>
                  </select>
                </div>

                {liquidityForm.poolType === 'token-token' ? (
                  <>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-300">CoinA Amount</label>
                      <Input
                        type="number"
                        placeholder="0.0"
                        value={liquidityForm.coinAAmount}
                        onChange={(e) => setLiquidityForm((prev) => ({ ...prev, coinAAmount: e.target.value }))}
                        className="bg-slate-800/50 border-slate-600/50 text-slate-100 placeholder:text-slate-500 focus:border-cyan-400/50 focus:ring-cyan-400/20"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-300">CoinB Amount</label>
                      <Input
                        type="number"
                        placeholder="0.0"
                        value={liquidityForm.coinBAmount}
                        onChange={(e) => setLiquidityForm((prev) => ({ ...prev, coinBAmount: e.target.value }))}
                        className="bg-slate-800/50 border-slate-600/50 text-slate-100 placeholder:text-slate-500 focus:border-cyan-400/50 focus:ring-cyan-400/20"
                      />
                    </div>
                  </>
                ) : (
                  <>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-300">ETH Amount</label>
                      <Input
                        type="number"
                        placeholder="0.0"
                        value={liquidityForm.ethAmount}
                        onChange={(e) => setLiquidityForm((prev) => ({ ...prev, ethAmount: e.target.value }))}
                        className="bg-slate-800/50 border-slate-600/50 text-slate-100 placeholder:text-slate-500 focus:border-cyan-400/50 focus:ring-cyan-400/20"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-300">
                        {liquidityForm.poolType === 'eth-coinA' ? 'CoinA' : 'CoinB'} Amount
                      </label>
                      <Input
                        type="number"
                        placeholder="0.0"
                        value={liquidityForm.tokenAmount}
                        onChange={(e) => setLiquidityForm((prev) => ({ ...prev, tokenAmount: e.target.value }))}
                        className="bg-slate-800/50 border-slate-600/50 text-slate-100 placeholder:text-slate-500 focus:border-cyan-400/50 focus:ring-cyan-400/20"
                      />
                    </div>
                  </>
                )}

                <Button
                  onClick={addLiquidity}
                  disabled={
                    loading ||
                    !account ||
                    (liquidityForm.poolType === 'token-token'
                      ? !liquidityForm.coinAAmount || !liquidityForm.coinBAmount
                      : !liquidityForm.ethAmount || !liquidityForm.tokenAmount)
                  }
                  className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-semibold transition-all duration-300 shadow-lg hover:shadow-cyan-400/25 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                >
                  {loading ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-white"></div>
                  ) : (
                    <>
                      <Plus className="h-5 w-5" />
                      <span>{!account ? 'Connect Wallet' : 'Add Liquidity'}</span>
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {error && (
          <Card className="bg-red-900/20 border-red-700/50">
            <CardContent className="p-4 flex items-start space-x-3">
              <AlertCircle className="h-5 w-5 text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-red-400 text-sm">{error}</p>
            </CardContent>
          </Card>
        )}

        {/* Pool Information */}
        <Card className="bg-slate-900/80 backdrop-blur-xl border-slate-700/50">
          <CardHeader className="border-b border-slate-700/50">
            <CardTitle className="text-white flex items-center gap-2">
              <Activity className="h-5 w-5 text-cyan-400" />
              Pool Information
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid md:grid-cols-3 gap-6">
              {Object.entries(poolsData).map(([key, pool]) => {
                const poolName = key === 'coinA' ? 'ETH / CoinA' : key === 'coinB' ? 'ETH / CoinB' : 'CoinA / CoinB';
                return (
                  <div key={key} className="bg-slate-800/50 rounded-xl p-6 border border-slate-700/50">
                    <h4 className="font-semibold text-white mb-4 text-center">{poolName}</h4>
                    <div className="space-y-3">
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-400">Reserve 1:</span>
                        <span className="text-slate-200">
                          {parseFloat(pool.ethReserve).toFixed(4)} {key === 'tokenPool' ? 'CoinA' : 'ETH'}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-400">Reserve 2:</span>
                        <span className="text-slate-200">
                          {parseFloat(pool.tokenReserve).toFixed(4)} {key === 'coinA' ? 'CoinA' : key === 'coinB' ? 'CoinB' : 'CoinB'}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-400">Total Liquidity:</span>
                        <span className="text-slate-200">{parseFloat(pool.totalLiquidity).toFixed(4)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-400">Your Liquidity:</span>
                        <span className="text-green-400 font-semibold">{parseFloat(pool.userLiquidity).toFixed(4)}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}