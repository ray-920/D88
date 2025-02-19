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

// 合约地址
const tokenAddress = '0xf37a70365686BF2A1148b692B92773D9F58e365C';
const airdropAddress = '0x549308fc3fc6da72c84a85029171a6dd3536279c';
const tokenContract = new web3.eth.Contract(tokenABI, tokenAddress);

async function checkReturnTransfer(blockNumber, userAddress) {
    try {
        console.log('开始查询返回转账...');
        console.log(`起始区块: ${blockNumber}`);
        console.log(`结束区块: ${blockNumber + 100}`);
        console.log(`用户地址: ${userAddress}`);
        
        // 查询后续100个区块的Transfer事件
        const events = await tokenContract.getPastEvents('Transfer', {
            filter: { 
                from: airdropAddress,
                to: userAddress
            },
            fromBlock: blockNumber,
            toBlock: blockNumber + 100
        });
        
        console.log('\n返回转账记录:');
        for (const event of events) {
            const amount = web3.utils.fromWei(event.returnValues.value, 'ether');
            console.log(`\n交易哈希: ${event.transactionHash}`);
            console.log(`区块号: ${event.blockNumber}`);
            console.log(`从: ${event.returnValues.from}`);
            console.log(`到: ${event.returnValues.to}`);
            console.log(`金额: ${amount} D88`);
        }
        
        console.log(`\n共找到 ${events.length} 条返回转账记录`);
        console.log('\n查询完成');
        
    } catch (error) {
        console.error('查询返回转账时出错:', error);
    }
}

// 从命令行参数获取区块号和地址
const blockNumber = process.argv[2];
const userAddress = process.argv[3];

if (!blockNumber || !userAddress) {
    console.error('请提供区块号和用户地址');
    process.exit(1);
}

checkReturnTransfer(blockNumber, userAddress); 