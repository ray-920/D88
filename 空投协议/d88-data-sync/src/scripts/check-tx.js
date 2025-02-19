require('dotenv').config();
const Web3 = require('web3');

const web3 = new Web3('https://node.dragonfly-chain.com');

// D88代币合约ABI
const tokenABI = [
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": true,
                "name": "from",
                "type": "address"
            },
            {
                "indexed": true,
                "name": "to",
                "type": "address"
            },
            {
                "indexed": false,
                "name": "value",
                "type": "uint256"
            }
        ],
        "name": "Transfer",
        "type": "event"
    }
];

async function checkTransaction(txHash) {
    try {
        console.log('开始查询交易详情...');
        console.log(`交易哈希: ${txHash}`);
        
        // 获取交易详情
        const tx = await web3.eth.getTransaction(txHash);
        const receipt = await web3.eth.getTransactionReceipt(txHash);
        
        console.log('\n交易详情:');
        console.log(`区块号: ${tx.blockNumber}`);
        console.log(`发送地址: ${tx.from}`);
        console.log(`接收地址: ${tx.to}`);
        console.log(`Gas使用量: ${receipt.gasUsed}`);
        
        // 解析Transfer事件
        console.log('\n转账事件:');
        for (const log of receipt.logs) {
            if (log.topics[0] === web3.utils.sha3('Transfer(address,address,uint256)')) {
                const from = '0x' + log.topics[1].slice(26);
                const to = '0x' + log.topics[2].slice(26);
                const value = web3.utils.fromWei(log.data, 'ether');
                console.log(`从: ${from}`);
                console.log(`到: ${to}`);
                console.log(`金额: ${value} D88`);
            }
        }
        
        console.log('\n查询完成');
        
    } catch (error) {
        console.error('查询交易详情时出错:', error);
    }
}

// 从命令行参数获取交易哈希
const txHash = process.argv[2];
if (!txHash) {
    console.error('请提供要查询的交易哈希');
    process.exit(1);
}

checkTransaction(txHash); 