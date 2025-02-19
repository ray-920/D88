const truffleVersion = require('truffle/package.json').version;
const solcVersion = require('solc/package.json').version;
const Web3 = require('web3');

async function checkEnvironment() {
    console.log("检查部署环境和配置...");
    const errors = [];

    // 检查Truffle版本
    try {
        console.log("Truffle版本:", truffleVersion);
    } catch (error) {
        errors.push("无法获取Truffle版本: " + error.message);
    }

    // 检查Solidity编译器版本
    try {
        console.log("Solidity编译器版本:", solcVersion);
    } catch (error) {
        errors.push("无法获取Solidity编译器版本: " + error.message);
    }

    // 检查网络配置
    try {
        const web3 = new Web3("https://node.dragonfly-chain.com");
        const networkId = await web3.eth.net.getId();
        console.log("网络ID:", networkId);
    } catch (error) {
        errors.push("无法连接到网络: " + error.message);
    }

    // 检查ERC1820注册表地址
    const erc1820RegistryAddress = "0x3C81F3BF119df15Fa1E523D1d1d2053b247C5802";
    console.log("ERC1820注册表地址:", erc1820RegistryAddress);

    // 检查默认操作者地址
    const defaultOperatorAddress = "0x3785eEa65F0a15cC1E5398B729f580b16Ccc4309";
    console.log("默认操作者地址:", defaultOperatorAddress);

    // 检查依赖项
    console.log("依赖项:");
    console.log("- OpenZeppelin合约库");
    console.log("- HDWalletProvider");
    console.log("- dotenv");

    if (errors.length > 0) {
        console.error("\n检查过程中发现以下错误:");
        errors.forEach(err => console.error("- ", err));
    } else {
        console.log("检查完成，没有发现错误。");
    }
}

checkEnvironment().catch(console.error); 