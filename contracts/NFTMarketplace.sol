//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "hardhat/console.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";

contract NFTMarketplace is ERC721URIStorage {

    using Counters for Counters.Counter;
    //_tokenIds variable has the most recent minted tokenId
    Counters.Counter private _tokenIds;
    //Keeps track of the number of items sold on the marketplace
    Counters.Counter private _itemsSold;
    //owner is the contract address that created the smart contract
    address payable owner;
    //The fee charged by the marketplace to be allowed to list an NFT
    uint256 listPrice = 0.001 ether;

    //The structure to store info about a listed token
    struct ListedToken {
        uint256 tokenId;
        address payable owner;
        address payable seller;
        uint256 price;
        bool currentlyListed;
        bool inAuction; 
    }

    //The structure to store info about all Transactions
    struct TransactionStruct {
        uint256 id;
        address owner;
        uint256 cost;
    }

    TransactionStruct[] transactions;
    //The structure to store info about all Bid and bid auction
    struct Bid {
      address bidder;
      uint256 amount;
    }
    struct Auction {
        uint256 tokenId;
        address payable owner;
        uint256 startPrice;
        uint256 highestBid;
        address payable highestBidder;
        uint256 endTime;
        bool active;
          	
    }

mapping(uint256 => Auction) private tokenIdToAuction;
mapping(uint256 => Bid[]) private tokenIdToBids;
event AuctionCreated(uint256 indexed tokenId, address owner, uint256 startPrice, uint256 endTime);
event BidPlaced(uint256 indexed tokenId, address bidder, uint256 amount);

    //the event emitted when a token is successfully listed
    event TokenListedSuccess (
        uint256 indexed tokenId,
        address owner,
        address seller,
        uint256 price,
        bool currentlyListed
    );

    //This mapping maps tokenId to token info and is helpful when retrieving details about a tokenId
    mapping(uint256 => ListedToken) private idToListedToken;

    constructor() ERC721("NFTMarketplace", "NFTM") {
        owner = payable(msg.sender);
    }

    function updateListPrice(uint256 _listPrice) public payable {
        require(owner == msg.sender, "Only owner can update listing price");
        listPrice = _listPrice;
    }

    function getListPrice() public view returns (uint256) {
        return listPrice;
    }

    function getLatestIdToListedToken() public view returns (ListedToken memory) {
        uint256 currentTokenId = _tokenIds.current();
        return idToListedToken[currentTokenId];
    }

    function getListedTokenForId(uint256 tokenId) public view returns (ListedToken memory) {
        return idToListedToken[tokenId];
    }

    function getCurrentToken() public view returns (uint256) {
        return _tokenIds.current();
    }

    //The first time a token is created, it is listed here
    function createToken(string memory tokenURI, uint256 price) public payable returns (uint) {
        //Increment the tokenId counter, which is keeping track of the number of minted NFTs
        _tokenIds.increment();
        uint256 newTokenId = _tokenIds.current();

        //Mint the NFT with tokenId newTokenId to the address who called createToken
        _safeMint(msg.sender, newTokenId);

        //Map the tokenId to the tokenURI (which is an IPFS URL with the NFT metadata)
        _setTokenURI(newTokenId, tokenURI);

        //Helper function to update Global variables and emit an event
        createListedToken(newTokenId, price);

        return newTokenId;
    }

    function createListedToken(uint256 tokenId, uint256 price) private {
        //Make sure the sender sent enough ETH to pay for listing
        require(msg.value == listPrice, "Hopefully sending the correct price");
        //Just sanity check
        require(price > 0, "Make sure the price isn't negative");

        //Update the mapping of tokenId's to Token details, useful for retrieval functions
        idToListedToken[tokenId] = ListedToken(
            tokenId,
            payable(address(this)),
            payable(msg.sender),
            price,
            true,
            false
        );

        _transfer(msg.sender, address(this), tokenId);
        //Emit the event for successful transfer. The frontend parses this message and updates the end user
        emit TokenListedSuccess(
            tokenId,
            address(this),
            msg.sender,
            price,
            true
        );
    }
    
    //This will return all the NFTs currently listed to be sold on the marketplace
    function getAllNFTs() public view returns (ListedToken[] memory) {
        uint nftCount = _tokenIds.current();
        ListedToken[] memory tokens = new ListedToken[](nftCount);
        uint currentIndex = 0;
        uint currentId;
        //at the moment currentlyListed is true for all, if it becomes false in the future we will 
        //filter out currentlyListed == false over here
        for(uint i=0;i<nftCount;i++)
        {
            currentId = i + 1;
            ListedToken storage currentItem = idToListedToken[currentId];
            tokens[currentIndex] = currentItem;
            currentIndex += 1;
        }
        //the array 'tokens' has the list of all NFTs in the marketplace
        return tokens;
    }
    
    //Returns all the NFTs that the current user is owner or seller in
    function getMyNFTs() public view returns (ListedToken[] memory) {
        uint totalItemCount = _tokenIds.current();
        uint itemCount = 0;
        uint currentIndex = 0;
        uint currentId;
        //Important to get a count of all the NFTs that belong to the user before we can make an array for them
        for(uint i=0; i < totalItemCount; i++)
        {
            if(idToListedToken[i+1].owner == msg.sender || idToListedToken[i+1].seller == msg.sender){
                itemCount += 1;
            }
        }

        //Once you have the count of relevant NFTs, create an array then store all the NFTs in it
        ListedToken[] memory items = new ListedToken[](itemCount);
        for(uint i=0; i < totalItemCount; i++) {
            if(idToListedToken[i+1].owner == msg.sender || idToListedToken[i+1].seller == msg.sender) {
                currentId = i+1;
                ListedToken storage currentItem = idToListedToken[currentId];
                items[currentIndex] = currentItem;
                currentIndex += 1;
            }
        }
        return items;
    }

   function executeSale(uint256 tokenId) public payable {
    uint price = idToListedToken[tokenId].price;
    address seller = idToListedToken[tokenId].seller;
    require(msg.value == price, "Please submit the asking price in order to complete the purchase");

    //update the details of the token
    idToListedToken[tokenId].currentlyListed = false;
    idToListedToken[tokenId].seller = payable(msg.sender);
    _itemsSold.increment();

    //Actually transfer the token to the new owner
    _transfer(address(this), msg.sender, tokenId);

    //approve the marketplace to sell NFTs on your behalf
    approve(address(this), tokenId);

    //Transfer the listing fee to the marketplace creator
    payable(owner).transfer(listPrice);

    //Transfer the proceeds from the sale to the seller of the NFT
    payable(seller).transfer(msg.value);

    //塞入购买信息
    transactions.push(TransactionStruct(tokenId, msg.sender, msg.value));
}

//重新上架nft
function resell(uint256 tokenId, uint256 newPrice) public payable {
    ListedToken storage listedToken = idToListedToken[tokenId];
    require(listedToken.currentlyListed, "Token not currently listed");
    require(msg.sender == listedToken.owner || msg.sender == listedToken.seller, "Only token owner or seller can resell.");
    require(newPrice > 0, "Price must be greater than 0");


    // Update the details of the listed token
    listedToken.owner = payable(address(this));
    listedToken.seller = payable(msg.sender);
    listedToken.price = newPrice;

    // Transfer the token back to the marketplace
    _transfer(msg.sender, address(this), tokenId);

    // Emit an event for the successful resell
    emit TokenListedSuccess(tokenId, address(this), msg.sender, newPrice, true);
}


    

    function updateTokenPrice(uint256 tokenId, uint256 newPrice) public payable{
    // 获取与指定 tokenId 相关的 ListedToken 结构实例
        ListedToken storage listedToken = idToListedToken[tokenId];
        listedToken.currentlyListed = true;

    // 确保代币当前已经被列出
    //   require(listedToken.currentlyListed, "Token must be listed for sale.");
    // 确保只有代币的拥有者或出售者才能更改价格
        require(msg.sender == listedToken.owner || msg.sender == listedToken.seller, "Only token owner or seller can update price.");
    // 更新价格字段
        listedToken.price = newPrice;

    // 将更新后的 ListedToken 结构实例保存回存储中
        idToListedToken[tokenId] = listedToken;

    }

     function getAllTransactions() external view returns (TransactionStruct[] memory) {
        return transactions;
    }


    function createAuction(uint256 tokenId, uint256 startPrice, uint256 duration) public {
        ListedToken storage listedToken = idToListedToken[tokenId];
        require(msg.sender == listedToken.owner || msg.sender == listedToken.seller, "Only the owner can create an auction");
        require(startPrice > 0, "Start price must be greater than 0");
        require(duration > 0, "Auction duration must be greater than zero");
        //Make sure the token is not already listed for sale
        //require(!idToListedToken[tokenId].currentlyListed, "Token is already listed for sale");
        // The end time for the auction
            uint256 endTime = block.timestamp + duration*86400;
        //Create the auction struct and add it to the mapping
        Auction memory auction = Auction(
            tokenId,
            payable(msg.sender),
            startPrice,
            0,
            payable(address(0)),
            endTime ,
            true
            
        );
        tokenIdToAuction[tokenId] = auction;
           // Update the ListedToken to show that it is currently in an auction
        listedToken.inAuction = true;
        emit AuctionCreated(tokenId, msg.sender, startPrice, auction.endTime);
        }

function placeBid(uint256 tokenId) public payable {
    //Make sure the auction is active and hasn't ended yet
    require(tokenIdToAuction[tokenId].active, "Auction is not active");
    require(block.timestamp < tokenIdToAuction[tokenId].endTime, "Auction has ended");
    //Make sure the bid is higher than the current highest bid
    require(msg.value > tokenIdToAuction[tokenId].highestBid, "Bid must be higher than current highest bid");

    //Refund the previous highest bidder, if there was one
    if (tokenIdToAuction[tokenId].highestBidder != address(0)) {
        tokenIdToAuction[tokenId].highestBidder.transfer(tokenIdToAuction[tokenId].highestBid);
    }

    //Update the auction struct with the new highest bid and bidder
    tokenIdToAuction[tokenId].highestBid = msg.value;
    tokenIdToAuction[tokenId].highestBidder = payable(msg.sender);

    emit BidPlaced(tokenId, msg.sender, msg.value);
    }

    function endAuction(uint256 tokenId) public {
    //Make sure the auction is active and has ended
    require(tokenIdToAuction[tokenId].active, "Auction is not active");
    require(block.timestamp >= tokenIdToAuction[tokenId].endTime, "Auction has not ended");

    //Transfer the token to the highest bidder and the payment to the seller
    address payable seller = tokenIdToAuction[tokenId].owner;
    address payable buyer = tokenIdToAuction[tokenId].highestBidder;
    uint256 price = tokenIdToAuction[tokenId].highestBid;

    _transfer(address(this), buyer, tokenId);
    seller.transfer(price);

    //Update the auction struct to mark it as inactive
    tokenIdToAuction[tokenId].active = false;

    //Update the listed token struct to reflect the
    idToListedToken[tokenId].currentlyListed=false;
     //塞入购买信息
    transactions.push(TransactionStruct(tokenId, buyer, price));
    }

    function getAuction(uint256 tokenId) public view returns (Auction memory) {
    return tokenIdToAuction[tokenId];
    }

    function getBids(uint256 tokenId) public view returns (Bid[] memory) {
        return tokenIdToBids[tokenId];
    }


}

