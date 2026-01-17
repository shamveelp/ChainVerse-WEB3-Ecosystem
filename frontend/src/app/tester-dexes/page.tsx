// app/page.tsx
"use client";

import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { Wallet, ArrowUpDown, Plus, RefreshCw, AlertCircle } from 'lucide-react';

// Contract addresses - UPDATE THESE WITH YOUR ACTUAL DEPLOYED ADDRESSES
const CONTRACTS = {
  coinA: '0xBcAA134722eb7307Ff50770bB3334eC4752f8067',
  coinB: '0x994f607b3601Ba8B01163e7BD038baf138Ed7a30',
  dex: '0x15e57a20cD6ABf16983CB6629Aa760D40ff8C232',
};

// ERC20 and DEX ABIs (unchanged)
const ERC20_ABI = [
  'function balanceOf(address owner) view returns (uint256)',
  'function transfer(address to, uint256 amount) returns (bool)',
  'function approve(address spender, uint256 amount) returns (bool)',
  'function allowance(address owner, address spender) view returns (uint256)',
  'function symbol() view returns (string)',
  'function decimals() view returns (uint8)',
  'function mint(address to, uint256 amount)'
];

const DEX_ABI = [
  'function swapEthForTokens(address token, uint256 minTokens) payable',
  'function swapTokensForEth(address token, uint256 tokenAmount, uint256 minEth)',
  'function swapTokens(address tokenIn, address tokenOut, uint256 amountIn, uint256 minAmountOut)',
  'function addLiquidity(address token, uint256 tokenAmount) payable',
  'function removeLiquidity(address token, uint256 liquidityAmount)',
  'function addTokenLiquidity(uint256 coinAAmount, uint256 coinBAmount)',
  'function getPoolInfo() view returns (uint256, uint256, uint256, uint256, uint256, uint256)',
  'function getUserLiquidity(address token) view returns (uint256)',
  'function getTokenPoolUserLiquidity() view returns (uint256)',
  'function getAmountOut(uint256 amountIn, uint256 reserveIn, uint256 reserveOut) view returns (uint256)',
  'function pools(address token) view returns (uint256 ethReserve, uint256 tokenReserve, uint256 totalLiquidity)',
  'function tokenPool() view returns (uint256 coinAReserve, uint256 coinBReserve, uint256 totalLiquidity)',
  'event EthToTokenSwap(address indexed user, address indexed token, uint256 ethIn, uint256 tokensOut)',
  'event TokenToEthSwap(address indexed user, address indexed token, uint256 tokensIn, uint256 ethOut)',
  'event TokenToTokenSwap(address indexed user, uint256 tokenAIn, uint256 tokenBOut)',
  'event LiquidityAdded(address indexed user, address indexed token, uint256 ethAmount, uint256 tokenAmount)'
];

interface WalletState {
  connected: boolean;
  address: string;
  provider: ethers.BrowserProvider | null;
  signer: ethers.Signer | null;
}

interface TokenBalance {
  eth: string;
  coinA: string;
  coinB: string;
}

interface PoolData {
  ethReserve: string;
  tokenReserve: string;
  totalLiquidity: string;
  userLiquidity: string;
}

interface SwapForm {
  fromToken: string;
  toToken: string;
  fromAmount: string;
  toAmount: string;
  slippage: string;
}

interface LiquidityForm {
  poolType: string;
  ethAmount: string;
  tokenAmount: string;
  coinAAmount: string;
  coinBAmount: string;
}

export default function App() {
  const [wallet, setWallet] = useState<WalletState>({
    connected: false,
    address: '',
    provider: null,
    signer: null
  });
  
  const [balances, setBalances] = useState<TokenBalance>({
    eth: '0',
    coinA: '0',
    coinB: '0'
  });
  
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('swap');
  
  const [swapForm, setSwapForm] = useState<SwapForm>({
    fromToken: 'ETH',
    toToken: 'CoinA',
    fromAmount: '',
    toAmount: '',
    slippage: '1'
  });
  
  const [liquidityForm, setLiquidityForm] = useState<LiquidityForm>({
    poolType: 'eth-coinA',
    ethAmount: '',
    tokenAmount: '',
    coinAAmount: '',
    coinBAmount: ''
  });

  const [poolsData, setPoolsData] = useState<{[key: string]: PoolData}>({});
  const [error, setError] = useState('');

  // Connect wallet (unchanged logic)
  const connectWallet = async () => {
    try {
      if (!window.ethereum) {
        setError('Please install MetaMask');
        return;
      }
      const provider = new ethers.BrowserProvider(window.ethereum);
      await provider.send('eth_requestAccounts', []);
      const signer = await provider.getSigner();
      const address = await signer.getAddress();
      setWallet({ connected: true, address, provider, signer });
      setError('');
      await loadBalances(provider, address);
    } catch (error) {
      console.error('Failed to connect wallet:', error);
      setError('Failed to connect wallet');
    }
  };

  // Load balances and pool data (unchanged logic)
  const loadBalances = async (provider: ethers.BrowserProvider, address: string) => {
    try {
      const ethBalance = await provider.getBalance(address);
      const coinAContract = new ethers.Contract(CONTRACTS.coinA, ERC20_ABI, provider);
      const coinBContract = new ethers.Contract(CONTRACTS.coinB, ERC20_ABI, provider);
      const coinABalance = await coinAContract.balanceOf(address);
      const coinBBalance = await coinBContract.balanceOf(address);
      
      setBalances({
        eth: ethers.formatEther(ethBalance),
        coinA: ethers.formatUnits(coinABalance, 18),
        coinB: ethers.formatUnits(coinBBalance, 18)
      });

      const dexContract = new ethers.Contract(CONTRACTS.dex, DEX_ABI, provider);
      const coinAPool = await dexContract.pools(CONTRACTS.coinA);
      const coinBPool = await dexContract.pools(CONTRACTS.coinB);
      const tokenPool = await dexContract.tokenPool();
      const userCoinALiquidity = await dexContract.getUserLiquidity(CONTRACTS.coinA);
      const userCoinBLiquidity = await dexContract.getUserLiquidity(CONTRACTS.coinB);
      const userTokenLiquidity = await dexContract.getTokenPoolUserLiquidity();
      
      setPoolsData({
        coinA: {
          ethReserve: ethers.formatEther(coinAPool.ethReserve),
          tokenReserve: ethers.formatUnits(coinAPool.tokenReserve, 18),
          totalLiquidity: ethers.formatUnits(coinAPool.totalLiquidity, 18),
          userLiquidity: ethers.formatUnits(userCoinALiquidity, 18)
        },
        coinB: {
          ethReserve: ethers.formatEther(coinBPool.ethReserve),
          tokenReserve: ethers.formatUnits(coinBPool.tokenReserve, 18),
          totalLiquidity: ethers.formatUnits(coinBPool.totalLiquidity, 18),
          userLiquidity: ethers.formatUnits(userCoinBLiquidity, 18)
        },
        tokenPool: {
          ethReserve: ethers.formatUnits(tokenPool.coinAReserve, 18),
          tokenReserve: ethers.formatUnits(tokenPool.coinBReserve, 18),
          totalLiquidity: ethers.formatUnits(tokenPool.totalLiquidity, 18),
          userLiquidity: ethers.formatUnits(userTokenLiquidity, 18)
        }
      });
    } catch (error) {
      console.error('Failed to load balances:', error);
      setError('Failed to load balances');
    }
  };

  // Calculate swap output (unchanged logic)
  const calculateSwapOutput = async () => {
    if (!wallet.provider || !swapForm.fromAmount || parseFloat(swapForm.fromAmount) <= 0) {
      setSwapForm(prev => ({ ...prev, toAmount: '' }));
      return;
    }
    try {
      const dexContract = new ethers.Contract(CONTRACTS.dex, DEX_ABI, wallet.provider);
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
        setSwapForm(prev => ({ ...prev, toAmount: '' }));
        return;
      }
      if (reserveIn === BigInt(0) || reserveOut === BigInt(0)) {
        setSwapForm(prev => ({ ...prev, toAmount: '0' }));
        setError('No liquidity available for this pair');
        return;
      }
      const amountOut = await dexContract.getAmountOut(amountIn, reserveIn, reserveOut);
      const feePercent = BigInt(50);
      const percentBase = BigInt(10000);
      const afterFee = amountOut - (amountOut * feePercent / percentBase);
      setSwapForm(prev => ({
        ...prev,
        toAmount: parseFloat(ethers.formatUnits(afterFee, 18)).toFixed(6)
      }));
      setError('');
    } catch (error) {
      console.error('Failed to calculate swap output:', error);
      setSwapForm(prev => ({ ...prev, toAmount: '0' }));
      setError('Failed to calculate swap output');
    }
  };

  // Execute swap (unchanged logic)
  const executeSwap = async () => {
    if (!wallet.signer || !swapForm.fromAmount || !swapForm.toAmount) return;
    setLoading(true);
    setError('');
    try {
      const dexContract = new ethers.Contract(CONTRACTS.dex, DEX_ABI, wallet.signer);
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
        const tokenContract = new ethers.Contract(tokenAddress, ERC20_ABI, wallet.signer);
        const allowance = await tokenContract.allowance(wallet.address, CONTRACTS.dex);
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
        const tokenContract = new ethers.Contract(tokenInAddress, ERC20_ABI, wallet.signer);
        const allowance = await tokenContract.allowance(wallet.address, CONTRACTS.dex);
        if (allowance < amountIn) {
          const approveTx = await tokenContract.approve(CONTRACTS.dex, amountIn);
          await approveTx.wait();
        }
        tx = await dexContract.swapTokens(tokenInAddress, tokenOutAddress, amountIn, minAmountOut, {
          gasLimit: 300000
        });
      }
      await tx.wait();
      await loadBalances(wallet.provider!, wallet.address);
      setSwapForm(prev => ({ ...prev, fromAmount: '', toAmount: '' }));
    } catch (err) {
      const error = err as Error;
      console.error('Swap failed:', error);
      setError(`Swap failed: ${error.message || 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  // Add liquidity (unchanged logic)
  const addLiquidity = async () => {
    if (!wallet.signer) return;
    setLoading(true);
    setError('');
    try {
      const dexContract = new ethers.Contract(CONTRACTS.dex, DEX_ABI, wallet.signer);
      if (liquidityForm.poolType === 'token-token') {
        if (!liquidityForm.coinAAmount || !liquidityForm.coinBAmount) return;
        const coinAAmount = ethers.parseUnits(liquidityForm.coinAAmount, 18);
        const coinBAmount = ethers.parseUnits(liquidityForm.coinBAmount, 18);
        const coinAContract = new ethers.Contract(CONTRACTS.coinA, ERC20_ABI, wallet.signer);
        const coinBContract = new ethers.Contract(CONTRACTS.coinB, ERC20_ABI, wallet.signer);
        const coinAAllowance = await coinAContract.allowance(wallet.address, CONTRACTS.dex);
        const coinBAllowance = await coinBContract.allowance(wallet.address, CONTRACTS.dex);
        if (coinAAllowance < coinAAmount) {
          const approveTx = await coinAContract.approve(CONTRACTS.dex, coinAAmount);
          await approveTx.wait();
        }
        if (coinBAllowance < coinBAmount) {
          const approveTx = await coinBContract.approve(CONTRACTS.dex, coinBAmount);
          await approveTx.wait();
        }
        const tx = await dexContract.addTokenLiquidity(coinAAmount, coinBAmount, {
          gasLimit: 400000
        });
        await tx.wait();
      } else {
        if (!liquidityForm.ethAmount || !liquidityForm.tokenAmount) return;
        const ethAmount = ethers.parseEther(liquidityForm.ethAmount);
        const tokenAmount = ethers.parseUnits(liquidityForm.tokenAmount, 18);
        const tokenAddress = liquidityForm.poolType === 'eth-coinA' ? CONTRACTS.coinA : CONTRACTS.coinB;
        const tokenContract = new ethers.Contract(tokenAddress, ERC20_ABI, wallet.signer);
        const allowance = await tokenContract.allowance(wallet.address, CONTRACTS.dex);
        if (allowance < tokenAmount) {
          const approveTx = await tokenContract.approve(CONTRACTS.dex, tokenAmount);
          await approveTx.wait();
        }
        const tx = await dexContract.addLiquidity(tokenAddress, tokenAmount, { 
          value: ethAmount,
          gasLimit: 400000
        });
        await tx.wait();
      }
      await loadBalances(wallet.provider!, wallet.address);
      setLiquidityForm({
        poolType: 'eth-coinA',
        ethAmount: '',
        tokenAmount: '',
        coinAAmount: '',
        coinBAmount: ''
      });
    } catch (err) {
      const error = err as Error;
      console.error('Add liquidity failed:', error);
      setError(`Add liquidity failed: ${error.message || 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  // Get test tokens (unchanged logic)
  const getTestTokens = async () => {
    if (!wallet.signer) return;
    setLoading(true);
    setError('');
    try {
      const coinAContract = new ethers.Contract(CONTRACTS.coinA, ERC20_ABI, wallet.signer);
      const coinBContract = new ethers.Contract(CONTRACTS.coinB, ERC20_ABI, wallet.signer);
      const amount = ethers.parseUnits('1000', 18);
      const txA = await coinAContract.mint(wallet.address, amount);
      await txA.wait();
      const txB = await coinBContract.mint(wallet.address, amount);
      await txB.wait();
      await loadBalances(wallet.provider!, wallet.address);
    } catch (err) {
      const error = err as Error;
      console.error('Get test tokens failed:', error);
      setError(`Get test tokens failed: ${error.message || 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  // Auto-calculate swap output and auto-refresh balances (unchanged logic)
  useEffect(() => {
    if (swapForm.fromAmount && wallet.provider) {
      const timer = setTimeout(calculateSwapOutput, 500);
      return () => clearTimeout(timer);
    }
  }, [swapForm.fromAmount, swapForm.fromToken, swapForm.toToken]);

  useEffect(() => {
    if (wallet.connected && wallet.provider) {
      const interval = setInterval(() => {
        loadBalances(wallet.provider!, wallet.address);
      }, 30000);
      return () => clearInterval(interval);
    }
  }, [wallet.connected]);

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 p-6 md:p-8">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl md:text-5xl font-extrabold bg-gradient-to-r from-cyan-400 to-purple-500 bg-clip-text text-transparent">
            Sepolia DEX
          </h1>
          <p className="text-gray-400 text-sm md:text-base max-w-md mx-auto">
            Trade and provide liquidity on our decentralized exchange
          </p>

          {!wallet.connected ? (
            <button
              onClick={connectWallet}
              className="inline-flex items-center space-x-2 bg-gradient-to-r from-cyan-500 to-purple-500 text-white px-6 py-3 rounded-xl font-semibold hover:from-cyan-600 hover:to-purple-600 transition-all duration-300 transform hover:scale-105"
            >
              <Wallet className="h-5 w-5" />
              <span>Connect Wallet</span>
            </button>
          ) : (
            <div className="flex flex-col items-center space-y-4">
              <div className="flex items-center space-x-4 bg-gray-800 rounded-xl p-3">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <span className="text-sm font-medium text-gray-300">
                    {wallet.address.slice(0, 6)}...{wallet.address.slice(-4)}
                  </span>
                </div>
                <button
                  onClick={() => loadBalances(wallet.provider!, wallet.address)}
                  className="p-2 hover:bg-gray-700 rounded-full transition-colors"
                  title="Refresh balances"
                >
                  <RefreshCw className="h-4 w-4 text-gray-400" />
                </button>
              </div>
              <div className="grid grid-cols-3 gap-2 text-sm bg-gray-800 rounded-xl p-3 w-full max-w-md">
                <div className="text-center">
                  <span className="text-gray-400">ETH</span>
                  <p className="font-semibold">{parseFloat(balances.eth).toFixed(4)}</p>
                </div>
                <div className="text-center">
                  <span className="text-gray-400">CoinA</span>
                  <p className="font-semibold">{parseFloat(balances.coinA).toFixed(2)}</p>
                </div>
                <div className="text-center">
                  <span className="text-gray-400">CoinB</span>
                  <p className="font-semibold">{parseFloat(balances.coinB).toFixed(2)}</p>
                </div>
              </div>
              <button
                onClick={getTestTokens}
                disabled={loading}
                className="inline-flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-green-700 transition-colors disabled:opacity-50"
              >
                <Plus className="h-4 w-4" />
                <span>Get Test Tokens</span>
              </button>
            </div>
          )}
        </div>

        {error && (
          <div className="bg-red-900/50 border border-red-700 rounded-xl p-4 flex items-start space-x-3 max-w-md mx-auto">
            <AlertCircle className="h-5 w-5 text-red-400 flex-shrink-0 mt-0.5" />
            <p className="text-red-300 text-sm">{error}</p>
          </div>
        )}

        {wallet.connected && (
          <div className="space-y-6">
            {/* Tab Navigation */}
            <div className="flex justify-center bg-gray-800 rounded-xl p-1">
              <button
                onClick={() => setActiveTab('swap')}
                className={`flex-1 py-3 px-6 rounded-lg font-semibold transition-all duration-200 ${
                  activeTab === 'swap' ? 'bg-cyan-500 text-white' : 'text-gray-400 hover:text-cyan-400'
                }`}
              >
                <ArrowUpDown className="h-4 w-4 inline mr-2" />
                Swap
              </button>
              <button
                onClick={() => setActiveTab('liquidity')}
                className={`flex-1 py-3 px-6 rounded-lg font-semibold transition-all duration-200 ${
                  activeTab === 'liquidity' ? 'bg-cyan-500 text-white' : 'text-gray-400 hover:text-cyan-400'
                }`}
              >
                <Plus className="h-4 w-4 inline mr-2" />
                Liquidity
              </button>
            </div>

            {/* Swap Tab */}
            {activeTab === 'swap' && (
              <div className="bg-gray-800 rounded-2xl shadow-2xl p-6 space-y-6">
                <div className="text-center">
                  <h2 className="text-2xl font-bold text-gray-100">Swap Tokens</h2>
                  <p className="text-gray-400 text-sm">Exchange tokens instantly</p>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-300">From</label>
                    <div className="flex items-center space-x-2 bg-gray-700 rounded-xl p-2">
                      <select
                        className="w-28 bg-transparent border border-gray-600 rounded-lg px-3 py-2 text-gray-100 focus:ring-2 focus:ring-cyan-500 focus:border-transparent outline-none"
                        value={swapForm.fromToken}
                        onChange={(e) => setSwapForm(prev => ({ ...prev, fromToken: e.target.value }))}
                      >
                        <option value="ETH" className="bg-gray-800">ETH</option>
                        <option value="CoinA" className="bg-gray-800">CoinA</option>
                        <option value="CoinB" className="bg-gray-800">CoinB</option>
                      </select>
                      <input
                        type="number"
                        placeholder="0.0"
                        className="flex-1 bg-transparent border border-gray-600 rounded-lg px-3 py-2 text-gray-100 focus:ring-2 focus:ring-cyan-500 focus:border-transparent outline-none"
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
                      className="p-2 bg-gray-700 rounded-full hover:bg-gray-600 transition-colors transform hover:scale-110"
                    >
                      <ArrowUpDown className="h-5 w-5 text-cyan-400" />
                    </button>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-300">To</label>
                    <div className="flex items-center space-x-2 bg-gray-700 rounded-xl p-2">
                      <select
                        className="w-28 bg-transparent border border-gray-600 rounded-lg px-3 py-2 text-gray-100 focus:ring-2 focus:ring-cyan-500 focus:border-transparent outline-none"
                        value={swapForm.toToken}
                        onChange={(e) => setSwapForm(prev => ({ ...prev, toToken: e.target.value }))}
                      >
                        <option value="ETH" className="bg-gray-800">ETH</option>
                        <option value="CoinA" className="bg-gray-800">CoinA</option>
                        <option value="CoinB" className="bg-gray-800">CoinB</option>
                      </select>
                      <input
                        type="number"
                        placeholder="0.0"
                        className="flex-1 bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-gray-100 outline-none"
                        value={swapForm.toAmount}
                        readOnly
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-300">Slippage Tolerance (%)</label>
                    <input
                      type="number"
                      className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-gray-100 focus:ring-2 focus:ring-cyan-500 focus:border-transparent outline-none"
                      value={swapForm.slippage}
                      onChange={(e) => setSwapForm(prev => ({ ...prev, slippage: e.target.value }))}
                      min="0.1"
                      max="50"
                      step="0.1"
                    />
                  </div>

                  <button
                    onClick={executeSwap}
                    disabled={loading || !swapForm.fromAmount || !swapForm.toAmount || swapForm.fromToken === swapForm.toToken}
                    className="w-full bg-gradient-to-r from-cyan-500 to-purple-500 text-white py-3 rounded-xl font-semibold hover:from-cyan-600 hover:to-purple-600 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 transform hover:scale-105"
                  >
                    {loading ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-white"></div>
                    ) : (
                      <span>Swap</span>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* Liquidity Tab */}
            {activeTab === 'liquidity' && (
              <div className="bg-gray-800 rounded-2xl shadow-2xl p-6 space-y-6">
                <div className="text-center">
                  <h2 className="text-2xl font-bold text-gray-100">Add Liquidity</h2>
                  <p className="text-gray-400 text-sm">Provide liquidity to earn trading fees</p>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-300">Pool Type</label>
                    <select
                      className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-gray-100 focus:ring-2 focus:ring-cyan-500 focus:border-transparent outline-none"
                      value={liquidityForm.poolType}
                      onChange={(e) => setLiquidityForm(prev => ({ ...prev, poolType: e.target.value }))}
                    >
                      <option value="eth-coinA" className="bg-gray-800">ETH / CoinA</option>
                      <option value="eth-coinB" className="bg-gray-800">ETH / CoinB</option>
                      <option value="token-token" className="bg-gray-800">CoinA / CoinB</option>
                    </select>
                  </div>

                  {liquidityForm.poolType === 'token-token' ? (
                    <>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-300">CoinA Amount</label>
                        <input
                          type="number"
                          placeholder="0.0"
                          className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-gray-100 focus:ring-2 focus:ring-cyan-500 focus:border-transparent outline-none"
                          value={liquidityForm.coinAAmount}
                          onChange={(e) => setLiquidityForm(prev => ({ ...prev, coinAAmount: e.target.value }))}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-300">CoinB Amount</label>
                        <input
                          type="number"
                          placeholder="0.0"
                          className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-gray-100 focus:ring-2 focus:ring-cyan-500 focus:border-transparent outline-none"
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
                          className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-gray-100 focus:ring-2 focus:ring-cyan-500 focus:border-transparent outline-none"
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
                          className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-gray-100 focus:ring-2 focus:ring-cyan-500 focus:border-transparent outline-none"
                          value={liquidityForm.tokenAmount}
                          onChange={(e) => setLiquidityForm(prev => ({ ...prev, tokenAmount: e.target.value }))}
                        />
                      </div>
                    </>
                  )}

                  <button
                    onClick={addLiquidity}
                    disabled={loading || (liquidityForm.poolType === 'token-token' ? (!liquidityForm.coinAAmount || !liquidityForm.coinBAmount) : (!liquidityForm.ethAmount || !liquidityForm.tokenAmount))}
                    className="w-full bg-gradient-to-r from-green-500 to-cyan-500 text-white py-3 rounded-xl font-semibold hover:from-green-600 hover:to-cyan-600 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 transform hover:scale-105"
                  >
                    {loading ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-white"></div>
                    ) : (
                      <span>Add Liquidity</span>
                    )}
                  </button>
                </div>

                {/* Pool Information */}
                <div className="space-y-4 border-t border-gray-700 pt-4">
                  <h3 className="text-lg font-semibold text-gray-100">Pool Information</h3>
                  {Object.entries(poolsData).map(([key, pool]) => {
                    let poolName = key === 'coinA' ? 'ETH / CoinA' : key === 'coinB' ? 'ETH / CoinB' : 'CoinA / CoinB';
                    return (
                      <div key={key} className="bg-gray-700 rounded-xl p-4">
                        <h4 className="font-medium text-gray-100 mb-2">{poolName}</h4>
                        <div className="text-sm text-gray-300 space-y-2">
                          <div className="flex justify-between">
                            <span>Reserve 1:</span>
                            <span>{parseFloat(pool.ethReserve).toFixed(4)} {key === 'tokenPool' ? 'CoinA' : 'ETH'}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Reserve 2:</span>
                            <span>{parseFloat(pool.tokenReserve).toFixed(4)} {key === 'coinA' ? 'CoinA' : key === 'coinB' ? 'CoinB' : 'CoinB'}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Your Liquidity:</span>
                            <span>{parseFloat(pool.userLiquidity).toFixed(4)}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}