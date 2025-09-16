// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title DEX
 * @dev Decentralized Exchange with AMM functionality
 * Supports ETH ↔ CoinA, ETH ↔ CoinB, and CoinA ↔ CoinB swaps
 * Uses x * y = k formula for pricing
 */
contract DEX is ReentrancyGuard, Ownable {
    using SafeERC20 for IERC20;
    
    // Tokens
    IERC20 public immutable coinA;
    IERC20 public immutable coinB;
    
    // Company wallet for fees (corrected checksum)
    address public constant COMPANY_WALLET = 0xcc5d972Ee1e4abe7d1d6b5FEd1349ae4913cd423;
    
    // Liquidity pools
    struct Pool {
        uint256 ethReserve;
        uint256 tokenReserve;
        uint256 totalLiquidity;
        mapping(address => uint256) liquidity;
    }
    
    mapping(address => Pool) public pools; // token address => Pool
    
    // Token-to-token pool (CoinA ↔ CoinB)
    struct TokenPool {
        uint256 coinAReserve;
        uint256 coinBReserve;
        uint256 totalLiquidity;
        mapping(address => uint256) liquidity;
    }
    
    TokenPool public tokenPool;
    
    // Fee configuration
    uint256 public constant FEE_PERCENT = 50; // 0.5% = 50/10000
    uint256 public constant PERCENT_BASE = 10000;
    
    // Events
    event EthToTokenSwap(address indexed user, address indexed token, uint256 ethIn, uint256 tokensOut);
    event TokenToEthSwap(address indexed user, address indexed token, uint256 tokensIn, uint256 ethOut);
    event TokenToTokenSwap(address indexed user, uint256 tokenAIn, uint256 tokenBOut);
    event LiquidityAdded(address indexed user, address indexed token, uint256 ethAmount, uint256 tokenAmount);
    event LiquidityRemoved(address indexed user, address indexed token, uint256 ethAmount, uint256 tokenAmount);
    event FeeCollected(address indexed token, uint256 amount);
    
    constructor(address _coinA, address _coinB, address initialOwner) Ownable(initialOwner) {
        coinA = IERC20(_coinA);
        coinB = IERC20(_coinB);
    }
    
    /**
     * @dev Add liquidity to ETH/Token pool
     * @param token Address of the token
     * @param tokenAmount Amount of tokens to add
     */
    function addLiquidity(address token, uint256 tokenAmount) 
        external 
        payable 
        nonReentrant 
    {
        require(token == address(coinA) || token == address(coinB), "Invalid token");
        require(msg.value > 0 && tokenAmount > 0, "Invalid amounts");
        
        Pool storage pool = pools[token];
        IERC20 tokenContract = IERC20(token);
        
        require(tokenContract.balanceOf(msg.sender) >= tokenAmount, "Insufficient token balance");
        
        uint256 liquidityMinted;
        
        if (pool.totalLiquidity == 0) {
            // First liquidity provider
            liquidityMinted = msg.value;
        } else {
            // Calculate liquidity based on existing ratio
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
        
        emit LiquidityAdded(msg.sender, token, msg.value, tokenAmount);
    }
    
    /**
     * @dev Remove liquidity from ETH/Token pool
     * @param token Address of the token
     * @param liquidityAmount Amount of liquidity to remove
     */
    function removeLiquidity(address token, uint256 liquidityAmount) 
        external 
        nonReentrant 
    {
        require(token == address(coinA) || token == address(coinB), "Invalid token");
        
        Pool storage pool = pools[token];
        require(pool.liquidity[msg.sender] >= liquidityAmount, "Insufficient liquidity");
        require(pool.totalLiquidity > 0, "No liquidity");
        
        // Calculate amounts to return
        uint256 ethAmount = (liquidityAmount * pool.ethReserve) / pool.totalLiquidity;
        uint256 tokenAmount = (liquidityAmount * pool.tokenReserve) / pool.totalLiquidity;
        
        require(ethAmount > 0 && tokenAmount > 0, "Invalid withdrawal amounts");
        
        // Update pool
        pool.ethReserve -= ethAmount;
        pool.tokenReserve -= tokenAmount;
        pool.totalLiquidity -= liquidityAmount;
        pool.liquidity[msg.sender] -= liquidityAmount;
        
        // Transfer assets back to user
        payable(msg.sender).transfer(ethAmount);
        IERC20(token).safeTransfer(msg.sender, tokenAmount);
        
        emit LiquidityRemoved(msg.sender, token, ethAmount, tokenAmount);
    }
    
    /**
     * @dev Swap ETH for tokens
     * @param token Address of the token to receive
     * @param minTokens Minimum tokens to receive (slippage protection)
     */
    function swapEthForTokens(address token, uint256 minTokens) 
        external 
        payable 
        nonReentrant 
    {
        require(token == address(coinA) || token == address(coinB), "Invalid token");
        require(msg.value > 0, "ETH amount must be > 0");
        
        Pool storage pool = pools[token];
        require(pool.ethReserve > 0 && pool.tokenReserve > 0, "Insufficient liquidity");
        
        // Calculate tokens out using AMM formula: x * y = k
        uint256 ethAfterFee = msg.value - (msg.value * FEE_PERCENT / PERCENT_BASE);
        uint256 tokensOut = getAmountOut(ethAfterFee, pool.ethReserve, pool.tokenReserve);
        
        require(tokensOut >= minTokens, "Slippage too high");
        require(tokensOut < pool.tokenReserve, "Insufficient token liquidity");
        
        // Update pool reserves
        pool.ethReserve += ethAfterFee;
        pool.tokenReserve -= tokensOut;
        
        // Transfer fee to fee recipient
        uint256 fee = msg.value * FEE_PERCENT / PERCENT_BASE;
        if (fee > 0) {
            payable(COMPANY_WALLET).transfer(fee);
            emit FeeCollected(address(0), fee); // address(0) represents ETH
        }
        
        // Transfer tokens to user
        IERC20(token).safeTransfer(msg.sender, tokensOut);
        
        emit EthToTokenSwap(msg.sender, token, msg.value, tokensOut);
    }
    
    /**
     * @dev Swap tokens for ETH
     * @param token Address of the token to swap
     * @param tokenAmount Amount of tokens to swap
     * @param minEth Minimum ETH to receive (slippage protection)
     */
    function swapTokensForEth(address token, uint256 tokenAmount, uint256 minEth) 
        external 
        nonReentrant 
    {
        require(token == address(coinA) || token == address(coinB), "Invalid token");
        require(tokenAmount > 0, "Token amount must be > 0");
        
        Pool storage pool = pools[token];
        require(pool.ethReserve > 0 && pool.tokenReserve > 0, "Insufficient liquidity");
        
        IERC20 tokenContract = IERC20(token);
        require(tokenContract.balanceOf(msg.sender) >= tokenAmount, "Insufficient token balance");
        
        // Calculate ETH out using AMM formula
        uint256 ethOut = getAmountOut(tokenAmount, pool.tokenReserve, pool.ethReserve);
        uint256 ethAfterFee = ethOut - (ethOut * FEE_PERCENT / PERCENT_BASE);
        
        require(ethAfterFee >= minEth, "Slippage too high");
        require(ethOut < pool.ethReserve, "Insufficient ETH liquidity");
        
        // Transfer tokens from user
        tokenContract.safeTransferFrom(msg.sender, address(this), tokenAmount);
        
        // Update pool reserves
        pool.tokenReserve += tokenAmount;
        pool.ethReserve -= ethOut;
        
        // Transfer fee to fee recipient
        uint256 fee = ethOut * FEE_PERCENT / PERCENT_BASE;
        if (fee > 0) {
            payable(COMPANY_WALLET).transfer(fee);
            emit FeeCollected(address(0), fee); // address(0) represents ETH
        }
        
        // Transfer ETH to user
        payable(msg.sender).transfer(ethAfterFee);
        
        emit TokenToEthSwap(msg.sender, token, tokenAmount, ethAfterFee);
    }
    
    /**
     * @dev Swap CoinA for CoinB or vice versa
     * @param tokenIn Address of input token
     * @param tokenOut Address of output token
     * @param amountIn Amount of input tokens
     * @param minAmountOut Minimum output tokens (slippage protection)
     */
    function swapTokens(
        address tokenIn, 
        address tokenOut, 
        uint256 amountIn, 
        uint256 minAmountOut
    ) 
        external 
        nonReentrant 
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
            
            // Update reserves
            tokenPool.coinAReserve += amountIn;
            tokenPool.coinBReserve -= amountOut;
        } else {
            require(tokenPool.coinAReserve > 0 && tokenPool.coinBReserve > 0, "Insufficient liquidity");
            amountOut = getAmountOut(amountIn, tokenPool.coinBReserve, tokenPool.coinAReserve);
            require(amountOut < tokenPool.coinAReserve, "Insufficient CoinA liquidity");
            
            // Update reserves
            tokenPool.coinBReserve += amountIn;
            tokenPool.coinAReserve -= amountOut;
        }
        
        uint256 amountOutAfterFee = amountOut - (amountOut * FEE_PERCENT / PERCENT_BASE);
        require(amountOutAfterFee >= minAmountOut, "Slippage too high");
        
        // Transfer tokens
        tokenInContract.safeTransferFrom(msg.sender, address(this), amountIn);
        
        // Transfer fee to fee recipient
        uint256 fee = amountOut * FEE_PERCENT / PERCENT_BASE;
        if (fee > 0) {
            IERC20(tokenOut).safeTransfer(COMPANY_WALLET, fee);
            emit FeeCollected(tokenOut, fee);
        }
        
        IERC20(tokenOut).safeTransfer(msg.sender, amountOutAfterFee);
        
        emit TokenToTokenSwap(msg.sender, amountIn, amountOutAfterFee);
    }
    
    /**
     * @dev Add liquidity to CoinA/CoinB pool
     * @param coinAAmount Amount of CoinA to add
     * @param coinBAmount Amount of CoinB to add
     */
    function addTokenLiquidity(uint256 coinAAmount, uint256 coinBAmount) 
        external 
        nonReentrant 
    {
        require(coinAAmount > 0 && coinBAmount > 0, "Invalid amounts");
        require(coinA.balanceOf(msg.sender) >= coinAAmount, "Insufficient CoinA balance");
        require(coinB.balanceOf(msg.sender) >= coinBAmount, "Insufficient CoinB balance");
        
        uint256 liquidityMinted;
        
        if (tokenPool.totalLiquidity == 0) {
            // First liquidity provider
            liquidityMinted = coinAAmount;
        } else {
            // Calculate liquidity based on existing ratio
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
    }
    
    /**
     * @dev Calculate output amount for AMM swap
     * @param amountIn Input amount
     * @param reserveIn Input reserve
     * @param reserveOut Output reserve
     * @return amountOut Output amount
     */
    function getAmountOut(uint256 amountIn, uint256 reserveIn, uint256 reserveOut) 
        public 
        pure 
        returns (uint256 amountOut) 
    {
        require(amountIn > 0, "Amount in must be > 0");
        require(reserveIn > 0 && reserveOut > 0, "Insufficient liquidity");
        
        // AMM formula: (amountIn * reserveOut) / (reserveIn + amountIn)
        uint256 numerator = amountIn * reserveOut;
        uint256 denominator = reserveIn + amountIn;
        amountOut = numerator / denominator;
    }
    
    /**
     * @dev Get pool information for all pools
     * @return ethCoinAReserve ETH reserve for CoinA pool
     * @return coinAReserve CoinA reserve
     * @return ethCoinBReserve ETH reserve for CoinB pool
     * @return coinBReserve CoinB reserve
     * @return tokenPoolCoinAReserve CoinA reserve for token pool
     * @return tokenPoolCoinBReserve CoinB reserve for token pool
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
            uint256 tokenPoolCoinBReserve
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
            tokenPool.coinBReserve
        );
    }
    
    /**
     * @dev Get user liquidity for a specific pool
     * @param token Token address
     * @return userLiquidity User's liquidity amount
     */
    function getUserLiquidity(address token) 
        external 
        view 
        returns (uint256 userLiquidity) 
    {
        return pools[token].liquidity[msg.sender];
    }
    
    /**
     * @dev Get user liquidity for token pool (CoinA/CoinB)
     * @return userLiquidity User's liquidity amount
     */
    function getTokenPoolUserLiquidity() 
        external 
        view 
        returns (uint256 userLiquidity) 
    {
        return tokenPool.liquidity[msg.sender];
    }
    
    /**
     * @dev Emergency withdrawal function
     */
    function emergencyWithdraw() external onlyOwner {
        payable(owner()).transfer(address(this).balance);
    }
}