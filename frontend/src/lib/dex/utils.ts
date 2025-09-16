import { ethers } from 'ethers';
import { CONTRACTS, ERC20_ABI, DEX_ABI } from './contracts';
import { TokenBalance, PoolData } from '@/types/types-dex';

export const loadBalances = async (provider: ethers.BrowserProvider, address: string): Promise<{
  balances: TokenBalance;
  poolsData: {[key: string]: PoolData};
}> => {
  try {
    const ethBalance = await provider.getBalance(address);
    const coinAContract = new ethers.Contract(CONTRACTS.coinA, ERC20_ABI, provider);
    const coinBContract = new ethers.Contract(CONTRACTS.coinB, ERC20_ABI, provider);
    const coinABalance = await coinAContract.balanceOf(address);
    const coinBBalance = await coinBContract.balanceOf(address);
    
    const balances = {
      eth: ethers.formatEther(ethBalance),
      coinA: ethers.formatUnits(coinABalance, 18),
      coinB: ethers.formatUnits(coinBBalance, 18)
    };

    const dexContract = new ethers.Contract(CONTRACTS.dex, DEX_ABI, provider);
    const coinAPool = await dexContract.pools(CONTRACTS.coinA);
    const coinBPool = await dexContract.pools(CONTRACTS.coinB);
    const tokenPool = await dexContract.tokenPool();
    const userCoinALiquidity = await dexContract.getUserLiquidity(CONTRACTS.coinA);
    const userCoinBLiquidity = await dexContract.getUserLiquidity(CONTRACTS.coinB);
    const userTokenLiquidity = await dexContract.getTokenPoolUserLiquidity();
    
    const poolsData = {
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
    };

    return { balances, poolsData };
  } catch (error) {
    console.error('Failed to load balances:', error);
    throw error;
  }
};

export const calculateSwapOutput = async (
  provider: ethers.BrowserProvider,
  fromToken: string,
  toToken: string,
  fromAmount: string
): Promise<string> => {
  if (!provider || !fromAmount || parseFloat(fromAmount) <= 0) {
    return '';
  }

  try {
    const dexContract = new ethers.Contract(CONTRACTS.dex, DEX_ABI, provider);
    const amountIn = ethers.parseUnits(fromAmount, 18);
    let reserveIn: bigint, reserveOut: bigint;

    if (fromToken === 'ETH' && toToken === 'CoinA') {
      const pool = await dexContract.pools(CONTRACTS.coinA);
      reserveIn = pool.ethReserve;
      reserveOut = pool.tokenReserve;
    } else if (fromToken === 'ETH' && toToken === 'CoinB') {
      const pool = await dexContract.pools(CONTRACTS.coinB);
      reserveIn = pool.ethReserve;
      reserveOut = pool.tokenReserve;
    } else if (fromToken === 'CoinA' && toToken === 'ETH') {
      const pool = await dexContract.pools(CONTRACTS.coinA);
      reserveIn = pool.tokenReserve;
      reserveOut = pool.ethReserve;
    } else if (fromToken === 'CoinB' && toToken === 'ETH') {
      const pool = await dexContract.pools(CONTRACTS.coinB);
      reserveIn = pool.tokenReserve;
      reserveOut = pool.ethReserve;
    } else if (fromToken === 'CoinA' && toToken === 'CoinB') {
      const pool = await dexContract.tokenPool();
      reserveIn = pool.coinAReserve;
      reserveOut = pool.coinBReserve;
    } else if (fromToken === 'CoinB' && toToken === 'CoinA') {
      const pool = await dexContract.tokenPool();
      reserveIn = pool.coinBReserve;
      reserveOut = pool.coinAReserve;
    } else {
      return '';
    }

    if (reserveIn === BigInt(0) || reserveOut === BigInt(0)) {
      return '0';
    }

    const amountOut = await dexContract.getAmountOut(amountIn, reserveIn, reserveOut);
    const feePercent = BigInt(50);
    const percentBase = BigInt(10000);
    const afterFee = amountOut - (amountOut * feePercent / percentBase);
    
    return parseFloat(ethers.formatUnits(afterFee, 18)).toFixed(6);
  } catch (error) {
    console.error('Failed to calculate swap output:', error);
    return '0';
  }
};

export const getExplorerUrl = (txHash: string): string => {
  return `https://sepolia.etherscan.io/tx/${txHash}`;
};