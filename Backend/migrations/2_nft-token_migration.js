const NFTToken = artifacts.require("NFTToken");

module.exports = function (deployer) {
  deployer.deploy(NFTToken);
};
