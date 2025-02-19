const Web3 = require('web3');
require('dotenv').config();

// D88代币合约ABI
const tokenABI = [
    {
        "anonymous": false,
        "inputs": [
            {"indexed": true, "name": "from", "type": "address"},
            {"indexed": true, "name": "to", "type": "address"},
            {"indexed": false, "name": "amount", "type": "uint256"}
        ],
        "name": "Transfer",
        "type": "event"
    },
    {
        "inputs": [
            {"name": "to", "type": "address"},
            {"name": "amount", "type": "uint256"}
        ],
        "name": "transfer",
        "outputs": [{"name": "", "type": "bool"}],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [{"name": "account", "type": "address"}],
        "name": "balanceOf",
        "outputs": [{"name": "", "type": "uint256"}],
        "stateMutability": "view",
        "type": "function"
    }
];

async function verifyQueryByTxHash(txHash) {
    try {
        console.log('开始验证查询交易...');
        console.log('交易哈希:', txHash);
        
        // 连接DFC链
        const web3 = new Web3('https://node.dragonfly-chain.com');
        
        // 获取交易详情
        const tx = await web3.eth.getTransaction(txHash);
        if (!tx) {
            throw new Error('未找到交易');
        }
        
        // 获取交易收据
        const receipt = await web3.eth.getTransactionReceipt(txHash);
        if (!receipt) {
            throw new Error('未找到交易收据');
        }
        
        console.log('\n交易详情:');
        console.log('发送地址:', tx.from);
        console.log('区块号:', tx.blockNumber);
        
        // 创建合约实例
        const tokenAddress = '0xf37a70365686BF2A1148b692B92773D9F58e365C';
        const airdropAddress = '0x549308FC3FC6dA72C84a85029171A6dd3536279c';
        const tokenContract = new web3.eth.Contract(tokenABI, tokenAddress);
        
        // 解析交易输入数据
        const decodedInput = web3.eth.abi.decodeParameters(
            ['address', 'uint256'],
            tx.input.slice(10) // 移除方法ID
        );
        const transferAmount = web3.utils.fromWei(decodedInput[1], 'ether');
        console.log('转账金额:', transferAmount, 'D88');
        
        if (transferAmount !== '1.88') {
            console.log('注意: 这不是1.88 D88的查询交易');
            return;
        }
        
        // 获取该区块的Transfer事件
        const events = await tokenContract.getPastEvents('Transfer', {
            fromBlock: tx.blockNumber,
            toBlock: tx.blockNumber
        });
        
        // 查找合约返回的转账事件
        const returnEvent = events.find(event => 
            event.returnValues.from === airdropAddress &&
            event.returnValues.to === tx.from
        );
        
        if (returnEvent) {
            const returnAmount = web3.utils.fromWei(returnEvent.returnValues.amount, 'ether');
            console.log('\n查询结果:');
            console.log('返回金额:', returnAmount, 'D88');
            
            // 解析推荐人数
            const resultNumber = parseFloat(returnAmount);
            if (resultNumber === 0.00088) {
                console.log('推荐人数: 0个');
            } else if (resultNumber >= 0.01 && resultNumber <= 0.999) {
                const referralCount = Math.floor(resultNumber * 100);
                console.log(`推荐人数: ${referralCount}个`);
            } else {
                console.log('返回值格式错误');
            }
        } else {
            console.log('\n未找到合约返回的转账事件');
        }
        
    } catch (error) {
        console.error('验证失败:', error);
    }
}

// 验证指定交易
const txHash = '0xa5f21133acbe4bf5cc6bae49da7e2ee3a3cee2bb5cef0bafc9520341bb56e3e6';
verifyQueryByTxHash(txHash); 