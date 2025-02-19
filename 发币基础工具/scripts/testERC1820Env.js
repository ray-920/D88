require('dotenv').config();
const { ethers } = require('ethers');
const fs = require('fs');
const path = require('path');

// 从.env文件中读取变量
const rpcUrl = process.env.BLOCKCHAIN_RPC;
const privateKey = process.env.PRIVATE_KEY;
const erc1820Address = process.env.ERC1820_REGISTRY_ADDRESS;

// 设置提供者和签名者
const provider = new ethers.providers.JsonRpcProvider(rpcUrl);
const wallet = new ethers.Wallet(privateKey, provider);

// 读取编译后的合约ABI
const contractPath = path.resolve(__dirname, '../build/contracts/ERC1820Registry.json');
const contractJson = JSON.parse(fs.readFileSync(contractPath, 'utf8'));
const erc1820ABI = contractJson.abi;

// 创建合约实例
const erc1820Contract = new ethers.Contract(erc1820Address, erc1820ABI, wallet);

async function testContract() {
  try {
    // 示例：调用合约的某个方法
    const manager = await erc1820Contract.getManager(erc1820Address);
    console.log('Manager:', manager);

    // 其他测试代码...

  } catch (error) {
    console.error('测试过程中出现错误:', error);
  }
}

testContract(); 