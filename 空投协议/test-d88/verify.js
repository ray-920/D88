const Web3 = require('web3');

async function testConnection() {
    try {
        console.log('开始测试连接...');
        const web3 = new Web3('https://node.dragonfly-chain.com');
        
        const blockNumber = await web3.eth.getBlockNumber();
        console.log('当前区块高度:', blockNumber);
        
        const tx = await web3.eth.getTransaction('0xa5f21133acbe4bf5cc6bae49da7e2ee3a3cee2bb5cef0bafc9520341bb56e3e6');
        console.log('交易信息:', tx ? '找到' : '未找到');
        if(tx) {
            console.log('发送地址:', tx.from);
            console.log('接收地址:', tx.to);
        }
        
    } catch (error) {
        console.error('测试失败:', error);
    }
}

testConnection(); 