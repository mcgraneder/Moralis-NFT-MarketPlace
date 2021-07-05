const NFTMarketPlace = artifacts.require("NFTMarketPlace");

module.exports = function (deployer) {
  deployer.deploy(NFTMarketPlace);
};
