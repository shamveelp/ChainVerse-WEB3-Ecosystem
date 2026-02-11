import { ethers } from 'ethers';
import { CONTRACTS, ERC20_ABI, DEX_ABI } from './contracts';
import { TokenBalance, PoolData } from '@/types/types-dex';

export const loadBalances = async (provider: any, address: string): Promise<{
  balances: TokenBalance;
  poolsData: { [key: string]: PoolData };
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

    // Safety check for contract existence
    const code = await provider.getCode(CONTRACTS.dex);
    if (code === '0x' || code === '0x0') {
      throw new Error(`DEX contract at ${CONTRACTS.dex} not found. Ensure you are on the correct network.`);
    }

    const coinAPool = await dexContract.pools(CONTRACTS.coinA).catch(() => ({ ethReserve: 0n, tokenReserve: 0n, totalLiquidity: 0n }));
    const coinBPool = await dexContract.pools(CONTRACTS.coinB).catch(() => ({ ethReserve: 0n, tokenReserve: 0n, totalLiquidity: 0n }));
    const tokenPool = await dexContract.tokenPool().catch(() => ({ coinAReserve: 0n, coinBReserve: 0n, totalLiquidity: 0n }));
    const userCoinALiquidity = await dexContract.getUserLiquidity(CONTRACTS.coinA).catch(() => 0n);
    const userCoinBLiquidity = await dexContract.getUserLiquidity(CONTRACTS.coinB).catch(() => 0n);
    const userTokenLiquidity = await dexContract.getTokenPoolUserLiquidity().catch(() => 0n);

    const poolsData = {
      coinA: {
        ethReserve: ethers.formatEther(coinAPool.ethReserve || 0n),
        tokenReserve: ethers.formatUnits(coinAPool.tokenReserve || 0n, 18),
        totalLiquidity: ethers.formatUnits(coinAPool.totalLiquidity || 0n, 18),
        userLiquidity: ethers.formatUnits(userCoinALiquidity || 0n, 18)
      },
      coinB: {
        ethReserve: ethers.formatEther(coinBPool.ethReserve || 0n),
        tokenReserve: ethers.formatUnits(coinBPool.tokenReserve || 0n, 18),
        totalLiquidity: ethers.formatUnits(coinBPool.totalLiquidity || 0n, 18),
        userLiquidity: ethers.formatUnits(userCoinBLiquidity || 0n, 18)
      },
      tokenPool: {
        ethReserve: ethers.formatUnits(tokenPool.coinAReserve || 0n, 18),
        tokenReserve: ethers.formatUnits(tokenPool.coinBReserve || 0n, 18),
        totalLiquidity: ethers.formatUnits(tokenPool.totalLiquidity || 0n, 18),
        userLiquidity: ethers.formatUnits(userTokenLiquidity || 0n, 18)
      }
    };

    return { balances, poolsData };
  } catch (error) {
    console.error('Failed to load balances:', error);
    throw error;
  }
};

export const calculateSwapOutput = async (
  provider: any,
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

export const loadGlobalPoolsData = async (provider: any): Promise<{ [key: string]: PoolData }> => {
  try {
    const dexContract = new ethers.Contract(CONTRACTS.dex, DEX_ABI, provider);

    // Safety check for contract existence
    const code = await provider.getCode(CONTRACTS.dex);
    if (code === '0x' || code === '0x0') {
      throw new Error(`DEX contract not found. Please switch to Sepolia.`);
    }

    const coinAPool = await dexContract.pools(CONTRACTS.coinA).catch(() => ({ ethReserve: 0n, tokenReserve: 0n, totalLiquidity: 0n }));
    const coinBPool = await dexContract.pools(CONTRACTS.coinB).catch(() => ({ ethReserve: 0n, tokenReserve: 0n, totalLiquidity: 0n }));
    const tokenPool = await dexContract.tokenPool().catch(() => ({ coinAReserve: 0n, coinBReserve: 0n, totalLiquidity: 0n }));

    // For global data, we don't know the user, so userLiquidity is 0
    const userLiquidity = '0';

    return {
      coinA: {
        ethReserve: ethers.formatEther(coinAPool.ethReserve || 0n),
        tokenReserve: ethers.formatUnits(coinAPool.tokenReserve || 0n, 18),
        totalLiquidity: ethers.formatUnits(coinAPool.totalLiquidity || 0n, 18),
        userLiquidity
      },
      coinB: {
        ethReserve: ethers.formatEther(coinBPool.ethReserve || 0n),
        tokenReserve: ethers.formatUnits(coinBPool.tokenReserve || 0n, 18),
        totalLiquidity: ethers.formatUnits(coinBPool.totalLiquidity || 0n, 18),
        userLiquidity
      },
      tokenPool: {
        ethReserve: ethers.formatUnits(tokenPool.coinAReserve || 0n, 18),
        tokenReserve: ethers.formatUnits(tokenPool.coinBReserve || 0n, 18),
        totalLiquidity: ethers.formatUnits(tokenPool.totalLiquidity || 0n, 18),
        userLiquidity
      }
    };
  } catch (error) {
    console.error('Failed to load global pools data:', error);
    throw error;
  }
};

export const getExplorerUrl = (txHash: string): string => {
  return `https://sepolia.etherscan.io/tx/${txHash}`;
};