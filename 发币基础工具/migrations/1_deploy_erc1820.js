const ERC1820Registry = artifacts.require("ERC1820Registry");

module.exports = function(deployer) {
  deployer.deploy(ERC1820Registry);
}; 
const ERC1820Registry = artifacts.require("ERC1820Registry");

module.exports = async function (deployer) {
await deployer.deploy(ERC1820Registry);
};