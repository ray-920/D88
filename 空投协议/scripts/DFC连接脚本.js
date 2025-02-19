const { getWeb3, getContractInstance } = require('../config/connections');
const CONTRACT_ABI = require('../config/abi.json');

// 连接配置
const RETRY_TIMES = 3;           // 重试次数
const RETRY_DELAY = 2000;        // 重试延迟(ms)
const BLOCK_CONFIRM = 12;        // 区块确认数

// 连接DFC链
async function connectDFC() {
    try {
        console.log('开始连接DFC链...');
        const web3 = getWeb3();
        
        // 检查网络连接
        const networkId = await web3.eth.net.getId();
        if (networkId !== parseInt(process.env.CHAIN_ID)) {
            throw new Error(`网络ID不匹配: 期望 ${process.env.CHAIN_ID}, 实际 ${networkId}`);
        }
        console.log('网络ID:', networkId);

        // 获取区块信息
        const blockNumber = await web3.eth.getBlockNumber();
        console.log('当前区块高度:', blockNumber);

        // 获取Gas价格
        const gasPrice = await web3.eth.getGasPrice();
        console.log('当前Gas价格:', web3.utils.fromWei(gasPrice, 'gwei'), 'Gwei');

        return web3;
    } catch (error) {
        console.error('DFC链连接失败:', error);
        throw error;
    }
}

// 连接合约
async function connectContract(web3) {
    try {
        console.log('\n开始连接合约...');
        const contract = getContractInstance(web3, CONTRACT_ABI);
        console.log('合约地址:', process.env.CONTRACT_ADDRESS);
        return contract;
    } catch (error) {
        console.error('合约连接失败:', error);
        throw error;
    }
}

// 发送交易
async function sendTransaction(web3, contract, method, params = [], value = '0') {
    try {
        const account = web3.eth.accounts.privateKeyToAccount(process.env.PRIVATE_KEY);
        const nonce = await web3.eth.getTransactionCount(account.address);
        const gasPrice = await web3.eth.getGasPrice();
        
        // 构建交易
        const tx = {
            from: account.address,
            to: process.env.CONTRACT_ADDRESS,
            value: value,
            gas: process.env.GAS_LIMIT,
            gasPrice: gasPrice,
            nonce: nonce,
            data: contract.methods[method](...params).encodeABI()
        };

        // 签名交易
        const signedTx = await web3.eth.accounts.signTransaction(tx, process.env.PRIVATE_KEY);
        
        // 发送交易
        console.log('发送交易...');
        const receipt = await web3.eth.sendSignedTransaction(signedTx.rawTransaction);
        
        // 等待确认
        await waitForConfirmations(web3, receipt.transactionHash, BLOCK_CONFIRM);
        
        return receipt;
    } catch (error) {
        console.error('交易发送失败:', error);
        throw error;
    }
}

// 等待区块确认
async function waitForConfirmations(web3, txHash, confirmations) {
    console.log(`等待 ${confirmations} 个区块确认...`);
    const receipt = await web3.eth.getTransactionReceipt(txHash);
    const initialBlock = receipt.blockNumber;
    
    while (true) {
        const currentBlock = await web3.eth.getBlockNumber();
        const confirmationBlocks = currentBlock - initialBlock;
        
        if (confirmationBlocks >= confirmations) {
            console.log(`交易已确认 ${confirmationBlocks} 个区块`);
            break;
        }
        
        await new Promise(resolve => setTimeout(resolve, 2000));
    }
}

// 重试机制
async function withRetry(fn, retryTimes = RETRY_TIMES) {
    for (let i = 0; i < retryTimes; i++) {
        try {
            return await fn();
        } catch (error) {
            if (i === retryTimes - 1) throw error;
            console.log(`重试第 ${i + 1} 次...`);
            await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
        }
    }
}

// 主函数
async function main() {
    try {
        // 连接DFC链
        const web3 = await withRetry(() => connectDFC());
        
        // 连接合约
        const contract = await withRetry(() => connectContract(web3));
        
        console.log('\nDFC链和合约连接成功!');
        
        return {
            web3,
            contract,
            sendTransaction: (method, params, value) => sendTransaction(web3, contract, method, params, value)
        };
    } catch (error) {
        console.error('\n连接失败:', error);
        process.exit(1);
    }
}

module.exports = {
    connectDFC,
    connectContract,
    sendTransaction,
    main
};

// 如果直接运行此脚本，则执行测试
if (require.main === module) {
    main().then(() => {
        console.log('测试完成');
        process.exit(0);
    });
} 