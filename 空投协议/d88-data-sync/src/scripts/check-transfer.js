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

// D88代币合约地址
const tokenAddress = '0xf37a70365686BF2A1148b692B92773D9F58e365C';
const tokenContract = new web3.eth.Contract(tokenABI, tokenAddress);

async function checkTransfers(address) {
    try {
        console.log('开始查询转账记录...');
        console.log(`查询地址: ${address}`);
        
        // 获取最新区块
        const latestBlock = await web3.eth.getBlockNumber();
        console.log(`当前区块高度: ${latestBlock}`);
        
        // 查询最近10000个区块的转出记录
        const fromEvents = await tokenContract.getPastEvents('Transfer', {
            filter: { from: address },
            fromBlock: latestBlock - 10000,
            toBlock: 'latest'
        });
        
        console.log('\n转出记录:');
        for (const event of fromEvents) {
            const amount = web3.utils.fromWei(event.returnValues.value, 'ether');
            console.log(`\n交易哈希: ${event.transactionHash}`);
            console.log(`区块号: ${event.blockNumber}`);
            console.log(`接收地址: ${event.returnValues.to}`);
            console.log(`转账金额: ${amount} D88`);
        }
        
        console.log(`\n共找到 ${fromEvents.length} 条转出记录`);
        console.log('\n查询完成');
        
    } catch (error) {
        console.error('查询转账记录时出错:', error);
    }
}

// 从命令行参数获取地址
const address = process.argv[2];
if (!address) {
    console.error('请提供要查询的地址');
    process.exit(1);
}

checkTransfers(address); 