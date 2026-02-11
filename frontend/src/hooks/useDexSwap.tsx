import { useState, useCallback, useEffect } from 'react';
import { ethers } from 'ethers';
import { useActiveAccount } from 'thirdweb/react';
import { toast } from '@/hooks/use-toast';
import { ToastAction } from '@/components/ui/toast';
import { CONTRACTS, ERC20_ABI, DEX_ABI } from '@/lib/dex/contracts';
import { loadBalances, getExplorerUrl, loadGlobalPoolsData } from '@/lib/dex/utils';
import { TokenBalance, SwapForm } from '@/types/types-dex';

// Reusing the API class from the original file or importing it if it was separate.
// Since it was defined inside the page, we'll define a service version here or assume it's moved.
// For now, I'll include the API calls directly or mock them as the previous file did.

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000/api';

interface SwapData {
    txHash: string;
    walletAddress: string;
    fromToken: string;
    toToken: string;
    fromAmount: string;
    toAmount: string;
    actualFromAmount: string;
    actualToAmount: string;
    exchangeRate: number;
    slippage: number;
    gasUsed: string;
    gasFee: string;
    blockNumber: number;
    priceImpact: number;
}

interface EthersError extends Error {
    reason?: string;
    transaction?: { hash: string };
    code?: string;
}

class DexSwapAPI {
    static async recordSwap(swapData: SwapData) {
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
}

export const useDexSwap = () => {
    const account = useActiveAccount();
    const [balances, setBalances] = useState<TokenBalance>({
        eth: '0',
        coinA: '0',
        coinB: '0'
    });
    const [loading, setLoading] = useState(false);
    const [refreshingBalances, setRefreshingBalances] = useState(false);
    const [tokenPrices, setTokenPrices] = useState({ ethCoinA: '0', ethCoinB: '0' });

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

    const loadUserBalances = useCallback(async () => {
        // We always want to fetch prices, even if no wallet is connected or on wrong network
        const SEPOLIA_RPC = "https://rpc.ankr.com/eth_sepolia";
        const staticProvider = new ethers.JsonRpcProvider(SEPOLIA_RPC);

        setRefreshingBalances(true);
        try {
            let browserProvider: ethers.BrowserProvider | null = null;
            let currentChainId: number | null = null;

            if (window.ethereum) {
                browserProvider = new ethers.BrowserProvider(window.ethereum);
                const network = await browserProvider.getNetwork();
                currentChainId = Number(network.chainId);
            }

            // Always fetch global prices using static provider to ensure they show up
            let poolsData;
            try {
                poolsData = await loadGlobalPoolsData(staticProvider);
                setError('');
            } catch (poolError) {
                console.error('Global pools load failure:', poolError);
                // Fallback attempt if static RPC fails
                if (browserProvider && currentChainId === 11155111) {
                    poolsData = await loadGlobalPoolsData(browserProvider);
                }
            }

            // If on correct network and account connected, fetch user balances
            if (browserProvider && currentChainId === 11155111 && account?.address) {
                try {
                    const data = await loadBalances(browserProvider, account.address);
                    setBalances(data.balances);
                    // Use more accurate poolsData from browser provider if available
                    poolsData = data.poolsData;
                } catch (balanceError) {
                    console.error('User balance load failure:', balanceError);
                }
            } else if (browserProvider && currentChainId !== 11155111) {
                // Keep balances at 0 but don't show blocking error if we have prices
                setBalances({ eth: '0', coinA: '0', coinB: '0' });
                if (!poolsData) setError('Please switch to Sepolia network to see user balances');
            }

            // Calculate and set prices from whatever poolsData we managed to get
            if (poolsData) {
                const ethCoinAPrice = poolsData.coinA.ethReserve && poolsData.coinA.tokenReserve && parseFloat(poolsData.coinA.ethReserve) > 0
                    ? (parseFloat(poolsData.coinA.tokenReserve) / parseFloat(poolsData.coinA.ethReserve)).toFixed(6)
                    : '0';

                const ethCoinBPrice = poolsData.coinB.ethReserve && poolsData.coinB.tokenReserve && parseFloat(poolsData.coinB.ethReserve) > 0
                    ? (parseFloat(poolsData.coinB.tokenReserve) / parseFloat(poolsData.coinB.ethReserve)).toFixed(6)
                    : '0';

                setTokenPrices({ ethCoinA: ethCoinAPrice, ethCoinB: ethCoinBPrice });
            }
        } catch (error) {
            console.error('Failed to load balances/prices:', error);
            if (!tokenPrices.ethCoinA || tokenPrices.ethCoinA === '0') {
                setError('Failed to fetch market prices');
            }
        } finally {
            setRefreshingBalances(false);
        }
    }, [account?.address, tokenPrices.ethCoinA]);

    const ensureCorrectNetwork = async () => {
        if (!window.ethereum) return false;

        const provider = new ethers.BrowserProvider(window.ethereum);
        const network = await provider.getNetwork();
        const chainId = Number(network.chainId);

        if (chainId !== 11155111) {
            try {
                await window.ethereum.request({
                    method: 'wallet_switchEthereumChain',
                    params: [{ chainId: '0xaa36a7' }], // 11155111 in hex
                });
                return true;
            } catch (switchError: any) {
                // This error code indicates that the chain has not been added to MetaMask.
                if (switchError.code === 4902) {
                    try {
                        await window.ethereum.request({
                            method: 'wallet_addEthereumChain',
                            params: [
                                {
                                    chainId: '0xaa36a7',
                                    chainName: 'Sepolia',
                                    nativeCurrency: { name: 'Sepolia Ether', symbol: 'ETH', decimals: 18 },
                                    rpcUrls: ['https://rpc.sepolia.org'],
                                    blockExplorerUrls: ['https://sepolia.etherscan.io'],
                                },
                            ],
                        });
                        return true;
                    } catch (addError) {
                        setError('Failed to add Sepolia network to wallet');
                        return false;
                    }
                }
                setError('Please switch to Sepolia network to continue');
                return false;
            }
        }
        return true;
    };

    const calculateOutput = useCallback(async () => {
        if (!swapForm.fromAmount) return;

        try {
            let provider: any;
            const SEPOLIA_RPC = "https://rpc.ankr.com/eth_sepolia";

            if (window.ethereum) {
                const browserProvider = new ethers.BrowserProvider(window.ethereum);
                const network = await browserProvider.getNetwork();
                if (Number(network.chainId) === 11155111) {
                    provider = browserProvider;
                } else {
                    provider = new ethers.JsonRpcProvider(SEPOLIA_RPC);
                }
            } else {
                provider = new ethers.JsonRpcProvider(SEPOLIA_RPC);
            }

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
            // Don't show blocking error for background calculations
        }
    }, [swapForm.fromAmount, swapForm.fromToken, swapForm.toToken]);

    const executeSwap = useCallback(async () => {
        if (!account?.address || !window.ethereum || !swapForm.fromAmount || !swapForm.toAmount) return;

        setLoading(true);
        setError('');

        try {
            // Force network switch if needed
            const isCorrectNetwork = await ensureCorrectNetwork();
            if (!isCorrectNetwork) {
                setLoading(false);
                return;
            }

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
                description: `Successfully swapped ${swapForm.fromAmount} ${swapForm.fromToken} for ${swapForm.toAmount} ${swapForm.toToken}.`,
                action: (
                    <ToastAction
                        altText="View on Explorer"
                        onClick={() => window.open(getExplorerUrl(tx.hash), '_blank')}
                    >
                        View on Explorer
                    </ToastAction>
                ),
            });

            await loadUserBalances();
            setSwapForm(prev => ({ ...prev, fromAmount: '', toAmount: '' }));

            return tx.hash;
        } catch (error) {
            const err = error as EthersError;
            console.error('Swap failed:', err);
            const errorMessage = err.reason || err.message || 'Unknown error';
            setError(`Swap failed: ${errorMessage}`);

            if (err.transaction?.hash) {
                try {
                    await DexSwapAPI.updateSwapStatus(err.transaction.hash, 'failed');
                } catch (dbError) {
                    console.error('Failed to update swap status to failed:', dbError);
                }
            }

            toast({
                variant: "destructive",
                title: "Swap Failed",
                description: errorMessage,
            });
            throw error;
        } finally {
            setLoading(false);
        }
    }, [account?.address, swapForm, swapSettings]);

    useEffect(() => {
        loadUserBalances();
    }, [loadUserBalances]); // Removed account check to allow loading prices immediately

    useEffect(() => {
        if (swapForm.fromAmount && account?.address) {
            const timer = setTimeout(calculateOutput, 500);
            return () => clearTimeout(timer);
        }
    }, [swapForm.fromAmount, swapForm.fromToken, swapForm.toToken, calculateOutput]);

    useEffect(() => {
        const interval = setInterval(loadUserBalances, 30000);
        return () => clearInterval(interval);
    }, [loadUserBalances]); // Removed account check to keep prices updated

    return {
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
        calculateOutput,
        setMaxAmount: useCallback(() => {
            const normalize = (amount: string) => parseFloat(amount).toFixed(6);
            if (swapForm.fromToken === 'ETH') {
                const max = Math.max(0, parseFloat(balances.eth) - 0.01);
                setSwapForm(prev => ({ ...prev, fromAmount: max.toString() }));
            } else if (swapForm.fromToken === 'CoinA') {
                setSwapForm(prev => ({ ...prev, fromAmount: balances.coinA }));
            } else if (swapForm.fromToken === 'CoinB') {
                setSwapForm(prev => ({ ...prev, fromAmount: balances.coinB }));
            }
        }, [balances, swapForm.fromToken]),
    };
};
