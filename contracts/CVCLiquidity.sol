// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

contract CVCLiquidity is Ownable, ReentrancyGuard {
    IERC20 public immutable cvcToken;
    
    uint256 public ethReserve;
    uint256 public cvcReserve;
    uint256 public totalLiquidity;
    
    mapping(address => uint256) public liquidityBalance;
    
    event LiquidityAdded(address indexed provider, uint256 ethAmount, uint256 cvcAmount, uint256 liquidity);
    event LiquidityRemoved(address indexed provider, uint256 ethAmount, uint256 cvcAmount, uint256 liquidity);
    event TokensSwapped(address indexed user, uint256 ethIn, uint256 cvcOut);
    
    constructor(address _cvcToken) {
        cvcToken = IERC20(_cvcToken);
    }
    
    function addLiquidity(uint256 cvcAmount) external payable onlyOwner nonReentrant {
        require(msg.value > 0 && cvcAmount > 0, "Invalid amounts");
        
        uint256 liquidity;
        
        if (totalLiquidity == 0) {
            // First liquidity provision
            liquidity = sqrt(msg.value * cvcAmount);
        } else {
            // Subsequent liquidity provisions
            uint256 ethLiquidity = (msg.value * totalLiquidity) / ethReserve;
            uint256 cvcLiquidity = (cvcAmount * totalLiquidity) / cvcReserve;
            liquidity = min(ethLiquidity, cvcLiquidity);
        }
        
        require(liquidity > 0, "Insufficient liquidity");
        
        // Transfer CVC tokens from admin
        require(cvcToken.transferFrom(msg.sender, address(this), cvcAmount), "CVC transfer failed");
        
        // Update reserves
        ethReserve += msg.value;
        cvcReserve += cvcAmount;
        totalLiquidity += liquidity;
        liquidityBalance[msg.sender] += liquidity;
        
        emit LiquidityAdded(msg.sender, msg.value, cvcAmount, liquidity);
    }
    
    function swapEthForCVC() external payable nonReentrant {
        require(msg.value > 0, "Invalid ETH amount");
        require(ethReserve > 0 && cvcReserve > 0, "No liquidity");
        
        uint256 cvcOut = getAmountOut(msg.value, ethReserve, cvcReserve);
        require(cvcOut > 0, "Insufficient output amount");
        require(cvcReserve >= cvcOut, "Insufficient CVC reserves");
        
        // Update reserves
        ethReserve += msg.value;
        cvcReserve -= cvcOut;
        
        // Transfer CVC to user
        require(cvcToken.transfer(msg.sender, cvcOut), "CVC transfer failed");
        
        emit TokensSwapped(msg.sender, msg.value, cvcOut);
    }
    
    function getAmountOut(uint256 amountIn, uint256 reserveIn, uint256 reserveOut) public pure returns (uint256) {
        require(amountIn > 0, "Invalid input amount");
        require(reserveIn > 0 && reserveOut > 0, "Invalid reserves");
        
        uint256 amountInWithFee = amountIn * 997; // 0.3% fee
        uint256 numerator = amountInWithFee * reserveOut;
        uint256 denominator = (reserveIn * 1000) + amountInWithFee;
        
        return numerator / denominator;
    }
    
    function getReserves() external view returns (uint256, uint256) {
        return (ethReserve, cvcReserve);
    }
    
    // Helper functions
    function sqrt(uint256 x) internal pure returns (uint256) {
        if (x == 0) return 0;
        uint256 z = (x + 1) / 2;
        uint256 y = x;
        while (z < y) {
            y = z;
            z = (x / z + z) / 2;
        }
        return y;
    }
    
    function min(uint256 a, uint256 b) internal pure returns (uint256) {
        return a < b ? a : b;
    }
    
    // Emergency functions
    function emergencyWithdraw() external onlyOwner {
        uint256 ethBalance = address(this).balance;
        uint256 cvcBalance = cvcToken.balanceOf(address(this));
        
        if (ethBalance > 0) {
            (bool success,) = owner().call{value: ethBalance}("");
            require(success, "ETH withdrawal failed");
        }
        
        if (cvcBalance > 0) {
            require(cvcToken.transfer(owner(), cvcBalance), "CVC withdrawal failed");
        }
    }
}