const Web3 = require('web3');
require('dotenv').config();

// D88代币合约ABI
const tokenABI = [
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

async function testQuery() {
    try {
        console.log('开始测试查询功能...');
        
        // 连接DFC链
        const web3 = new Web3(process.env.WEB3_PROVIDER_URL || 'https://node.dragonfly-chain.com');
        
        // 从环境变量获取私钥
        const privateKey = process.env.TEST_PRIVATE_KEY;
        if (!privateKey) {
            throw new Error('请在.env文件中设置TEST_PRIVATE_KEY');
        }
        
        // 配置测试账户
        const account = web3.eth.accounts.privateKeyToAccount(privateKey);
        web3.eth.accounts.wallet.add(account);
        console.log('测试账户地址:', account.address);
        
        // D88代币合约地址
        const tokenAddress = process.env.D88_CONTRACT_ADDRESS || '0xf37a70365686BF2A1148b692B92773D9F58e365C';
        const tokenContract = new web3.eth.Contract(tokenABI, tokenAddress);
        
        // 空投合约地址
        const airdropAddress = process.env.AIRDROP_CONTRACT_ADDRESS || '0x549308FC3FC6dA72C84a85029171A6dd3536279c';
        
        // 查询账户余额
        const balance = await tokenContract.methods.balanceOf(account.address).call();
        console.log('当前账户余额:', web3.utils.fromWei(balance, 'ether'), 'D88');
        
        // 检查余额是否足够
        const queryAmount = web3.utils.toWei('1.88', 'ether');
        if (web3.utils.toBN(balance).lt(web3.utils.toBN(queryAmount))) {
            throw new Error('账户余额不足1.88 D88');
        }
        
        // 构造查询交易
        console.log('发送查询交易...');
        const tx = await tokenContract.methods.transfer(airdropAddress, queryAmount).send({
            from: account.address,
            gas: process.env.GAS_LIMIT || 200000,
            gasPrice: await web3.eth.getGasPrice()
        });
        
        console.log('交易已发送，哈希:', tx.transactionHash);
        
        // 等待几秒以确保交易被确认
        await new Promise(resolve => setTimeout(resolve, 5000));
        
        // 查询交易后的余额
        const newBalance = await tokenContract.methods.balanceOf(account.address).call();
        console.log('交易后余额:', web3.utils.fromWei(newBalance, 'ether'), 'D88');
        
        // 计算返回的代币数量（查询结果）
        const returnedAmount = web3.utils.toBN(newBalance).sub(web3.utils.toBN(balance)).add(web3.utils.toBN(queryAmount));
        const returnedAmountInEther = web3.utils.fromWei(returnedAmount, 'ether');
        console.log('返回金额:', returnedAmountInEther, 'D88');
        
        // 解析查询结果
        const resultNumber = parseFloat(returnedAmountInEther);
        if (resultNumber === 0.00088) {
            console.log('查询结果: 0个推荐');
        } else if (resultNumber >= 0.01 && resultNumber <= 0.999) {
            const referralCount = Math.floor(resultNumber * 100);
            console.log(`查询结果: ${referralCount}个推荐`);
        } else {
            console.log('返回值格式错误');
        }
        
    } catch (error) {
        console.error('测试失败:', error);
    }
}

// 执行测试
testQuery(); 