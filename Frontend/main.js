Moralis.initialize("inEEPkTr0lSBMAv6LgCpkEodRsMsEoNw4BCv2ETu");
Moralis.serverURL = 'https://lkvqpj0wzrda.moralis.io:2053/server'
const TOKEN_CONTRACT_ADDRESS = "0x13506f38a837Ae2c9F78DDcC761dCB0499Dd8Fbd";
const MARKETPLACE_CONTRACT = "0xF9F6423d1577660e55f4940E2A207B6287a0BCFb";

//initialise morails
init = async () => {
    hideElement(userItemsSection);
    hideElement(userInfo);
    hideElement(createItemForm);
    window.web3 = await Moralis.Web3.enable();
    window.tokenContract =  new web3.eth.Contract(abi, TOKEN_CONTRACT_ADDRESS);
    window.marketPlaceContract =  new web3.eth.Contract(marketplaceAbi, MARKETPLACE_CONTRACT);
    initUser();
    
}

initUser = async () => {
    if (await Moralis.User.current()) {
        
        hideElement(userConnectButton);
        showElement(userProfileButton);
        showElement(openCreateItemBtn);
        showElement(openUserItemsButton);
        loadUseritems();
    }else {
        showElement(userConnectButton);
        hideElement(userProfileButton);
        hideElement(openCreateItemBtn);
        hideElement(openUserItemsButton);

    }
}

login = async () => {

    try {
        await Moralis.Web3.authenticate();
        initUser();
    }catch (error) {
        alert(error)
    }
}

logout = async () => {
    await Moralis.User.logOut();
    hideElement(userInfo);
    initUser();
}

openUserInfo = async () => {
    user = await Moralis.User.current();
    if (user) {
        const email = user.get('email');
        if(email) {
            userEmailField.value = email;
        }else {
            userEmailField.value = "";
        }

        userUsernameField.value = user.get('username');

        const userAvatar = user.get('avatar');
        if (userAvatar) {
            userAvatarImage.src = userAvatar.url();
            showElement(userAvatarImage);
        }else {
            hideElement(userAvatarImage);
        }
        // document.getElementById("btnUserInfo").onclick = () => hideElement(userInfo);
        showElement(userInfo);
        // 
    }else{
        login();
    }
}

//open user items
openUserItems = async () => {
    user = await Moralis.User.current();
    if (user) {
        
        showElement(userItemsSection);
        // 
    }else{
        login();
    }
}


//save userinfo
saveUserInfo = async () => {
    user.set('email', userEmailField.value);
    user.set('username', userUsernameField.value);

    if (userAvatarFile.files.length > 0) {
        const avatar = new Moralis.File("avatar.jpeg", userAvatarFile.files[0]);
        user.set('avatar', avatar);

    }

    await user.save();
    alert("User infor saved successfully");
    openUserInfo();

    
}

createItem = async () => {
    if (createItemFile.files.length == 0) {
        alert("Please select file");
        return;
    }
    else if (createItemNameField.value.length == 0) {
        alert("Please give the item a name");
        return;
    }

    const nftFile = new Moralis.File("nftFile.jpg", createItemFile.files[0]);
    await nftFile.saveIPFS();


    const nftFilePath = nftFile.ipfs();
    const nftFileHash = nftFile.hash();
    console.log(nftFileHash);
    const metadata = {
        name: createItemNameField.value,
        description: createItemDescriptionField.value,
        image: nftFilePath,
        // nftFilePath: nftFilePath,
        // nftFileHash: nftFileHash
    };

    const nftFileMetaDataFile = new Moralis.File("metadata.json", {base64 : btoa(JSON.stringify(metadata))});
    await nftFileMetaDataFile.saveIPFS();

    const nftFileMetaDataFilePath = nftFileMetaDataFile.ipfs();
    const nftFileMetaDataFileHash = nftFileMetaDataFile.hash();

    const nftId = await mintNft(nftFileMetaDataFilePath);

    const Item = Moralis.Object.extend("Item");
    const item = new Item();
    item.set("name", createItemNameField.value);
    item.set("description", createItemDescriptionField.value);
    item.set("nftFilePath", nftFilePath);
    item.set("nftFileHash", nftFileHash);
    item.set("MetaDataFilePath",  nftFileMetaDataFilePath);
    item.set("MetaDataFileHash",  nftFileMetaDataFileHash);
    item.set("nftId", nftId);
    item.set("nftContractAddress", TOKEN_CONTRACT_ADDRESS);

    await item.save();
    console.log(nftFile.hash());
    console.log(nftFile.ipfs());
    console.log(item);

    user = await Moralis.User.current();
    const userAddress = user.get("ethAddress");

    switch(createItemStatusField.value) {
        case "0":
            return;
        case "1":
            await ensureMarketPlaceIsApproved(nftId, TOKEN_CONTRACT_ADDRESS);
            await marketPlaceContract.methods.addItemToMarket(nftId, TOKEN_CONTRACT_ADDRESS, createItemPriceField.value).send({from: userAddress});
            break;
        case "2":
            alert("not yet supported");
            return;
    }

}

//create function to call out contract to mint an NFT
mintNft = async (metadataUrl) => {
    const receipt = await tokenContract.methods.createItem(metadataUrl).send({from: ethereum.selectedAddress});
    console.log(receipt);

    //we can get our token id here. In the safeMint  function in the ERC721 contract
    //an even called transfer gets fired which returns a ew things most importantly the tokenID
    //we can call this events return value to access this tokenId
    return receipt.events.Transfer.returnValues.tokenId;
}

loadUseritems = async() => {
    const ownedItems = await Moralis.Cloud.run("getUserItems");
    // console.log(ownedItems);
    ownedItems.forEach(item => {
        getAndRenderItemData(item, renderUserItem)
    })
}




// getAndRenderItemData = (item, renderfunction) => {
//     fetch(item.tokenUri)
//     .then(response => response.json())
//     .then(data => {
//         data.symbol = item.symbol;
//         data.tokenId = item.tokenId;
//         data.tokenAddress = item.tokenAddress;
//         renderfunction(data)
//     })
// }

getAndRenderItemData = (item, renderFunction) => {
    
    fetch(item.tokenuri)
    .then(response => response.json())
    .then(data => {
        item.name = data.name;
        item.description = data.description;
        item.image = data.image;
        renderFunction(item);
    })
}

renderUserItem = (item) => {
    const userItem = userItemsTemplate.cloneNode(true);
    userItem.getElementsByTagName("img")[0].src = item.image;
    userItem.getElementsByTagName("img")[0].alt = item.name;
    userItem.getElementsByTagName("h5")[0].innerText = item.name;
    userItem.getElementsByTagName("p")[0].innerText = item.description;
    userItems.appendChild(userItem);

    

}

initTemplate = (id) => {
    const template = document.getElementById(id);
    template.id = "";
    template.parentNode.removeChild(template);
    return template;
}

renderUserItem = async (item) => {
    

    const userItem = userItemsTemplate.cloneNode(true);
    userItem.getElementsByTagName("img")[0].src = item.image;
    userItem.getElementsByTagName("img")[0].alt = item.name;
    userItem.getElementsByTagName("h5")[0].innerText = item.name;
    userItem.getElementsByTagName("p")[0].innerText = item.description;

    

   
    userItems.appendChild(userItem);
}

ensureMarketPlaceIsApproved = async(tokenId, tokenAddress) => {
    user = await Moralis.User.current();
    const userAddress = user.get("ethAddress");
    const contract = new web3.eth.Contract(marketplaceAbi, tokenAddress);
    const approveAddress = await tokenContract.methods.getApproved(tokenId).call({from: userAddress});
    if (approveAddress != MARKETPLACE_CONTRACT) {
        await tokenContract.methods.approve(MARKETPLACE_CONTRACT, tokenId).send({from: userAddress});
    }
}




hideElement = (element) => element.style.display = "none";
showElement = (element) => element.style.display = "block";

const userConnectButton = document.getElementById("btnConnect");
userConnectButton.onclick = login;

const userProfileButton = document.getElementById("btnUserInfo");
userProfileButton.onclick = openUserInfo;

const userInfo = document.getElementById("userInfo");
const userUsernameField = document.getElementById("txtUsername");
const userEmailField = document.getElementById("txtEmail");
const userAvatarImage = document.getElementById("imgAvatar");
const userAvatarFile = document.getElementById("fileAvatar");

// document.getElementById("btnUserInfo").onclick = () => showElement(userInfo);
document.getElementById("btnCloseUserInfo").onclick = () => hideElement(userInfo);
document.getElementById("btnLogout").onclick = logout;
document.getElementById("btnSaveUserInfo").onclick = saveUserInfo;

const createItemForm = document.getElementById("CreateItem");

const createItemNameField = document.getElementById("txtCreateItemName");
const createItemDescriptionField = document.getElementById("txtCreateItemDescription");
const createItemPriceField = document.getElementById("numCreateItemPrice");
const createItemStatusField = document.getElementById("selectCreateItemStatus");
const createItemFile = document.getElementById("fileCreateItemFile");





const openCreateItemBtn = document.getElementById("btnOpenCreateItem");
openCreateItemBtn.onclick = () => showElement(createItemForm);
document.getElementById("fileCloseCreateItem").onclick = () => hideElement(createItemForm);
document.getElementById("btnCreateItem").onclick = createItem;


//const user items section
const userItemsSection = document.getElementById("userItems");
const userItems = document.getElementById("userItemsList");
document.getElementById("btnCloseUserItems").onclick = () => hideElement(userItemsSection);
const openUserItemsButton = document.getElementById("btnMyItems");
openUserItemsButton.onclick = openUserItems;


const userItemsTemplate = initTemplate("itemTemplate")
init();