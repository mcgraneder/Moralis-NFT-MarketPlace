// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "../node_modules/@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "../node_modules/@openzeppelin/contracts/utils/Counters.sol";


contract NFTToken is ERC721 {

    //we nned to access the counter struct from the counter file
    //this is used as equivelent for us to say id = 0 and then increment
    //in our functions saying id++
    using Counters for Counters.Counter;
    Counters.Counter private _tokenIds;

    //we need to pass some values into our constructer
    //namely the ERC721 instances for name symbol decimals etc
    constructor () ERC721("NFTToken", "NFTT"){}

    //we now need to initialise our item as a struct
    struct Item {
        uint256 id;
        address creator;
        string uri;
    }

    //now we need to make a mapping to our user account to the item struct
    mapping(uint256 => Item) public Items; 

    //create item function
    function createItem(string memory uri) public returns (uint256) {
        _tokenIds.increment();
        uint256 newItemId = _tokenIds.current();

        //we can call mint from the ERC721 contract to mint our nft token
        _safeMint(msg.sender, newItemId);

        Items[newItemId] = Item(newItemId, msg.sender, uri);

        return newItemId;
    }

    //we now need to override the tokenURI function form the ERC721 function to add
    //a piece of extra functionality that is not provided by the base contratc function
    //namely we need return the item url with the id
     function tokenURI(uint256 tokenId) public view  override returns (string memory) {
        require(_exists(tokenId), "ERC721Metadata: URI query for nonexistent token");

        return Items[tokenId].uri;
    }
}