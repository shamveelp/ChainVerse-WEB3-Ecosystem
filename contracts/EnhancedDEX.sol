// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title Enhanced DEX
 * @dev Advanced Decentralized Exchange with comprehensive AMM functionality
 * Features: Multiple pools, profit sharing, transaction deadlines, advanced fee structure
 */
contract EnhancedDEX is ReentrancyGuard, Ownable {
    using SafeERC20 for IERC20;
    
    // Tokens
    IERC20 public immutable coinA;
    IERC20 public immutable coinB;
    
    // Company wallet for fees
    address public constant COMPANY_WALLET = 0xcc5d972Ee1e4abe7d1d6b5FEd1349ae4913cd423;
    
    // Enhanced liquidity pool structure
    struct Pool {
        uint256 ethReserve;
        uint256 tokenReserve;
        uint256 totalLiquidity;
        uint256 totalFeeCollected;  // Total fees collected for this pool
        uint256 lastUpdateTime;     // Last time fees were distributed
        mapping(address => uint256) liquidity;
        mapping(address => uint256) lastFeeWithdrawTime;
        mapping(address => uint256) feeDebt;  // Fee debt to prevent double claiming
    }
    
    mapping(address => Pool) public pools; // token address => Pool
    
    // Enhanced token-to-token pool
    struct TokenPool {
        uint256 coinAReserve;
        uint256 coinBReserve;
        uint256 totalLiquidity;
        uint256 totalFeeCollected;
        uint256 lastUpdateTime;
        mapping(address => uint256) liquidity;
        mapping(address => uint256) lastFeeWithdrawTime;
        mapping(address => uint256) feeDebt;
    }
    
    TokenPool public tokenPool;
    
    // Fee configuration
    uint256 public constant TRADING_FEE_PERCENT = 30; // 0.3% trading fee
    uint256 public constant LIQUIDITY_FEE_PERCENT = 20; // 0.2% goes to liquidity providers
    uint256 public constant PERCENT_BASE = 10000;
    
    // Protocol settings
    uint256 public minLiquidityLockTime = 24 hours; // Minimum liquidity lock time
    mapping(address => mapping(address => uint256)) public liquidityLockTime; // user => token => unlock time
    
    // Transaction deadlines mapping
    mapping(bytes32 => uint256) public transactionDeadlines;
    
    // Events
    event EthToTokenSwap(address indexed user, address indexed token, uint256 ethIn, uint256 tokensOut, uint256 fee);
    event TokenToEthSwap(address indexed user, address indexed token, uint256 tokensIn, uint256 ethOut, uint256 fee);
    event TokenToTokenSwap(address indexed user, address indexed tokenIn, address indexed tokenOut, uint256 amountIn, uint256 amountOut, uint256 fee);
    event LiquidityAdded(address indexed user, address indexed token, uint256 ethAmount, uint256 tokenAmount, uint256 liquidityMinted);
    event LiquidityRemoved(address indexed user, address indexed token, uint256 ethAmount, uint256 tokenAmount, uint256 liquidityBurned);
    event FeesWithdrawn(address indexed user, address indexed token, uint256 amount);
    event TransactionDeadlineSet(bytes32 indexed txHash, uint256 deadline);
    
    constructor(address _coinA, address _coinB, address initialOwner) Ownable(initialOwner) {
        coinA = IERC20(_coinA);
        coinB = IERC20(_coinB);
    }
    
    /**
     * @dev Set transaction deadline
     */
    function setTransactionDeadline(bytes32 txHash, uint256 deadline) external {
        require(deadline > block.timestamp, "Deadline must be in future");
        transactionDeadlines[txHash] = deadline;
        emit TransactionDeadlineSet(txHash, deadline);
    }
    
    /**
     * @dev Check if transaction is within deadline
     */
    modifier withinDeadline(bytes32 txHash) {
        if (transactionDeadlines[txHash] != 0) {
            require(block.timestamp <= transactionDeadlines[txHash], "Transaction deadline exceeded");
        }
        _;
    }
    
    /**
     * @dev Enhanced add liquidity with lock time
     */
    function addLiquidity(address token, uint256 tokenAmount, bytes32 txHash) 
        external 
        payable 
        nonReentrant
        withinDeadline(txHash)
    {
        require(token == address(coinA) || token == address(coinB), "Invalid token");
        require(msg.value > 0 && tokenAmount > 0, "Invalid amounts");
        
        Pool storage pool = pools[token];
        IERC20 tokenContract = IERC20(token);
        
        require(tokenContract.balanceOf(msg.sender) >= tokenAmount, "Insufficient token balance");
        
        uint256 liquidityMinted;
        
        if (pool.totalLiquidity == 0) {
            liquidityMinted = sqrt(msg.value * tokenAmount);
            require(liquidityMinted > 1000, "Insufficient liquidity minted"); // Prevent zero liquidity attack
            pool.totalLiquidity = liquidityMinted - 1000; // Lock minimum liquidity
        } else {
            uint256 ethLiquidity = (msg.value * pool.totalLiquidity) / pool.ethReserve;
            uint256 tokenLiquidity = (tokenAmount * pool.totalLiquidity) / pool.tokenReserve;
            liquidityMinted = ethLiquidity < tokenLiquidity ? ethLiquidity : tokenLiquidity;
        }
        
        require(liquidityMinted > 0, "Insufficient liquidity minted");
        
        // Transfer tokens from user
        tokenContract.safeTransferFrom(msg.sender, address(this), tokenAmount);
        
        // Update pool
        pool.ethReserve += msg.value;
        pool.tokenReserve += tokenAmount;
        pool.totalLiquidity += liquidityMinted;
        pool.liquidity[msg.sender] += liquidityMinted;
        
        // Set liquidity lock time
        liquidityLockTime[msg.sender][token] = block.timestamp + minLiquidityLockTime;
        
        emit LiquidityAdded(msg.sender, token, msg.value, tokenAmount, liquidityMinted);
    }
    
    /**
     * @dev Enhanced remove liquidity with fee sharing
     */
    function removeLiquidity(address token, uint256 liquidityAmount, bytes32 txHash) 
        external 
        nonReentrant
        withinDeadline(txHash)
    {
        require(token == address(coinA) || token == address(coinB), "Invalid token");
        require(block.timestamp >= liquidityLockTime[msg.sender][token], "Liquidity still locked");
        
        Pool storage pool = pools[token];
        require(pool.liquidity[msg.sender] >= liquidityAmount, "Insufficient liquidity");
        require(pool.totalLiquidity > 0, "No liquidity");
        
        // Calculate amounts to return
        uint256 ethAmount = (liquidityAmount * pool.ethReserve) / pool.totalLiquidity;
        uint256 tokenAmount = (liquidityAmount * pool.tokenReserve) / pool.totalLiquidity;
        
        require(ethAmount > 0 && tokenAmount > 0, "Invalid withdrawal amounts");
        
        // Update pool before transfers
        pool.ethReserve -= ethAmount;
        pool.tokenReserve -= tokenAmount;
        pool.totalLiquidity -= liquidityAmount;
        pool.liquidity[msg.sender] -= liquidityAmount;
        
        // Transfer assets back to user
        payable(msg.sender).transfer(ethAmount);
        IERC20(token).safeTransfer(msg.sender, tokenAmount);
        
        emit LiquidityRemoved(msg.sender, token, ethAmount, tokenAmount, liquidityAmount);
    }
    
    /**
     * @dev Enhanced swap ETH for tokens with deadline and better fee handling
     */
    function swapEthForTokens(address token, uint256 minTokens, bytes32 txHash) 
        external 
        payable 
        nonReentrant
        withinDeadline(txHash)
    {
        require(token == address(coinA) || token == address(coinB), "Invalid token");
        require(msg.value > 0, "ETH amount must be > 0");
        
        Pool storage pool = pools[token];
        require(pool.ethReserve > 0 && pool.tokenReserve > 0, "Insufficient liquidity");
        
        // Calculate tokens out using enhanced AMM formula
        uint256 tradingFee = (msg.value * TRADING_FEE_PERCENT) / PERCENT_BASE;
        uint256 liquidityFee = (msg.value * LIQUIDITY_FEE_PERCENT) / PERCENT_BASE;
        uint256 ethAfterFee = msg.value - tradingFee - liquidityFee;
        
        uint256 tokensOut = getAmountOut(ethAfterFee, pool.ethReserve, pool.tokenReserve);
        
        require(tokensOut >= minTokens, "Slippage too high");
        require(tokensOut < pool.tokenReserve, "Insufficient token liquidity");
        
        // Update pool reserves
        pool.ethReserve += ethAfterFee;
        pool.tokenReserve -= tokensOut;
        pool.totalFeeCollected += liquidityFee;
        pool.lastUpdateTime = block.timestamp;
        
        // Transfer trading fee to company wallet
        if (tradingFee > 0) {
            payable(COMPANY_WALLET).transfer(tradingFee);
        }
        
        // Transfer tokens to user
        IERC20(token).safeTransfer(msg.sender, tokensOut);
        
        emit EthToTokenSwap(msg.sender, token, msg.value, tokensOut, tradingFee + liquidityFee);
    }
    
    /**
     * @dev Enhanced swap tokens for ETH
     */
    function swapTokensForEth(address token, uint256 tokenAmount, uint256 minEth, bytes32 txHash) 
        external 
        nonReentrant
        withinDeadline(txHash)
    {
        require(token == address(coinA) || token == address(coinB), "Invalid token");
        require(tokenAmount > 0, "Token amount must be > 0");
        
        Pool storage pool = pools[token];
        require(pool.ethReserve > 0 && pool.tokenReserve > 0, "Insufficient liquidity");
        
        IERC20 tokenContract = IERC20(token);
        require(tokenContract.balanceOf(msg.sender) >= tokenAmount, "Insufficient token balance");
        
        // Calculate ETH out
        uint256 ethOut = getAmountOut(tokenAmount, pool.tokenReserve, pool.ethReserve);
        uint256 tradingFee = (ethOut * TRADING_FEE_PERCENT) / PERCENT_BASE;
        uint256 liquidityFee = (ethOut * LIQUIDITY_FEE_PERCENT) / PERCENT_BASE;
        uint256 ethAfterFee = ethOut - tradingFee - liquidityFee;
        
        require(ethAfterFee >= minEth, "Slippage too high");
        require(ethOut < pool.ethReserve, "Insufficient ETH liquidity");
        
        // Transfer tokens from user
        tokenContract.safeTransferFrom(msg.sender, address(this), tokenAmount);
        
        // Update pool reserves
        pool.tokenReserve += tokenAmount;
        pool.ethReserve -= ethOut;
        pool.totalFeeCollected += liquidityFee;
        pool.lastUpdateTime = block.timestamp;
        
        // Transfer fees
        if (tradingFee > 0) {
            payable(COMPANY_WALLET).transfer(tradingFee);
        }
        
        // Transfer ETH to user
        payable(msg.sender).transfer(ethAfterFee);
        
        emit TokenToEthSwap(msg.sender, token, tokenAmount, ethAfterFee, tradingFee + liquidityFee);
    }
    
    /**
     * @dev Enhanced token-to-token swap
     */
    function swapTokens(
        address tokenIn, 
        address tokenOut, 
        uint256 amountIn, 
        uint256 minAmountOut,
        bytes32 txHash
    ) 
        external 
        nonReentrant
        withinDeadline(txHash)
    {
        require(
            (tokenIn == address(coinA) && tokenOut == address(coinB)) ||
            (tokenIn == address(coinB) && tokenOut == address(coinA)),
            "Invalid token pair"
        );
        require(amountIn > 0, "Amount must be > 0");
        
        IERC20 tokenInContract = IERC20(tokenIn);
        require(tokenInContract.balanceOf(msg.sender) >= amountIn, "Insufficient balance");
        
        uint256 amountOut;
        
        if (tokenIn == address(coinA)) {
            require(tokenPool.coinAReserve > 0 && tokenPool.coinBReserve > 0, "Insufficient liquidity");
            amountOut = getAmountOut(amountIn, tokenPool.coinAReserve, tokenPool.coinBReserve);
            require(amountOut < tokenPool.coinBReserve, "Insufficient CoinB liquidity");
            
            tokenPool.coinAReserve += amountIn;
            tokenPool.coinBReserve -= amountOut;
        } else {
            require(tokenPool.coinAReserve > 0 && tokenPool.coinBReserve > 0, "Insufficient liquidity");
            amountOut = getAmountOut(amountIn, tokenPool.coinBReserve, tokenPool.coinAReserve);
            require(amountOut < tokenPool.coinAReserve, "Insufficient CoinA liquidity");
            
            tokenPool.coinBReserve += amountIn;
            tokenPool.coinAReserve -= amountOut;
        }
        
        uint256 tradingFee = (amountOut * TRADING_FEE_PERCENT) / PERCENT_BASE;
        uint256 liquidityFee = (amountOut * LIQUIDITY_FEE_PERCENT) / PERCENT_BASE;
        uint256 amountOutAfterFee = amountOut - tradingFee - liquidityFee;
        
        require(amountOutAfterFee >= minAmountOut, "Slippage too high");
        
        // Transfer input tokens
        tokenInContract.safeTransferFrom(msg.sender, address(this), amountIn);
        
        // Update fee collection
        tokenPool.totalFeeCollected += liquidityFee;
        tokenPool.lastUpdateTime = block.timestamp;
        
        // Transfer fees
        if (tradingFee > 0) {
            IERC20(tokenOut).safeTransfer(COMPANY_WALLET, tradingFee);
        }
        
        // Transfer output tokens
        IERC20(tokenOut).safeTransfer(msg.sender, amountOutAfterFee);
        
        emit TokenToTokenSwap(msg.sender, tokenIn, tokenOut, amountIn, amountOutAfterFee, tradingFee + liquidityFee);
    }
    
    /**
     * @dev Add liquidity to token pool
     */
    function addTokenLiquidity(uint256 coinAAmount, uint256 coinBAmount, bytes32 txHash) 
        external 
        nonReentrant
        withinDeadline(txHash)
    {
        require(coinAAmount > 0 && coinBAmount > 0, "Invalid amounts");
        require(coinA.balanceOf(msg.sender) >= coinAAmount, "Insufficient CoinA balance");
        require(coinB.balanceOf(msg.sender) >= coinBAmount, "Insufficient CoinB balance");
        
        uint256 liquidityMinted;
        
        if (tokenPool.totalLiquidity == 0) {
            liquidityMinted = sqrt(coinAAmount * coinBAmount);
            require(liquidityMinted > 1000, "Insufficient liquidity minted");
            tokenPool.totalLiquidity = liquidityMinted - 1000; // Lock minimum liquidity
        } else {
            uint256 coinALiquidity = (coinAAmount * tokenPool.totalLiquidity) / tokenPool.coinAReserve;
            uint256 coinBLiquidity = (coinBAmount * tokenPool.totalLiquidity) / tokenPool.coinBReserve;
            liquidityMinted = coinALiquidity < coinBLiquidity ? coinALiquidity : coinBLiquidity;
        }
        
        require(liquidityMinted > 0, "Insufficient liquidity minted");
        
        // Transfer tokens
        coinA.safeTransferFrom(msg.sender, address(this), coinAAmount);
        coinB.safeTransferFrom(msg.sender, address(this), coinBAmount);
        
        // Update pool
        tokenPool.coinAReserve += coinAAmount;
        tokenPool.coinBReserve += coinBAmount;
        tokenPool.totalLiquidity += liquidityMinted;
        tokenPool.liquidity[msg.sender] += liquidityMinted;
        
        emit LiquidityAdded(msg.sender, address(0), coinAAmount, coinBAmount, liquidityMinted);
    }
    
    /**
     * @dev Withdraw accumulated fees for liquidity providers
     */
    function withdrawFees(address token) external nonReentrant {
        require(token == address(coinA) || token == address(coinB) || token == address(0), "Invalid token");
        
        uint256 feeAmount;
        
        if (token == address(0)) {
            // Token pool fees
            require(tokenPool.liquidity[msg.sender] > 0, "No liquidity provided");
            
            uint256 userShare = (tokenPool.liquidity[msg.sender] * tokenPool.totalFeeCollected) / tokenPool.totalLiquidity;
            feeAmount = userShare - tokenPool.feeDebt[msg.sender];
            
            if (feeAmount > 0) {
                tokenPool.feeDebt[msg.sender] += feeAmount;
                // Split fee between CoinA and CoinB
                uint256 coinAFee = feeAmount / 2;
                uint256 coinBFee = feeAmount - coinAFee;
                
                coinA.safeTransfer(msg.sender, coinAFee);
                coinB.safeTransfer(msg.sender, coinBFee);
            }
        } else {
            // ETH/Token pool fees
            Pool storage pool = pools[token];
            require(pool.liquidity[msg.sender] > 0, "No liquidity provided");
            
            uint256 userShare = (pool.liquidity[msg.sender] * pool.totalFeeCollected) / pool.totalLiquidity;
            feeAmount = userShare - pool.feeDebt[msg.sender];
            
            if (feeAmount > 0) {
                pool.feeDebt[msg.sender] += feeAmount;
                payable(msg.sender).transfer(feeAmount);
            }
        }
        
        if (feeAmount > 0) {
            emit FeesWithdrawn(msg.sender, token, feeAmount);
        }
    }
    
    /**
     * @dev Calculate square root (for geometric mean)
     */
    function sqrt(uint256 x) internal pure returns (uint256 y) {
        uint256 z = (x + 1) / 2;
        y = x;
        while (z < y) {
            y = z;
            z = (x / z + z) / 2;
        }
    }
    
    /**
     * @dev Enhanced AMM formula with improved precision
     */
    function getAmountOut(uint256 amountIn, uint256 reserveIn, uint256 reserveOut) 
        public 
        pure 
        returns (uint256 amountOut) 
    {
        require(amountIn > 0, "Amount in must be > 0");
        require(reserveIn > 0 && reserveOut > 0, "Insufficient liquidity");
        
        uint256 numerator = amountIn * reserveOut;
        uint256 denominator = reserveIn + amountIn;
        amountOut = numerator / denominator;
    }
    
    /**
     * @dev Get comprehensive pool information
     */
    function getPoolInfo() 
        external 
        view 
        returns (
            uint256 ethCoinAReserve, 
            uint256 coinAReserve, 
            uint256 ethCoinBReserve, 
            uint256 coinBReserve, 
            uint256 tokenPoolCoinAReserve, 
            uint256 tokenPoolCoinBReserve,
            uint256 coinAFees,
            uint256 coinBFees,
            uint256 tokenPoolFees
        ) 
    {
        Pool storage poolA = pools[address(coinA)];
        Pool storage poolB = pools[address(coinB)];
        return (
            poolA.ethReserve,
            poolA.tokenReserve,
            poolB.ethReserve,
            poolB.tokenReserve,
            tokenPool.coinAReserve,
            tokenPool.coinBReserve,
            poolA.totalFeeCollected,
            poolB.totalFeeCollected,
            tokenPool.totalFeeCollected
        );
    }
    
    /**
     * @dev Get user's total earnings from fees
     */
    function getUserFeeEarnings(address user, address token) 
        external 
        view 
        returns (uint256 pendingFees) 
    {
        if (token == address(0)) {
            if (tokenPool.liquidity[user] > 0 && tokenPool.totalLiquidity > 0) {
                uint256 userShare = (tokenPool.liquidity[user] * tokenPool.totalFeeCollected) / tokenPool.totalLiquidity;
                pendingFees = userShare - tokenPool.feeDebt[user];
            }
        } else {
            Pool storage pool = pools[token];
            if (pool.liquidity[user] > 0 && pool.totalLiquidity > 0) {
                uint256 userShare = (pool.liquidity[user] * pool.totalFeeCollected) / pool.totalLiquidity;
                pendingFees = userShare - pool.feeDebt[user];
            }
        }
    }
    
    /**
     * @dev Get user liquidity information
     */
    function getUserLiquidity(address token) 
        external 
        view 
        returns (uint256 userLiquidity) 
    {
        return pools[token].liquidity[msg.sender];
    }
    
    /**
     * @dev Get token pool user liquidity
     */
    function getTokenPoolUserLiquidity() 
        external 
        view 
        returns (uint256 userLiquidity) 
    {
        return tokenPool.liquidity[msg.sender];
    }
    
    /**
     * @dev Emergency functions
     */
    function emergencyWithdraw() external onlyOwner {
        payable(owner()).transfer(address(this).balance);
    }
    
    /**
     * @dev Update minimum liquidity lock time
     */
    function setMinLiquidityLockTime(uint256 _newLockTime) external onlyOwner {
        require(_newLockTime <= 7 days, "Lock time too long");
        minLiquidityLockTime = _newLockTime;
    }
}