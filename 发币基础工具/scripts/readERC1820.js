const Web3 = require('web3');

// 设置Web3提供者
const web3 = new Web3('https://node.dragonfly-chain.com');

// ERC1820合约地址
const erc1820Address = '0x3C81F3BF119df15Fa1E523D1d1d2053b247C5802';

// ERC1820合约ABI
const erc1820ABI = [
  {
    "constant": false,
    "inputs": [
      { "name": "interfaceHash", "type": "bytes32" },
      { "name": "addr", "type": "address" },
      { "name": "status", "type": "bool" }
    ],
    "name": "setInterfaceSupport",
    "outputs": [],
    "payable": false,
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "constant": true,
    "inputs": [
      { "name": "interfaceHash", "type": "bytes32" },
      { "name": "addr", "type": "address" }
    ],
    "name": "canImplementInterfaceForAddress",
    "outputs": [
      { "name": "", "type": "bytes32" }
    ],
    "payable": false,
    "stateMutability": "view",
    "type": "function"
  }
];

// 创建合约实例
const erc1820Contract = new web3.eth.Contract(erc1820ABI, erc1820Address);

async function readContract() {
  try {
    // 示例：调用合约的某个方法
    const manager = await erc1820Contract.methods.getManager(erc1820Address).call();
    console.log('Manager:', manager);

    // 其他读取合约的方法...

  } catch (error) {
    console.error('读取合约过程中出现错误:', error);
  }
}

readContract(); 