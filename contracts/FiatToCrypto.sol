// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";

contract FiatToCrypto is ReentrancyGuard, Ownable {
    using SafeMath for uint256;
    
    address public companyWallet;
    uint256 public constant FEE_RATE = 50; // 0.5%
    uint256 public constant FEE_DENOMINATOR = 10000;
    
    // Exchange rates (in wei per unit of fiat currency)
    // For example: 1 USD = 0.0005 ETH (500000000000000 wei)
    mapping(string => uint256) public exchangeRates; // currency => rate in wei
    
    struct Purchase {
        address buyer;
        string currency;
        uint256 fiatAmount;
        uint256 ethAmount;
        uint256 timestamp;
        string paymentId;
        bool completed;
    }
    
    mapping(string => Purchase) public purchases; // paymentId => Purchase
    mapping(address => string[]) public userPurchases;
    
    event PurchaseInitiated(string indexed paymentId, address indexed buyer, string currency, uint256 fiatAmount, uint256 ethAmount);
    event PurchaseCompleted(string indexed paymentId, address indexed buyer, uint256 ethAmount);
    event ExchangeRateUpdated(string currency, uint256 rate);
    
    constructor(address _companyWallet) {
        companyWallet = _companyWallet;
        
        // Initialize with default rates (these should be updated regularly)
        exchangeRates["INR"] = 20000000000000; // 1 INR = 0.00002 ETH (example rate)
        exchangeRates["USD"] = 500000000000000; // 1 USD = 0.0005 ETH (example rate)
    }
    
    // Initiate a fiat to crypto purchase
    function initiatePurchase(
        string memory currency,
        uint256 fiatAmount,
        string memory paymentId
    ) external nonReentrant {
        require(bytes(paymentId).length > 0, "Invalid payment ID");
        require(fiatAmount > 0, "Invalid fiat amount");
        require(exchangeRates[currency] > 0, "Currency not supported");
        require(purchases[paymentId].buyer == address(0), "Payment ID already exists");
        
        uint256 ethAmount = fiatAmount.mul(exchangeRates[currency]).div(1e18);
        require(ethAmount > 0, "ETH amount too small");
        
        purchases[paymentId] = Purchase({
            buyer: msg.sender,
            currency: currency,
            fiatAmount: fiatAmount,
            ethAmount: ethAmount,
            timestamp: block.timestamp,
            paymentId: paymentId,
            completed: false
        });
        
        userPurchases[msg.sender].push(paymentId);
        
        emit PurchaseInitiated(paymentId, msg.sender, currency, fiatAmount, ethAmount);
    }
    
    // Complete a purchase (called by backend after payment confirmation)
    function completePurchase(string memory paymentId) external onlyOwner nonReentrant {
        Purchase storage purchase = purchases[paymentId];
        require(purchase.buyer != address(0), "Purchase not found");
        require(!purchase.completed, "Purchase already completed");
        require(address(this).balance >= purchase.ethAmount, "Insufficient contract balance");
        
        purchase.completed = true;
        
        uint256 fee = purchase.ethAmount.mul(FEE_RATE).div(FEE_DENOMINATOR);
        uint256 ethAfterFee = purchase.ethAmount.sub(fee);
        
        // Transfer ETH to buyer
        payable(purchase.buyer).transfer(ethAfterFee);
        
        // Transfer fee to company wallet
        payable(companyWallet).transfer(fee);
        
        emit PurchaseCompleted(paymentId, purchase.buyer, ethAfterFee);
    }
    
    // Update exchange rate
    function updateExchangeRate(string memory currency, uint256 rate) external onlyOwner {
        exchangeRates[currency] = rate;
        emit ExchangeRateUpdated(currency, rate);
    }
    
    // Get user's purchases
    function getUserPurchases(address user) external view returns (string[] memory) {
        return userPurchases[user];
    }
    
    // Get purchase details
    function getPurchase(string memory paymentId) external view returns (
        address buyer,
        string memory currency,
        uint256 fiatAmount,
        uint256 ethAmount,
        uint256 timestamp,
        bool completed
    ) {
        Purchase memory purchase = purchases[paymentId];
        return (
            purchase.buyer,
            purchase.currency,
            purchase.fiatAmount,
            purchase.ethAmount,
            purchase.timestamp,
            purchase.completed
        );
    }
    
    // Fund the contract with ETH
    function fundContract() external payable onlyOwner {
        // Allow owner to fund the contract with ETH for purchases
    }
    
    // Emergency withdrawal
    function emergencyWithdraw() external onlyOwner {
        payable(companyWallet).transfer(address(this).balance);
    }
    
    // Update company wallet
    function updateCompanyWallet(address newWallet) external onlyOwner {
        companyWallet = newWallet;
    }
    
    receive() external payable {}
}