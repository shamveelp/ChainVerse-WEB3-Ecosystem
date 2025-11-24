// ============================================
// ADD THIS STATE AFTER LINE 44 (after swapSettings state)
// ============================================

const [tokenPrices, setTokenPrices] = useState<{
    ethCoinA: string;
    ethCoinB: string;
    coinACoinB: string;
}>({
    ethCoinA: '0',
    ethCoinB: '0',
    coinACoinB: '0'
});

// ============================================
// ADD THIS FUNCTION AFTER loadUserBalances (around line 60)
// ============================================

const fetchTokenPrices = async () => {
    if (!window.ethereum) return;

    try {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const dexContract = new ethers.Contract(CONTRACTS.dex, DEX_ABI, provider);

        // Fetch ETH/CoinA pool
        const poolA = await dexContract.pools(CONTRACTS.coinA);
        const ethReserveA = poolA.ethReserve;
        const tokenReserveA = poolA.tokenReserve;

        // Fetch ETH/CoinB pool
        const poolB = await dexContract.pools(CONTRACTS.coinB);
        const ethReserveB = poolB.ethReserve;
        const tokenReserveB = poolB.tokenReserve;

        // Fetch CoinA/CoinB pool
        const tokenPool = await dexContract.tokenPool();
        const coinAReserve = tokenPool.coinAReserve;
        const coinBReserve = tokenPool.coinBReserve;

        // Calculate prices (1 ETH = X tokens)
        let ethCoinAPrice = '0';
        let ethCoinBPrice = '0';
        let coinACoinBPrice = '0';

        if (ethReserveA > BigInt(0) && tokenReserveA > BigInt(0)) {
            // Price of 1 ETH in CoinA tokens
            ethCoinAPrice = ethers.formatUnits(tokenReserveA * BigInt(1e18) / ethReserveA, 18);
        }

        if (ethReserveB > BigInt(0) && tokenReserveB > BigInt(0)) {
            // Price of 1 ETH in CoinB tokens
            ethCoinBPrice = ethers.formatUnits(tokenReserveB * BigInt(1e18) / ethReserveB, 18);
        }

        if (coinAReserve > BigInt(0) && coinBReserve > BigInt(0)) {
            // Price of 1 CoinA in CoinB tokens
            coinACoinBPrice = ethers.formatUnits(coinBReserve * BigInt(1e18) / coinAReserve, 18);
        }

        setTokenPrices({
            ethCoinA: ethCoinAPrice,
            ethCoinB: ethCoinBPrice,
            coinACoinB: coinACoinBPrice
        });

        console.log('Token Prices Updated:', {
            'ETH/CoinA': ethCoinAPrice,
            'ETH/CoinB': ethCoinBPrice,
            'CoinA/CoinB': coinACoinBPrice
        });
    } catch (error) {
        console.error('Failed to fetch token prices:', error);
    }
};

// ============================================
// ADD THIS useEffect AFTER THE EXISTING useEffects (around line 205)
// ============================================

useEffect(() => {
    fetchTokenPrices();
    const interval = setInterval(fetchTokenPrices, 15000); // Update every 15 seconds
    return () => clearInterval(interval);
}, []);

// ============================================
// REPLACE THE HARDCODED PRICE SECTION (around line 420-430)
// Look for the section with "$2,847.92" and replace with:
// ============================================

<div className="text-right" >
    <p className="text-2xl font-bold text-white" >
    {
        swapForm.fromToken === 'ETH' && swapForm.toToken === 'CoinA' && tokenPrices.ethCoinA !== '0'
            ? `1 ETH = ${parseFloat(tokenPrices.ethCoinA).toFixed(4)} CoinA`
            : swapForm.fromToken === 'ETH' && swapForm.toToken === 'CoinB' && tokenPrices.ethCoinB !== '0'
                ? `1 ETH = ${parseFloat(tokenPrices.ethCoinB).toFixed(4)} CoinB`
                : swapForm.fromToken === 'CoinA' && swapForm.toToken === 'ETH' && tokenPrices.ethCoinA !== '0'
                    ? `1 CoinA = ${(1 / parseFloat(tokenPrices.ethCoinA)).toFixed(6)} ETH`
                    : swapForm.fromToken === 'CoinB' && swapForm.toToken === 'ETH' && tokenPrices.ethCoinB !== '0'
                        ? `1 CoinB = ${(1 / parseFloat(tokenPrices.ethCoinB)).toFixed(6)} ETH`
                        : swapForm.fromToken === 'CoinA' && swapForm.toToken === 'CoinB' && tokenPrices.coinACoinB !== '0'
                            ? `1 CoinA = ${parseFloat(tokenPrices.coinACoinB).toFixed(4)} CoinB`
                            : swapForm.fromToken === 'CoinB' && swapForm.toToken === 'CoinA' && tokenPrices.coinACoinB !== '0'
                                ? `1 CoinB = ${(1 / parseFloat(tokenPrices.coinACoinB)).toFixed(4)} CoinA`
                                : 'Loading...'
    }
        </p>
        < p className = "text-sm text-slate-400" > Current Exchange Rate </p>
            </div>

// ============================================
// OPTIONAL: Add fetchTokenPrices() call after successful swap
// Add this line after line 152 (after loadUserBalances())
// ============================================

await fetchTokenPrices(); // Refresh prices after swap
