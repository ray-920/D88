const TestTokenSender = artifacts.require("TestTokenSender");
const TestTokenRecipient = artifacts.require("TestTokenRecipient");

// 部署交易哈希
const SENDER_DEPLOY_HASH = "0x03188a8bc36bb01b5c467364ea23b9cbf722e08a5da2effa3f46be26cd95c76e";
const RECIPIENT_DEPLOY_HASH = "0x77b549a26a8416ebfc5b038c7bc71bfc5b45d83026292f42bee10d8e5f27e832";

// TT77Token合约地址
const TT77_TOKEN_ADDRESS = "0xe86348e940Dd7A4F160823145C48221D441c4774";

// TT77Token的ABI
const TT77TokenABI = [
    {
        "constant": true,
        "inputs": [],
        "name": "name",
        "outputs": [{"name": "", "type": "string"}],
        "type": "function"
    },
    {
        "constant": true,
        "inputs": [],
        "name": "symbol",
        "outputs": [{"name": "", "type": "string"}],
        "type": "function"
    },
    {
        "constant": true,
        "inputs": [],
        "name": "granularity",
        "outputs": [{"name": "", "type": "uint256"}],
        "type": "function"
    },
    {
        "constant": true,
        "inputs": [],
        "name": "totalSupply",
        "outputs": [{"name": "", "type": "uint256"}],
        "type": "function"
    },
    {
        "constant": true,
        "inputs": [{"name": "owner", "type": "address"}],
        "name": "balanceOf",
        "outputs": [{"name": "", "type": "uint256"}],
        "type": "function"
    },
    {
        "constant": false,
        "inputs": [
            {"name": "recipient", "type": "address"},
            {"name": "amount", "type": "uint256"},
            {"name": "data", "type": "bytes"}
        ],
        "name": "send",
        "outputs": [],
        "type": "function"
    }
];

contract("分步测试 - ERC777钩子和操作者", accounts => {
    // 合约地址 - 这些地址将通过交易哈希获取
    let SENDER_ADDRESS;
    let RECIPIENT_ADDRESS;
    
    // 测试配置
    const WAIT_TIME = 30000; // 30秒等待时间
    
    let token;
    let sender;
    let recipient;
    const [owner, user1, user2, operator] = accounts;

    // 辅助函数：等待交易确认并获取合约地址
    const getContractAddress = async (txHash) => {
        console.log(`从交易获取合约地址: ${txHash}`);
        const receipt = await web3.eth.getTransactionReceipt(txHash);
        if (!receipt) {
            throw new Error(`无法获取交易收据: ${txHash}`);
        }
        console.log(`合约地址: ${receipt.contractAddress}`);
        return receipt.contractAddress;
    };

    // 辅助函数：等待交易确认
    const waitForTx = async (txHash) => {
        console.log(`等待交易确认: ${txHash}`);
        let receipt = null;
        while (!receipt) {
            receipt = await web3.eth.getTransactionReceipt(txHash);
            if (!receipt) {
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
        }
        console.log(`交易已确认，区块号: ${receipt.blockNumber}`);
        return receipt;
    };

    // 辅助函数：等待指定时间
    const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

    before(async () => {
        try {
            console.log("获取合约地址...");
            
            // 从部署交易获取地址
            SENDER_ADDRESS = await getContractAddress(SENDER_DEPLOY_HASH);
            RECIPIENT_ADDRESS = await getContractAddress(RECIPIENT_DEPLOY_HASH);
            
            console.log("初始化合约实例...");
            
            // 创建合约实例
            token = new web3.eth.Contract(TT77TokenABI, TT77_TOKEN_ADDRESS);
            sender = await TestTokenSender.at(SENDER_ADDRESS);
            recipient = await TestTokenRecipient.at(RECIPIENT_ADDRESS);
            
            console.log("合约实例已创建:");
            console.log("- Token:", TT77_TOKEN_ADDRESS);
            console.log("- Sender:", SENDER_ADDRESS);
            console.log("- Recipient:", RECIPIENT_ADDRESS);

            // 等待初始化完成
            await wait(5000);
        } catch (error) {
            console.error("初始化失败:", error);
            throw error;
        }
    });

    describe("1. 基础功能检查", () => {
        it("1.1 检查合约地址", async () => {
            const senderCode = await web3.eth.getCode(SENDER_ADDRESS);
            const recipientCode = await web3.eth.getCode(RECIPIENT_ADDRESS);
            const tokenCode = await web3.eth.getCode(TT77_TOKEN_ADDRESS);
            
            assert.notEqual(senderCode, "0x", "Sender合约地址无效");
            assert.notEqual(recipientCode, "0x", "Recipient合约地址无效");
            assert.notEqual(tokenCode, "0x", "Token合约地址无效");
        });

        it("1.2 检查代币信息", async () => {
            const name = await token.methods.name().call();
            const symbol = await token.methods.symbol().call();
            const totalSupply = await token.methods.totalSupply().call();
            
            console.log("代币信息:");
            console.log("- 名称:", name);
            console.log("- 符号:", symbol);
            console.log("- 总供应量:", web3.utils.fromWei(totalSupply));
        });
    });

    describe("2. 事件监听测试", () => {
        it("2.1 监听发送事件", async () => {
            console.log("开始监听发送事件...");
            const events = await sender.getPastEvents('TokensToSend', {
                fromBlock: 0,
                toBlock: 'latest'
            });
            console.log("发送事件历史:", events);
        });

        it("2.2 监听接收事件", async () => {
            console.log("开始监听接收事件...");
            const events = await recipient.getPastEvents('TokensReceived', {
                fromBlock: 0,
                toBlock: 'latest'
            });
            console.log("接收事件历史:", events);
        });
    });
}); 