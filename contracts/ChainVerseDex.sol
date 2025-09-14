// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";

contract ChainVerseDEX is ReentrancyGuard, Ownable {
    using SafeERC20 for IERC20;
    using SafeMath for uint256;
    
    // Company wallet for collecting fees
    address public companyWallet;
    uint256 public constant FEE_RATE = 50; // 0.5% = 50/10000
    uint256 public constant FEE_DENOMINATOR = 10000;
    
    // Liquidity pools
    struct LiquidityPool {
        address token;
        uint256 ethReserve;
        uint256 tokenReserve;
        uint256 totalLiquidity;
        mapping(address => uint256) liquidity;
    }
    
    // Limit orders
    struct LimitOrder {
        address trader;
        address token;
        bool isBuyOrder; // true for buy, false for sell
        uint256 amount;
        uint256 price; // price in wei per token
        uint256 timestamp;
        bool isActive;
    }
    
    mapping(address => LiquidityPool) public pools;
    mapping(uint256 => LimitOrder) public limitOrders;
    mapping(address => uint256[]) public userOrders;
    
    address[] public supportedTokens;
    uint256 public nextOrderId = 1;
    
    // Events
    event LiquidityAdded(address indexed provider, address indexed token, uint256 ethAmount, uint256 tokenAmount);
    event LiquidityRemoved(address indexed provider, address indexed token, uint256 ethAmount, uint256 tokenAmount);
    event TokenSwapped(address indexed user, address indexed tokenIn, address indexed tokenOut, uint256 amountIn, uint256 amountOut);
    event LimitOrderCreated(uint256 indexed orderId, address indexed trader, address indexed token, bool isBuyOrder, uint256 amount, uint256 price);
    event LimitOrderExecuted(uint256 indexed orderId, address indexed executor);
    event LimitOrderCancelled(uint256 indexed orderId, address indexed trader);
    event FeeCollected(address indexed token, uint256 amount);
    
    constructor(address _companyWallet) {
        companyWallet = _companyWallet;
    }
    
    // Add supported token
    function addSupportedToken(address token) external onlyOwner {
        require(token != address(0), "Invalid token address");
        supportedTokens.push(token);
        
        // Initialize pool
        pools[token].token = token;
    }
    
    // Add liquidity to ETH/Token pool
    function addLiquidity(address token, uint256 tokenAmount) 
        external 
        payable 
        nonReentrant 
    {
        require(msg.value > 0 && tokenAmount > 0, "Invalid amounts");
        require(pools[token].token != address(0), "Token not supported");
        
        LiquidityPool storage pool = pools[token];
        
        uint256 ethAmount = msg.value;
        uint256 liquidity;
        
        if (pool.totalLiquidity == 0) {
            // First liquidity provider
            liquidity = sqrt(ethAmount.mul(tokenAmount));
        } else {
            // Calculate proportional liquidity
            uint256 ethLiquidity = ethAmount.mul(pool.totalLiquidity).div(pool.ethReserve);
            uint256 tokenLiquidity = tokenAmount.mul(pool.totalLiquidity).div(pool.tokenReserve);
            liquidity = ethLiquidity < tokenLiquidity ? ethLiquidity : tokenLiquidity;
        }
        
        require(liquidity > 0, "Insufficient liquidity minted");
        
        // Transfer tokens from user
        IERC20(token).safeTransferFrom(msg.sender, address(this), tokenAmount);
        
        // Update pool reserves
        pool.ethReserve = pool.ethReserve.add(ethAmount);
        pool.tokenReserve = pool.tokenReserve.add(tokenAmount);
        pool.totalLiquidity = pool.totalLiquidity.add(liquidity);
        pool.liquidity[msg.sender] = pool.liquidity[msg.sender].add(liquidity);
        
        emit LiquidityAdded(msg.sender, token, ethAmount, tokenAmount);
    }
    
    // Remove liquidity from ETH/Token pool
    function removeLiquidity(address token, uint256 liquidity) 
        external 
        nonReentrant 
    {
        require(liquidity > 0, "Invalid liquidity amount");
        
        LiquidityPool storage pool = pools[token];
        require(pool.liquidity[msg.sender] >= liquidity, "Insufficient liquidity balance");
        
        uint256 ethAmount = liquidity.mul(pool.ethReserve).div(pool.totalLiquidity);
        uint256 tokenAmount = liquidity.mul(pool.tokenReserve).div(pool.totalLiquidity);
        
        require(ethAmount > 0 && tokenAmount > 0, "Insufficient liquidity burned");
        
        // Update pool reserves
        pool.ethReserve = pool.ethReserve.sub(ethAmount);
        pool.tokenReserve = pool.tokenReserve.sub(tokenAmount);
        pool.totalLiquidity = pool.totalLiquidity.sub(liquidity);
        pool.liquidity[msg.sender] = pool.liquidity[msg.sender].sub(liquidity);
        
        // Transfer assets back to user
        payable(msg.sender).transfer(ethAmount);
        IERC20(token).safeTransfer(msg.sender, tokenAmount);
        
        emit LiquidityRemoved(msg.sender, token, ethAmount, tokenAmount);
    }
    
    // Swap ETH for tokens
    function swapETHForTokens(address token, uint256 minTokens) 
        external 
        payable 
        nonReentrant 
    {
        require(msg.value > 0, "Invalid ETH amount");
        require(pools[token].token != address(0), "Token not supported");
        
        LiquidityPool storage pool = pools[token];
        require(pool.ethReserve > 0 && pool.tokenReserve > 0, "Pool not initialized");
        
        uint256 ethAmount = msg.value;
        uint256 fee = ethAmount.mul(FEE_RATE).div(FEE_DENOMINATOR);
        uint256 ethAfterFee = ethAmount.sub(fee);
        
        uint256 tokenAmount = getAmountOut(ethAfterFee, pool.ethReserve, pool.tokenReserve);
        require(tokenAmount >= minTokens, "Insufficient output amount");
        
        // Update pool reserves
        pool.ethReserve = pool.ethReserve.add(ethAfterFee);
        pool.tokenReserve = pool.tokenReserve.sub(tokenAmount);
        
        // Transfer fee to company wallet
        payable(companyWallet).transfer(fee);
        
        // Transfer tokens to user
        IERC20(token).safeTransfer(msg.sender, tokenAmount);
        
        emit TokenSwapped(msg.sender, address(0), token, ethAmount, tokenAmount);
        emit FeeCollected(address(0), fee);
    }
    
    // Swap tokens for ETH
    function swapTokensForETH(address token, uint256 tokenAmount, uint256 minETH) 
        external 
        nonReentrant 
    {
        require(tokenAmount > 0, "Invalid token amount");
        require(pools[token].token != address(0), "Token not supported");
        
        LiquidityPool storage pool = pools[token];
        require(pool.ethReserve > 0 && pool.tokenReserve > 0, "Pool not initialized");
        
        uint256 ethAmount = getAmountOut(tokenAmount, pool.tokenReserve, pool.ethReserve);
        uint256 fee = ethAmount.mul(FEE_RATE).div(FEE_DENOMINATOR);
        uint256 ethAfterFee = ethAmount.sub(fee);
        
        require(ethAfterFee >= minETH, "Insufficient output amount");
        
        // Transfer tokens from user
        IERC20(token).safeTransferFrom(msg.sender, address(this), tokenAmount);
        
        // Update pool reserves
        pool.tokenReserve = pool.tokenReserve.add(tokenAmount);
        pool.ethReserve = pool.ethReserve.sub(ethAmount);
        
        // Transfer fee to company wallet
        payable(companyWallet).transfer(fee);
        
        // Transfer ETH to user
        payable(msg.sender).transfer(ethAfterFee);
        
        emit TokenSwapped(msg.sender, token, address(0), tokenAmount, ethAfterFee);
        emit FeeCollected(address(0), fee);
    }
    
    // Create limit order
    function createLimitOrder(
        address token,
        bool isBuyOrder,
        uint256 amount,
        uint256 price
    ) external payable nonReentrant {
        require(pools[token].token != address(0), "Token not supported");
        require(amount > 0 && price > 0, "Invalid parameters");
        
        if (isBuyOrder) {
            uint256 totalCost = amount.mul(price).div(1e18);
            require(msg.value >= totalCost, "Insufficient ETH for buy order");
        } else {
            IERC20(token).safeTransferFrom(msg.sender, address(this), amount);
        }
        
        uint256 orderId = nextOrderId++;
        limitOrders[orderId] = LimitOrder({
            trader: msg.sender,
            token: token,
            isBuyOrder: isBuyOrder,
            amount: amount,
            price: price,
            timestamp: block.timestamp,
            isActive: true
        });
        
        userOrders[msg.sender].push(orderId);
        
        emit LimitOrderCreated(orderId, msg.sender, token, isBuyOrder, amount, price);
    }
    
    // Execute limit order
    function executeLimitOrder(uint256 orderId) external nonReentrant {
        LimitOrder storage order = limitOrders[orderId];
        require(order.isActive, "Order not active");
        
        LiquidityPool storage pool = pools[order.token];
        uint256 currentPrice = getCurrentPrice(order.token);
        
        bool canExecute = false;
        if (order.isBuyOrder && currentPrice <= order.price) {
            canExecute = true;
        } else if (!order.isBuyOrder && currentPrice >= order.price) {
            canExecute = true;
        }
        
        require(canExecute, "Order cannot be executed at current price");
        
        order.isActive = false;
        
        if (order.isBuyOrder) {
            uint256 totalCost = order.amount.mul(order.price).div(1e18);
            uint256 fee = totalCost.mul(FEE_RATE).div(FEE_DENOMINATOR);
            
            IERC20(order.token).safeTransfer(order.trader, order.amount);
            payable(companyWallet).transfer(fee);
            payable(msg.sender).transfer(totalCost.sub(fee));
        } else {
            uint256 ethAmount = order.amount.mul(order.price).div(1e18);
            uint256 fee = ethAmount.mul(FEE_RATE).div(FEE_DENOMINATOR);
            
            payable(order.trader).transfer(ethAmount.sub(fee));
            payable(companyWallet).transfer(fee);
        }
        
        emit LimitOrderExecuted(orderId, msg.sender);
        emit FeeCollected(order.isBuyOrder ? address(0) : order.token, 
                         order.isBuyOrder ? order.amount.mul(order.price).div(1e18).mul(FEE_RATE).div(FEE_DENOMINATOR) : 
                         order.amount.mul(FEE_RATE).div(FEE_DENOMINATOR));
    }
    
    // Cancel limit order
    function cancelLimitOrder(uint256 orderId) external nonReentrant {
        LimitOrder storage order = limitOrders[orderId];
        require(order.trader == msg.sender, "Not your order");
        require(order.isActive, "Order not active");
        
        order.isActive = false;
        
        if (order.isBuyOrder) {
            uint256 totalCost = order.amount.mul(order.price).div(1e18);
            payable(msg.sender).transfer(totalCost);
        } else {
            IERC20(order.token).safeTransfer(msg.sender, order.amount);
        }
        
        emit LimitOrderCancelled(orderId, msg.sender);
    }
    
    // Calculate output amount for AMM
    function getAmountOut(uint256 amountIn, uint256 reserveIn, uint256 reserveOut) 
        public 
        pure 
        returns (uint256 amountOut) 
    {
        require(amountIn > 0, "Insufficient input amount");
        require(reserveIn > 0 && reserveOut > 0, "Insufficient liquidity");
        
        uint256 amountInWithFee = amountIn.mul(997);
        uint256 numerator = amountInWithFee.mul(reserveOut);
        uint256 denominator = reserveIn.mul(1000).add(amountInWithFee);
        amountOut = numerator.div(denominator);
    }
    
    // Get current price of token in ETH
    function getCurrentPrice(address token) public view returns (uint256) {
        LiquidityPool storage pool = pools[token];
        if (pool.tokenReserve == 0) return 0;
        return pool.ethReserve.mul(1e18).div(pool.tokenReserve);
    }
    
    // Get user's liquidity balance
    function getUserLiquidity(address token, address user) external view returns (uint256) {
        return pools[token].liquidity[user];
    }
    
    // Get user's orders
    function getUserOrders(address user) external view returns (uint256[] memory) {
        return userOrders[user];
    }
    
    // Get pool information
    function getPoolInfo(address token) external view returns (
        uint256 ethReserve,
        uint256 tokenReserve,
        uint256 totalLiquidity
    ) {
        LiquidityPool storage pool = pools[token];
        return (pool.ethReserve, pool.tokenReserve, pool.totalLiquidity);
    }
    
    // Update company wallet
    function updateCompanyWallet(address newWallet) external onlyOwner {
        companyWallet = newWallet;
    }
    
    // Withdraw accumulated fees (emergency function)
    function withdrawFees() external onlyOwner {
        payable(companyWallet).transfer(address(this).balance);
    }
    
    // Square root function for liquidity calculation
    function sqrt(uint256 x) internal pure returns (uint256 y) {
        uint256 z = (x + 1) / 2;
        y = x;
        while (z < y) {
            y = z;
            z = (x / z + z) / 2;
        }
    }
    
    // Receive function to accept ETH
    receive() external payable {}
}