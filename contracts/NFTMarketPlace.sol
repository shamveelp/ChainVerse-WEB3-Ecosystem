// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

contract NFTCollection is ERC721URIStorage, Ownable {
    using Counters for Counters.Counter;
    Counters.Counter private _tokenIds;
    
    // Address of the marketplace contract
    address public marketplaceAddress;
    
    constructor(address _marketplaceAddress) ERC721("ChainVerse NFT", "CVN") Ownable(msg.sender) {
        marketplaceAddress = _marketplaceAddress;
    }
    
    // Allow anyone to mint NFTs (not just owner)
    function mintNFT(address recipient, string memory tokenURI) public returns (uint256) {
        _tokenIds.increment();
        uint256 newItemId = _tokenIds.current();

        _mint(recipient, newItemId);
        _setTokenURI(newItemId, tokenURI);

        return newItemId;
    }
    
    // Batch mint function
    function mintBatch(address recipient, string[] memory tokenURIs) public returns (uint256[] memory) {
        uint256[] memory tokenIds = new uint256[](tokenURIs.length);
        
        for (uint256 i = 0; i < tokenURIs.length; i++) {
            _tokenIds.increment();
            uint256 newItemId = _tokenIds.current();
            _mint(recipient, newItemId);
            _setTokenURI(newItemId, tokenURI[i]);
            tokenIds[i] = newItemId;
        }
        
        return tokenIds;
    }

    function getCurrentTokenId() public view returns (uint256) {
        return _tokenIds.current();
    }
    
    // Update marketplace address (only owner)
    function setMarketplaceAddress(address _marketplaceAddress) public onlyOwner {
        marketplaceAddress = _marketplaceAddress;
    }
}

contract NFTMarketplace is ReentrancyGuard {
    using Counters for Counters.Counter;
    Counters.Counter private _itemIds;
    Counters.Counter private _itemsSold;
    
    address payable public owner;
    uint256 public listingPrice = 0.01 ether;
    
    // NFT Contract address
    address public nftContract;
    
    constructor() {
        owner = payable(msg.sender);
    }
    
    // Set NFT contract address
    function setNFTContract(address _nftContract) public {
        require(msg.sender == owner, "Only owner can set NFT contract");
        nftContract = _nftContract;
    }
    
    struct MarketItem {
        uint itemId;
        address nftContract;
        uint256 tokenId;
        address payable seller;
        address payable owner;
        uint256 price;
        bool sold;
    }
    
    mapping(uint256 => MarketItem) private idToMarketItem;
    
    event MarketItemCreated (
        uint indexed itemId,
        address indexed nftContract,
        uint256 indexed tokenId,
        address seller,
        address owner,
        uint256 price,
        bool sold
    );
    
    event MarketItemSold (
        uint indexed itemId,
        address indexed nftContract,
        uint256 indexed tokenId,
        address seller,
        address buyer,
        uint256 price
    );
    
    function getListingPrice() public view returns (uint256) {
        return listingPrice;
    }
    
    function updateListingPrice(uint256 _listingPrice) public {
        require(msg.sender == owner, "Only marketplace owner can update listing price");
        listingPrice = _listingPrice;
    }
    
    // Create market item (list NFT for sale)
    function createMarketItem(
        address nftContractAddress,
        uint256 tokenId,
        uint256 price
    ) public payable nonReentrant {
        require(price > 0, "Price must be greater than 0");
        require(msg.value == listingPrice, "Price must be equal to listing price");
        
        _itemIds.increment();
        uint256 itemId = _itemIds.current();
        
        idToMarketItem[itemId] = MarketItem(
            itemId,
            nftContractAddress,
            tokenId,
            payable(msg.sender),
            payable(address(0)), // No owner yet
            price,
            false
        );
        
        // Transfer NFT to marketplace
        IERC721(nftContractAddress).transferFrom(msg.sender, address(this), tokenId);
        
        emit MarketItemCreated(
            itemId,
            nftContractAddress,
            tokenId,
            msg.sender,
            address(0),
            price,
            false
        );
    }
    
    // Buy NFT from marketplace
    function createMarketSale(
        address nftContractAddress,
        uint256 itemId
    ) public payable nonReentrant {
        uint price = idToMarketItem[itemId].price;
        uint tokenId = idToMarketItem[itemId].tokenId;
        address seller = idToMarketItem[itemId].seller;
        
        require(msg.value == price, "Please submit the asking price to complete the purchase");
        require(idToMarketItem[itemId].sold == false, "This item has already been sold");
        
        // Transfer payment to seller
        idToMarketItem[itemId].seller.transfer(msg.value);
        
        // Transfer NFT to buyer
        IERC721(nftContractAddress).transferFrom(address(this), msg.sender, tokenId);
        
        // Update market item
        idToMarketItem[itemId].owner = payable(msg.sender);
        idToMarketItem[itemId].sold = true;
        _itemsSold.increment();
        
        // Pay marketplace owner the listing fee
        payable(owner).transfer(listingPrice);
        
        emit MarketItemSold(
            itemId,
            nftContractAddress,
            tokenId,
            seller,
            msg.sender,
            price
        );
    }
    
    // Mint and list NFT in one transaction
    function mintAndList(
        address nftContractAddress,
        string memory tokenURI,
        uint256 price
    ) public payable nonReentrant returns (uint256) {
        require(price > 0, "Price must be greater than 0");
        require(msg.value == listingPrice, "Must pay listing fee");
        
        // Mint NFT
        uint256 tokenId = NFTCollection(nftContractAddress).mintNFT(msg.sender, tokenURI);
        
        // Create market item
        _itemIds.increment();
        uint256 itemId = _itemIds.current();
        
        idToMarketItem[itemId] = MarketItem(
            itemId,
            nftContractAddress,
            tokenId,
            payable(msg.sender),
            payable(address(0)),
            price,
            false
        );
        
        // Transfer NFT to marketplace
        IERC721(nftContractAddress).transferFrom(msg.sender, address(this), tokenId);
        
        emit MarketItemCreated(
            itemId,
            nftContractAddress,
            tokenId,
            msg.sender,
            address(0),
            price,
            false
        );
        
        return itemId;
    }
    
    // Get market statistics
    function getMarketStats() public view returns (uint256 totalItems, uint256 soldItems, uint256 activeItems) {
        totalItems = _itemIds.current();
        soldItems = _itemsSold.current();
        activeItems = totalItems - soldItems;
    }
    
    // Fetch all unsold market items
    function fetchMarketItems() public view returns (MarketItem[] memory) {
        uint itemCount = _itemIds.current();
        uint unsoldItemCount = _itemIds.current() - _itemsSold.current();
        uint currentIndex = 0;
        
        MarketItem[] memory items = new MarketItem[](unsoldItemCount);
        for (uint i = 0; i < itemCount; i++) {
            if (idToMarketItem[i + 1].owner == address(0) && !idToMarketItem[i + 1].sold) {
                uint currentId = i + 1;
                MarketItem storage currentItem = idToMarketItem[currentId];
                items[currentIndex] = currentItem;
                currentIndex += 1;
            }
        }
        return items;
    }
    
    // Fetch NFTs owned by the caller
    function fetchMyNFTs() public view returns (MarketItem[] memory) {
        uint totalItemCount = _itemIds.current();
        uint itemCount = 0;
        uint currentIndex = 0;
        
        // First pass: count items
        for (uint i = 0; i < totalItemCount; i++) {
            if (idToMarketItem[i + 1].owner == msg.sender) {
                itemCount += 1;
            }
        }
        
        // Second pass: populate array
        MarketItem[] memory items = new MarketItem[](itemCount);
        for (uint i = 0; i < totalItemCount; i++) {
            if (idToMarketItem[i + 1].owner == msg.sender) {
                uint currentId = i + 1;
                MarketItem storage currentItem = idToMarketItem[currentId];
                items[currentIndex] = currentItem;
                currentIndex += 1;
            }
        }
        return items;
    }
    
    // Fetch NFTs listed by the caller
    function fetchItemsListed() public view returns (MarketItem[] memory) {
        uint totalItemCount = _itemIds.current();
        uint itemCount = 0;
        uint currentIndex = 0;
        
        // First pass: count items
        for (uint i = 0; i < totalItemCount; i++) {
            if (idToMarketItem[i + 1].seller == msg.sender) {
                itemCount += 1;
            }
        }
        
        // Second pass: populate array
        MarketItem[] memory items = new MarketItem[](itemCount);
        for (uint i = 0; i < totalItemCount; i++) {
            if (idToMarketItem[i + 1].seller == msg.sender) {
                uint currentId = i + 1;
                MarketItem storage currentItem = idToMarketItem[currentId];
                items[currentIndex] = currentItem;
                currentIndex += 1;
            }
        }
        return items;
    }
    
    // Get market item by ID
    function getMarketItem(uint256 itemId) public view returns (MarketItem memory) {
        return idToMarketItem[itemId];
    }
    
    // Emergency functions
    function withdrawBalance() public {
        require(msg.sender == owner, "Only owner can withdraw");
        payable(owner).transfer(address(this).balance);
    }
    
    // Get total number of items created
    function getTotalItemsCreated() public view returns (uint256) {
        return _itemIds.current();
    }
    
    // Get total number of items sold
    function getTotalItemsSold() public view returns (uint256) {
        return _itemsSold.current();
    }
}