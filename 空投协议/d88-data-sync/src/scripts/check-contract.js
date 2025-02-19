require('dotenv').config();
const Web3 = require('web3');

async function checkContract() {
    try {
        console.log('开始检查合约...');
        const web3 = new Web3(process.env.WEB3_PROVIDER_URL);
        
        const address = process.env.CONTRACT_ADDRESS;
        console.log('合约地址:', address);
        
        // 检查合约代码
        const code = await web3.eth.getCode(address);
        console.log('合约代码长度:', code.length);
        console.log('是否是合约:', code.length > 2);
        
        // 尝试获取合约事件
        const contract = new web3.eth.Contract([{
            "anonymous": false,
            "inputs": [
                {
                    "indexed": true,
                    "internalType": "address",
                    "name": "user",
                    "type": "address"
                },
                {
                    "indexed": true,
                    "internalType": "address",
                    "name": "referrer",
                    "type": "address"
                }
            ],
            "name": "ReferralRegistered",
            "type": "event"
        }], address);

        // 获取最近的事件
        const events = await contract.getPastEvents('ReferralRegistered', {
            fromBlock: 'latest',
            toBlock: 'latest'
        });
        
        console.log('合约检查完成');
        
    } catch (error) {
        console.error('检查合约时出错:', error);
    }
}

checkContract(); 