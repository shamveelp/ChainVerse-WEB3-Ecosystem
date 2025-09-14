// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

contract NFTMarketplace is ERC721URIStorage, ReentrancyGuard {
    using Counters for Counters.Counter;
    
    Counters.Counter private _tokenIds;
    Counters.Counter private _itemsSold;
    
    address payable public owner;
    address payable public constant COMPANY_WALLET = payable(0xcc5d972Ee1e4abe7d1d6b5FEd1349ae4913cd423);

    // Fees in basis points (1% = 100 basis points)
    uint256 public constant COMPANY_FEE = 250; // 2.5%
    uint256 public constant CREATOR_ROYALTY = 100; // 1%
    uint256 public constant TOTAL_FEES = COMPANY_FEE + CREATOR_ROYALTY; // 3.5%
    
    uint256 public listPrice = 0.000001 ether; // Minimum listing fee
    uint256 public constant MIN_PRICE = 0.000001 ether; // Minimum NFT price
    
    struct ListedToken {
        uint256 tokenId;
        address payable owner;
        address payable seller;
        address payable creator;
        uint256 price;
        bool currentlyListed;
        uint256 createdAt;
        uint256 lastSalePrice;
        uint256 totalSales;
    }
    
    struct SaleHistory {
        address seller;
        address buyer;
        uint256 price;
        uint256 timestamp;
    }
    
    mapping(uint256 => ListedToken) private idToListedToken;
    mapping(uint256 => address) private tokenCreators;
    mapping(uint256 => SaleHistory[]) private tokenSaleHistory;
    
    event TokenListedSuccess(
        uint256 indexed tokenId,
        address owner,
        address seller,
        address creator,
        uint256 price,
        bool currentlyListed
    );
    
    event TokenSold(
        uint256 indexed tokenId,
        address from,
        address to,
        uint256 price,
        uint256 companyFee,
        uint256 creatorRoyalty
    );
    
    event ListingCancelled(
        uint256 indexed tokenId,
        address seller
    );
    
    constructor() ERC721("NFTorium", "NFTO") {
        owner = payable(msg.sender);
    }
    
    modifier onlyOwner() {
        require(msg.sender == owner, "Only contract owner can call this");
        _;
    }
    
    function createToken(string memory tokenURI, uint256 price) 
        public 
        payable 
        returns (uint256) 
    {
        require(msg.value >= listPrice, "Insufficient listing fee");
        require(price >= MIN_PRICE, "Price too low");
        require(bytes(tokenURI).length > 0, "TokenURI cannot be empty");
        
        _tokenIds.increment();
        uint256 newTokenId = _tokenIds.current();
        
        _safeMint(msg.sender, newTokenId);
        _setTokenURI(newTokenId, tokenURI);
        
        tokenCreators[newTokenId] = msg.sender;
        
        createListedToken(newTokenId, price);
        
        COMPANY_WALLET.transfer(msg.value);
        
        return newTokenId;
    }
    
    function createListedToken(uint256 tokenId, uint256 price) private {
        idToListedToken[tokenId] = ListedToken(
            tokenId,
            payable(address(this)),
            payable(msg.sender),
            payable(tokenCreators[tokenId]),
            price,
            true,
            block.timestamp,
            0, // lastSalePrice
            0  // totalSales
        );
        
        _transfer(msg.sender, address(this), tokenId);
        
        emit TokenListedSuccess(
            tokenId,
            address(this),
            msg.sender,
            tokenCreators[tokenId],
            price,
            true
        );
    }
    
    function executeSale(uint256 tokenId) public payable nonReentrant {
        ListedToken storage listedToken = idToListedToken[tokenId];
        require(listedToken.currentlyListed, "Token not listed for sale");
        require(msg.value >= listedToken.price, "Insufficient payment");
        require(msg.sender != listedToken.seller, "Cannot buy your own NFT");
        
        uint256 salePrice = listedToken.price;
        address payable seller = listedToken.seller;
        address payable creator = listedToken.creator;
        
        uint256 companyFee = (salePrice * COMPANY_FEE) / 10000;
        uint256 creatorRoyalty = (salePrice * CREATOR_ROYALTY) / 10000;
        uint256 sellerAmount = salePrice - companyFee - creatorRoyalty;
        
        // If creator is the seller, they get the royalty too
        if (creator == seller) {
            sellerAmount += creatorRoyalty;
            creatorRoyalty = 0;
        }
        
        // Record sale history
        tokenSaleHistory[tokenId].push(SaleHistory({
            seller: seller,
            buyer: msg.sender,
            price: salePrice,
            timestamp: block.timestamp
        }));
        
        // Update token details
        listedToken.currentlyListed = false;
        listedToken.seller = payable(msg.sender);
        listedToken.owner = payable(msg.sender);
        listedToken.lastSalePrice = salePrice;
        listedToken.totalSales += 1;
        _itemsSold.increment();
        
        _transfer(address(this), msg.sender, tokenId);
        
        // Distribute payments
        if (companyFee > 0) {
            COMPANY_WALLET.transfer(companyFee);
        }
        
        if (creatorRoyalty > 0) {
            creator.transfer(creatorRoyalty);
        }
        
        if (sellerAmount > 0) {
            seller.transfer(sellerAmount);
        }
        
        // Refund excess payment
        if (msg.value > salePrice) {
            payable(msg.sender).transfer(msg.value - salePrice);
        }
        
        emit TokenSold(tokenId, seller, msg.sender, salePrice, companyFee, creatorRoyalty);
    }
    
    function relistToken(uint256 tokenId, uint256 price) public payable {
        require(ownerOf(tokenId) == msg.sender, "Not token owner");
        require(price >= MIN_PRICE, "Price too low");
        require(msg.value >= listPrice, "Insufficient listing fee");
        require(!idToListedToken[tokenId].currentlyListed, "Already listed");
        
        idToListedToken[tokenId].price = price;
        idToListedToken[tokenId].currentlyListed = true;
        idToListedToken[tokenId].seller = payable(msg.sender);
        idToListedToken[tokenId].owner = payable(address(this));
        
        _transfer(msg.sender, address(this), tokenId);
        
        COMPANY_WALLET.transfer(msg.value);
        
        emit TokenListedSuccess(
            tokenId, 
            address(this), 
            msg.sender, 
            tokenCreators[tokenId], 
            price, 
            true
        );
    }
    
    function cancelListing(uint256 tokenId) public {
        ListedToken storage listedToken = idToListedToken[tokenId];
        require(listedToken.seller == msg.sender, "Not the seller");
        require(listedToken.currentlyListed, "Not currently listed");
        
        listedToken.currentlyListed = false;
        listedToken.owner = payable(msg.sender);
        
        _transfer(address(this), msg.sender, tokenId);
        
        emit ListingCancelled(tokenId, msg.sender);
    }
    
    function getAllNFTs() public view returns (ListedToken[] memory) {
        uint256 nftCount = _tokenIds.current();
        ListedToken[] memory tokens = new ListedToken[](nftCount);
        
        for (uint256 i = 0; i < nftCount; i++) {
            uint256 currentId = i + 1;
            tokens[i] = idToListedToken[currentId];
        }
        
        return tokens;
    }
    
    function getMyNFTs() public view returns (ListedToken[] memory) {
        uint256 totalItemCount = _tokenIds.current();
        uint256 itemCount = 0;
        
        for (uint256 i = 0; i < totalItemCount; i++) {
            uint256 currentId = i + 1;
            address tokenOwner = ownerOf(currentId);
            if (tokenOwner == msg.sender || idToListedToken[currentId].seller == msg.sender) {
                itemCount += 1;
            }
        }
        
        ListedToken[] memory items = new ListedToken[](itemCount);
        uint256 currentIndex = 0;
        
        for (uint256 i = 0; i < totalItemCount; i++) {
            uint256 currentId = i + 1;
            address tokenOwner = ownerOf(currentId);
            if (tokenOwner == msg.sender || idToListedToken[currentId].seller == msg.sender) {
                items[currentIndex] = idToListedToken[currentId];
                currentIndex += 1;
            }
        }
        
        return items;
    }
    
    function getNFTsByOwner(address ownerAddress) public view returns (ListedToken[] memory) {
        uint256 totalItemCount = _tokenIds.current();
        uint256 itemCount = 0;
        
        for (uint256 i = 0; i < totalItemCount; i++) {
            uint256 currentId = i + 1;
            address tokenOwner = ownerOf(currentId);
            if (tokenOwner == ownerAddress || idToListedToken[currentId].seller == ownerAddress) {
                itemCount += 1;
            }
        }
        
        ListedToken[] memory items = new ListedToken[](itemCount);
        uint256 currentIndex = 0;
        
        for (uint256 i = 0; i < totalItemCount; i++) {
            uint256 currentId = i + 1;
            address tokenOwner = ownerOf(currentId);
            if (tokenOwner == ownerAddress || idToListedToken[currentId].seller == ownerAddress) {
                items[currentIndex] = idToListedToken[currentId];
                currentIndex += 1;
            }
        }
        
        return items;
    }
    
    function getTokenSaleHistory(uint256 tokenId) public view returns (SaleHistory[] memory) {
        return tokenSaleHistory[tokenId];
    }
    
    function getListPrice() public view returns (uint256) {
        return listPrice;
    }
    
    function getMinPrice() public pure returns (uint256) {
        return MIN_PRICE;
    }
    
    function getListedTokenForId(uint256 tokenId) public view returns (ListedToken memory) {
        return idToListedToken[tokenId];
    }
    
    function getCurrentToken() public view returns (uint256) {
        return _tokenIds.current();
    }
    
    function getTokenCreator(uint256 tokenId) public view returns (address) {
        return tokenCreators[tokenId];
    }
    
    function getTotalItemsSold() public view returns (uint256) {
        return _itemsSold.current();
    }
    
    function getCompanyStats() public view returns (uint256 totalTokens, uint256 totalSold, uint256 currentListings) {
        uint256 currentListings_ = 0;
        uint256 totalTokens_ = _tokenIds.current();
        
        for (uint256 i = 1; i <= totalTokens_; i++) {
            if (idToListedToken[i].currentlyListed) {
                currentListings_++;
            }
        }
        
        return (totalTokens_, _itemsSold.current(), currentListings_);
    }
    
    function updateListPrice(uint256 _listPrice) public onlyOwner {
        require(_listPrice > 0, "List price must be positive");
        listPrice = _listPrice;
    }
    
    function withdraw() public onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "No funds to withdraw");
        owner.transfer(balance);
    }
    
    function emergencyWithdraw() public onlyOwner {
        owner.transfer(address(this).balance);
    }
}