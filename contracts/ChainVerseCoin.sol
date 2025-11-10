// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";

contract ChainVerseCoin is ERC20, Ownable, Pausable {
    uint256 public constant INITIAL_SUPPLY = 1000000000 * 10**18; // 1 billion CVC
    address public constant COMPANY_WALLET = 0xcc5d972ee1e4abe7d1d6b5fed1349ae4913cd423;
    
    // Conversion fee (in wei)
    uint256 public claimFee = 0.001 ether; // 0.001 ETH fee
    
    // Events
    event TokensClaimed(address indexed user, uint256 amount, uint256 fee);
    event ClaimFeeUpdated(uint256 oldFee, uint256 newFee);
    
    constructor() ERC20("ChainVerse Coin", "CVC") {
        _mint(owner(), INITIAL_SUPPLY);
    }
    
    // Function to claim tokens with fee
    function claimTokens(address to, uint256 amount) external payable whenNotPaused {
        require(msg.value >= claimFee, "Insufficient fee");
        require(amount > 0, "Amount must be greater than 0");
        require(balanceOf(owner()) >= amount, "Insufficient tokens in contract");
        
        // Transfer fee to company wallet
        (bool success,) = COMPANY_WALLET.call{value: msg.value}("");
        require(success, "Fee transfer failed");
        
        // Transfer tokens from owner to user
        _transfer(owner(), to, amount);
        
        emit TokensClaimed(to, amount, msg.value);
    }
    
    // Owner functions
    function updateClaimFee(uint256 newFee) external onlyOwner {
        uint256 oldFee = claimFee;
        claimFee = newFee;
        emit ClaimFeeUpdated(oldFee, newFee);
    }
    
    function mint(address to, uint256 amount) external onlyOwner {
        _mint(to, amount);
    }
    
    function burn(uint256 amount) external onlyOwner {
        _burn(msg.sender, amount);
    }
    
    function pause() external onlyOwner {
        _pause();
    }
    
    function unpause() external onlyOwner {
        _unpause();
    }
    
    // Emergency withdrawal
    function emergencyWithdraw() external onlyOwner {
        uint256 balance = address(this).balance;
        (bool success,) = owner().call{value: balance}("");
        require(success, "Withdrawal failed");
    }
}