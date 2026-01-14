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
        if (!window.ethereum) return;

        setRefreshingBalances(true);
        try {
            const provider = new ethers.BrowserProvider(window.ethereum);
            let poolsData;

            if (account?.address) {
                const data = await loadBalances(provider, account.address);
                setBalances(data.balances);
                poolsData = data.poolsData;
            } else {
                poolsData = await loadGlobalPoolsData(provider);
            }

            // Calculate prices
            const ethCoinAPrice = poolsData.coinA.ethReserve && poolsData.coinA.tokenReserve && parseFloat(poolsData.coinA.ethReserve) > 0
                ? (parseFloat(poolsData.coinA.tokenReserve) / parseFloat(poolsData.coinA.ethReserve)).toFixed(6)
                : '0';

            const ethCoinBPrice = poolsData.coinB.ethReserve && poolsData.coinB.tokenReserve && parseFloat(poolsData.coinB.ethReserve) > 0
                ? (parseFloat(poolsData.coinB.tokenReserve) / parseFloat(poolsData.coinB.ethReserve)).toFixed(6)
                : '0';

            setTokenPrices({ ethCoinA: ethCoinAPrice, ethCoinB: ethCoinBPrice });
        } catch (error) {
            console.error('Failed to load balances/prices:', error);
            setError('Failed to load balances/prices');
        } finally {
            setRefreshingBalances(false);
        }
    }, [account?.address]);

    const calculateOutput = useCallback(async () => {
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
    }, [account?.address, swapForm.fromAmount, swapForm.fromToken, swapForm.toToken]);

    const executeSwap = useCallback(async () => {
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
