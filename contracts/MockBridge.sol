// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title MockBridge
 * @dev Mock bridge contract for cross-chain token transfers
 * Simulates bridging between Sepolia and Arbitrum Sepolia
 */
contract MockBridge is ReentrancyGuard, Ownable {
    using SafeERC20 for IERC20;
    
    // Supported tokens
    IERC20 public immutable coinA;
    IERC20 public immutable coinB;
    
    // Bridge configuration
    uint256 public constant BRIDGE_FEE = 0.001 ether; // 0.001 ETH bridge fee
    uint256 public constant MIN_BRIDGE_AMOUNT = 1000; // Minimum bridge amount (in wei)
    
    // Bridge requests
    struct BridgeRequest {
        address user;
        address token;
        uint256 amount;
        uint256 targetChainId;
        uint256 timestamp;
        bool processed;
    }
    
    mapping(bytes32 => BridgeRequest) public bridgeRequests;
    mapping(address => uint256) public userNonce;
    
    // Events
    event BridgeInitiated(
        bytes32 indexed requestId,
        address indexed user,
        address indexed token,
        uint256 amount,
        uint256 targetChainId
    );
    
    event BridgeCompleted(
        bytes32 indexed requestId,
        address indexed user,
        address indexed token,
        uint256 amount
    );
    
    constructor(address _coinA, address _coinB, address initialOwner) Ownable(initialOwner) {
        coinA = IERC20(_coinA);
        coinB = IERC20(_coinB);
    }
    
    /**
     * @dev Initiate bridge transfer
     * @param token Token to bridge
     * @param amount Amount to bridge
     * @param targetChainId Target chain ID
     */
    function initiateBridge(
        address token,
        uint256 amount,
        uint256 targetChainId
    ) external payable nonReentrant {
        require(token == address(coinA) || token == address(coinB), "Unsupported token");
        require(amount >= MIN_BRIDGE_AMOUNT, "Amount too small");
        require(msg.value >= BRIDGE_FEE, "Insufficient bridge fee");
        require(targetChainId != block.chainid, "Cannot bridge to same chain");
        
        IERC20 tokenContract = IERC20(token);
        require(tokenContract.balanceOf(msg.sender) >= amount, "Insufficient token balance");
        
        // Generate unique request ID
        bytes32 requestId = keccak256(abi.encodePacked(
            msg.sender,
            token,
            amount,
            targetChainId,
            userNonce[msg.sender],
            block.timestamp
        ));
        
        // Lock tokens in contract
        tokenContract.safeTransferFrom(msg.sender, address(this), amount);
        
        // Store bridge request
        bridgeRequests[requestId] = BridgeRequest({
            user: msg.sender,
            token: token,
            amount: amount,
            targetChainId: targetChainId,
            timestamp: block.timestamp,
            processed: false
        });
        
        // Increment user nonce
        userNonce[msg.sender]++;
        
        emit BridgeInitiated(requestId, msg.sender, token, amount, targetChainId);
    }
    
    /**
     * @dev Complete bridge transfer (mock implementation)
     * @param requestId Bridge request ID
     */
    function completeBridge(bytes32 requestId) external onlyOwner {
        BridgeRequest storage request = bridgeRequests[requestId];
        require(request.user != address(0), "Request not found");
        require(!request.processed, "Already processed");
        require(block.timestamp >= request.timestamp + 1 minutes, "Too early to process");
        
        // Mark as processed
        request.processed = true;
        
        // In a real bridge, tokens would be minted on target chain
        // For this mock, we'll just unlock the tokens back to user
        IERC20(request.token).safeTransfer(request.user, request.amount);
        
        emit BridgeCompleted(requestId, request.user, request.token, request.amount);
    }
    
    /**
     * @dev Cancel bridge request (if not processed within 24 hours)
     * @param requestId Bridge request ID
     */
    function cancelBridge(bytes32 requestId) external nonReentrant {
        BridgeRequest storage request = bridgeRequests[requestId];
        require(request.user == msg.sender, "Not your request");
        require(!request.processed, "Already processed");
        require(block.timestamp >= request.timestamp + 24 hours, "Cannot cancel yet");
        
        // Mark as processed to prevent double spending
        request.processed = true;
        
        // Return tokens to user
        IERC20(request.token).safeTransfer(request.user, request.amount);
        
        // Return bridge fee (minus gas costs)
        payable(msg.sender).transfer(BRIDGE_FEE / 2);
    }
    
    /**
     * @dev Get bridge request details
     * @param requestId Bridge request ID
     */
    function getBridgeRequest(bytes32 requestId) 
        external 
        view 
        returns (
            address user,
            address token,
            uint256 amount,
            uint256 targetChainId,
            uint256 timestamp,
            bool processed
        ) 
    {
        BridgeRequest storage request = bridgeRequests[requestId];
        return (
            request.user,
            request.token,
            request.amount,
            request.targetChainId,
            request.timestamp,
            request.processed
        );
    }
    
    /**
     * @dev Withdraw bridge fees
     */
    function withdrawFees() external onlyOwner {
        payable(owner()).transfer(address(this).balance);
    }
    
    /**
     * @dev Emergency token recovery
     */
    function emergencyWithdraw(address token) external onlyOwner {
        IERC20(token).safeTransfer(owner(), IERC20(token).balanceOf(address(this)));
    }
}