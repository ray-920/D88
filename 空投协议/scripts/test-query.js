const Web3 = require('web3');

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
        const web3 = new Web3('https://node.dragonfly-chain.com');
        
        // D88代币合约地址
        const tokenAddress = '0xf37a70365686BF2A1148b692B92773D9F58e365C';
        const tokenContract = new web3.eth.Contract(tokenABI, tokenAddress);
        
        // 空投合约地址
        const airdropAddress = '0x549308FC3FC6dA72C84a85029171A6dd3536279c';
        
        // 创建新账户
        const account = web3.eth.accounts.create();
        console.log('测试账户地址:', account.address);
        console.log('测试账户私钥:', account.privateKey);
        
        // 查询账户余额
        const balance = await tokenContract.methods.balanceOf(account.address).call();
        console.log('账户余额:', web3.utils.fromWei(balance, 'ether'), 'D88');
        
        // 构造1.88查询交易
        const amount = web3.utils.toWei('1.88', 'ether');
        
        // 构造交易数据
        const data = tokenContract.methods.transfer(airdropAddress, amount).encodeABI();
        
        // 创建交易对象
        const tx = {
            from: account.address,
            to: tokenAddress,
            data: data,
            gas: 200000,
            gasPrice: await web3.eth.getGasPrice()
        };
        
        // 签名交易
        const signedTx = await web3.eth.accounts.signTransaction(tx, account.privateKey);
        
        // 发送交易
        console.log('发送查询交易...');
        console.log('查询金额:', web3.utils.fromWei(amount, 'ether'), 'D88');
        
        const receipt = await web3.eth.sendSignedTransaction(signedTx.rawTransaction);
        console.log('交易哈希:', receipt.transactionHash);
        
        // 查询交易后的余额
        const newBalance = await tokenContract.methods.balanceOf(account.address).call();
        console.log('交易后余额:', web3.utils.fromWei(newBalance, 'ether'), 'D88');
        
    } catch (error) {
        console.error('测试失败:', error);
    }
}

testQuery(); 