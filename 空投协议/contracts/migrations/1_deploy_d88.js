const D88TokenWithReferral = artifacts.require("D88TokenWithReferral");

module.exports = function (deployer) {
  const name = "D88 Token";
  const symbol = "D88";
  const initialSupply = web3.utils.toWei("100000000", "ether"); // 1亿代币

  deployer.deploy(D88TokenWithReferral, name, symbol, initialSupply);
}; 