Moralis.initialize("inEEPkTr0lSBMAv6LgCpkEodRsMsEoNw4BCv2ETu");
Moralis.serverURL = 'https://lkvqpj0wzrda.moralis.io:2053/server'
const TOKEN_CONTRACT_ADDRESS = "0x73caADaA4C24406e9A8a7Bdc48668f590b7931db";


//initialise morails
init = async () => {
    hideElement(userInfo);
    hideElement(createItemForm);
    window.web3 = await Moralis.Web3.enable();
    window.tokenContract =  new web3.eth.Contract(abi, TOKEN_CONTRACT_ADDRESS);
    initUser();
}

initUser = async () => {
    if (await Moralis.User.current()) {

        hideElement(userConnectButton);
        showElement(userProfileButton);
        showElement(openCreateItemBtn);
    }else {
        showElement(userConnectButton);
        hideElement(userProfileButton);
        hideElement(openCreateItemBtn)
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
const createItemPriceField = document.getElementById("txtCreateItemPirce");
const createItemStatusField = document.getElementById("txtCreateItemStatus");
const createItemFile = document.getElementById("fileCreateItemFile");





const openCreateItemBtn = document.getElementById("btnOpenCreateItem");
openCreateItemBtn.onclick = () => showElement(createItemForm);
document.getElementById("fileCloseCreateItem").onclick = () => hideElement(createItemForm);
document.getElementById("btnCreateItem").onclick = createItem;



init();