require('dotenv').config();
const Web3 = require('web3');

async function testWeb3Connection() {
    try {
        console.log('开始测试Web3连接...');
        console.log('Provider URL:', process.env.WEB3_PROVIDER_URL);
        
        const web3 = new Web3(process.env.WEB3_PROVIDER_URL);
        
        // 测试连接
        const networkId = await web3.eth.net.getId();
        console.log('网络ID:', networkId);
        
        const blockNumber = await web3.eth.getBlockNumber();
        console.log('当前区块高度:', blockNumber);
        
        // 测试合约连接
        console.log('合约地址:', process.env.CONTRACT_ADDRESS);
        const code = await web3.eth.getCode(process.env.CONTRACT_ADDRESS);
        console.log('合约代码长度:', code.length);
        
        console.log('Web3连接测试完成!');
    } catch (error) {
        console.error('Web3连接测试失败:', error);
    }
}

testWeb3Connection();