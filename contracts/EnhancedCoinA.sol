// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Permit.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title Enhanced CoinA
 * @dev Enhanced ERC20 token with metadata support for DEX
 */
contract EnhancedCoinA is ERC20, ERC20Permit, Ownable {
    uint256 public constant INITIAL_SUPPLY = 1000000 * 10**18; // 1M tokens
    
    // Token metadata
    string public description;
    string public imageURI;
    string public websiteURL;
    string public telegramURL;
    string public twitterURL;
    
    // Token economics
    uint256 public maxSupply = 10000000 * 10**18; // 10M max supply
    bool public mintingEnabled = true;
    
    event MetadataUpdated(string description, string imageURI);
    event SocialLinksUpdated(string website, string telegram, string twitter);
    
    constructor() 
        ERC20("NijasTP Coin", "NIJATP") 
        ERC20Permit("NijasTP Coin")
        Ownable(msg.sender) 
    {
        _mint(msg.sender, INITIAL_SUPPLY);
        
        // Default metadata
        description = "Enhanced CoinA - Premium trading token for advanced DEX operations";
        imageURI = "https://res.cloudinary.com/drmroxs00/image/upload/v1758624878/Screenshot_2025-09-23_162037_i3avgw.png";
        websiteURL = "https://example-coina.com";
        telegramURL = "https://t.me/enhancedcoina";
        twitterURL = "https://twitter.com/enhancedcoina";
    }
    
    /**
     * @dev Update token metadata
     */
    function updateMetadata(
        string memory _description,
        string memory _imageURI
    ) external onlyOwner {
        description = _description;
        imageURI = _imageURI;
        emit MetadataUpdated(_description, _imageURI);
    }
    
    /**
     * @dev Update social media links
     */
    function updateSocialLinks(
        string memory _websiteURL,
        string memory _telegramURL,
        string memory _twitterURL
    ) external onlyOwner {
        websiteURL = _websiteURL;
        telegramURL = _telegramURL;
        twitterURL = _twitterURL;
        emit SocialLinksUpdated(_websiteURL, _telegramURL, _twitterURL);
    }
    
    /**
     * @dev Mint new tokens with max supply check
     */
    function mint(address to, uint256 amount) external onlyOwner {
        require(mintingEnabled, "Minting is disabled");
        require(totalSupply() + amount <= maxSupply, "Exceeds max supply");
        _mint(to, amount);
    }
    
    /**
     * @dev Disable minting permanently
     */
    function disableMinting() external onlyOwner {
        mintingEnabled = false;
    }
    
    /**
     * @dev Burn tokens from caller's balance
     */
    function burn(uint256 amount) external {
        _burn(msg.sender, amount);
    }
    
    /**
     * @dev Get complete token info
     */
    function getTokenInfo() external view returns (
        string memory tokenName,
        string memory tokenSymbol,
        uint256 currentSupply,
        uint256 maxTokenSupply,
        uint8 tokenDecimals,
        string memory tokenDescription,
        string memory tokenImageURI,
        string memory tokenWebsiteURL,
        string memory tokenTelegramURL,
        string memory tokenTwitterURL
    ) {
        return (
            name(),              // ERC20 function
            symbol(),            // ERC20 function
            totalSupply(),       // ERC20 function
            maxSupply,           // state variable
            decimals(),          // ERC20 function
            description,
            imageURI,
            websiteURL,
            telegramURL,
            twitterURL
        );
    }
}
