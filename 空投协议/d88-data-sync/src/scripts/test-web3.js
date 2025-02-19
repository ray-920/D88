const Web3 = require('web3');

async function testWeb3() {
    try {
        // 使用HTTP连接
        const web3 = new Web3('https://node.dragonfly-chain.com');
        
        // 测试连接
        const blockNumber = await web3.eth.getBlockNumber();
        console.log('当前区块高度:', blockNumber);
        
        // 测试合约连接
        const CONTRACT_ADDRESS = '0xf37a70365686BF2A1148b692B92773D9F58e365C';
        const CONTRACT_ABI = [
            {
                "anonymous": false,
                "inputs": [
                    {
                        "indexed": true,
                        "name": "user",
                        "type": "address"
                    },
                    {
                        "indexed": true,
                        "name": "referrer",
                        "type": "address"
                    }
                ],
                "name": "ReferralRegistered",
                "type": "event"
            }
        ];
        
        const contract = new web3.eth.Contract(CONTRACT_ABI, CONTRACT_ADDRESS);
        console.log('合约连接成功');
        
        // 测试获取事件
        const events = await contract.getPastEvents('ReferralRegistered', {
            fromBlock: blockNumber - 100,
            toBlock: 'latest'
        });
        console.log('找到事件数量:', events.length);
        
    } catch (error) {
        console.error('Web3连接错误:', error);
    }
}

testWeb3(); 