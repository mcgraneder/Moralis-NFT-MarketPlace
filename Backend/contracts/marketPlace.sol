// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "../node_modules/@openzeppelin/contracts/token/ERC721/ERC721.sol";



contract NFTMarketPlace {

    //we need to create a struct for the auction item
    struct auctionItem {
        uint256 id;
        address tokenAddress;
        uint256 tokenId;
        address payable seller;
        uint256 askingPrice;
        bool isSold;
    }

    //now we want to create an array of auctionItem struct instances to keep
    //track of all of the auction items
    auctionItem[] public itemsForSale;

    //we also want to create a mapping of active items which allows us to keep
    //track of whicg items are for sale. this mapping prevents us rom looping
    //through the array above
    mapping(address => mapping(uint256 => bool)) activeItems;

    event itemAdded(uint256 id, uint256 tokenId, address tokenAddress, uint256 askingPrice);
    event itemSold (uint256 id, address buyer, uint256 askingPrice);

    //we waant to create a modifier to check if the caller is the item owner
    modifier onlyItemOwner (address tokenAddress, uint256 tokenId) {
        IERC721 tokenContract = IERC721(tokenAddress);
        require(tokenContract.ownerOf(tokenId) == msg.sender);
        _;
    }

    //the next modifier we create checks if the marketplace has the approval of transferring
    //the item on behalf of the user
    modifier hasTransferApproval (address tokenAddress, uint256 tokenId) {
        IERC721 tokenContract = IERC721(tokenAddress);
        require(tokenContract.getApproved(tokenId) == address(this));
        _;
    }

    //modifier which checks if the item actuall does exist
    modifier itemExists(uint256 id){
        require(id < itemsForSale.length && itemsForSale[id].id == id, "could not find item");
        _;
    }

    modifier isForSale(uint256 id) {
        require(itemsForSale[id].isSold == false, "item is already sold");
        _;
    }

    //next we will create a function which adds an item for sale to the marketplace
    function addItemToMarket(uint256 tokenId, address tokenAddress, uint256 askingPrice) onlyItemOwner(tokenAddress, tokenId) hasTransferApproval(tokenAddress, tokenId) external returns(uint256) {
        require(activeItems[tokenAddress][tokenId] == false, "item is already up for sale");
        uint256 newItemId = itemsForSale.length;
        itemsForSale.push(auctionItem(newItemId, tokenAddress, tokenId, payable(msg.sender), askingPrice, false));
        activeItems[tokenAddress][tokenId] = true;

        assert(itemsForSale[newItemId].id == newItemId);
        emit itemAdded(newItemId, tokenId, tokenAddress, askingPrice);
        return newItemId;
    } 

    //the next function allows us to actually buy an item
    function buyItem(uint256 id) payable external itemExists(id) isForSale(id) hasTransferApproval(itemsForSale[id].tokenAddress, itemsForSale[id].tokenId) {
        require(msg.value >= itemsForSale[id].askingPrice, "Not enough funds for purchase");
        require(msg.sender != itemsForSale[id].seller);

        itemsForSale[id].isSold = true;
        activeItems[itemsForSale[id].tokenAddress][itemsForSale[id].tokenId] = false;
        IERC721(itemsForSale[id].tokenAddress).safeTransferFrom(itemsForSale[id].seller, msg.sender, itemsForSale[id].tokenId);
        itemsForSale[id].seller.transfer(msg.value);

        emit itemSold(id, msg.sender, itemsForSale[id].askingPrice);

    }

    //automaticaly do transfer on approval when token is minted to save an extra function call
    //add bidding and selling


}