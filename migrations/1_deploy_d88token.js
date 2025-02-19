const D88TokenWithReferral = artifacts.require("D88TokenWithReferral");

module.exports = async function(deployer) {
  // 设置代币参数
  const name = "D88 Token";
  const symbol = "D88";
  const initialSupply = web3.utils.toWei('1000000000', 'ether'); // 10亿代币初始供应量

  await deployer.deploy(D88TokenWithReferral, name, symbol, initialSupply);
}; 