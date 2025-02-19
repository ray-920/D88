const TestTokenSender = artifacts.require("TestTokenSender");
const TestTokenRecipient = artifacts.require("TestTokenRecipient");

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
        "name": "decimals",
        "outputs": [{"name": "", "type": "uint8"}],
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
        "constant": true,
        "inputs": [],
        "name": "granularity",
        "outputs": [{"name": "", "type": "uint256"}],
        "type": "function"
    },
    {
        "constant": true,
        "inputs": [],
        "name": "defaultOperators",
        "outputs": [{"name": "", "type": "address[]"}],
        "type": "function"
    },
    {
        "constant": true,
        "inputs": [
            {"name": "operator", "type": "address"},
            {"name": "tokenHolder", "type": "address"}
        ],
        "name": "isOperatorFor",
        "outputs": [{"name": "", "type": "bool"}],
        "type": "function"
    },
    {
        "constant": false,
        "inputs": [{"name": "operator", "type": "address"}],
        "name": "authorizeOperator",
        "outputs": [],
        "type": "function"
    },
    {
        "constant": false,
        "inputs": [{"name": "operator", "type": "address"}],
        "name": "revokeOperator",
        "outputs": [],
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
    },
    {
        "constant": false,
        "inputs": [
            {"name": "sender", "type": "address"},
            {"name": "recipient", "type": "address"},
            {"name": "amount", "type": "uint256"},
            {"name": "data", "type": "bytes"},
            {"name": "operatorData", "type": "bytes"}
        ],
        "name": "operatorSend",
        "outputs": [],
        "type": "function"
    }
];

contract("Token Hooks Test", accounts => {
    const TT77_TOKEN_ADDRESS = "0xe86348e940Dd7A4F160823145C48221D441c4774";
    const SENDER_DEPLOY_HASH = "0x03188a8bc36bb01b5c467364ea23b9cbf722e08a5da2effa3f46be26cd95c76e";
    const RECIPIENT_DEPLOY_HASH = "0x77b549a26a8416ebfc5b038c7bc71bfc5b45d83026292f42bee10d8e5f27e832";
    const WAIT_TIME = 30000; // 30秒等待时间
    
    let token;
    let sender;
    let recipient;
    const [owner, user1, user2, operator] = accounts;

    // 等待交易确认的辅助函数
    const waitForTx = async (txHash) => {
        let receipt = null;
        while (!receipt) {
            receipt = await web3.eth.getTransactionReceipt(txHash);
            if (!receipt) {
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
        }
        return receipt;
    };

    // 等待指定时间的辅助函数
    const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

    before(async () => {
        try {
            console.log("等待部署交易确认...");
            await waitForTx(SENDER_DEPLOY_HASH);
            await waitForTx(RECIPIENT_DEPLOY_HASH);
            
            // 创建合约实例
            token = new web3.eth.Contract(TT77TokenABI, TT77_TOKEN_ADDRESS);
            sender = await TestTokenSender.at("0x03188a8bc36bb01b5c467364ea23b9cbf722e08a5da2effa3f46be26cd95c76e");
            recipient = await TestTokenRecipient.at("0x77b549a26a8416ebfc5b038c7bc71bfc5b45d83026292f42bee10d8e5f27e832");
            
            console.log("Test contracts deployed:");
            console.log("- Token Sender:", sender.address);
            console.log("- Token Recipient:", recipient.address);

            // 等待合约部署完全确认
            await wait(WAIT_TIME);
        } catch (error) {
            console.error("Setup failed:", error);
            throw error;
        }
    });

    describe("钩子功能测试", () => {
        it("应该能正确触发发送者钩子", async () => {
            // 监听TokensToSend事件
            const sendPromise = new Promise((resolve, reject) => {
                sender.TokensToSend({}, { fromBlock: 'latest' })
                    .on('data', event => resolve(event))
                    .on('error', reject);
            });

            // 发送代币
            const tx = await token.methods.send(recipient.address, web3.utils.toWei("1"), "0x").send({ from: user1 });
            await waitForTx(tx.transactionHash);
            await wait(WAIT_TIME);

            // 等待事件
            const event = await sendPromise;
            assert.equal(event.args.operator, user1);
            assert.equal(event.args.from, user1);
            assert.equal(event.args.to, recipient.address);
        });

        it("应该能正确触发接收者钩子", async () => {
            // 监听TokensReceived事件
            const receivePromise = new Promise((resolve, reject) => {
                recipient.TokensReceived({}, { fromBlock: 'latest' })
                    .on('data', event => resolve(event))
                    .on('error', reject);
            });

            // 发送代币
            const tx = await token.methods.send(recipient.address, web3.utils.toWei("1"), "0x").send({ from: user1 });
            await waitForTx(tx.transactionHash);
            await wait(WAIT_TIME);

            // 等待事件
            const event = await receivePromise;
            assert.equal(event.args.operator, user1);
            assert.equal(event.args.from, user1);
            assert.equal(event.args.to, recipient.address);
        });
    });

    describe("操作者功能测试", () => {
        it("应该能授权和撤销操作者", async () => {
            // 授权操作者
            const authTx = await token.methods.authorizeOperator(operator).send({ from: user1 });
            await waitForTx(authTx.transactionHash);
            await wait(WAIT_TIME);

            let isOperator = await token.methods.isOperatorFor(operator, user1).call();
            assert.equal(isOperator, true, "操作者应该被正确授权");

            // 撤销操作者
            const revokeTx = await token.methods.revokeOperator(operator).send({ from: user1 });
            await waitForTx(revokeTx.transactionHash);
            await wait(WAIT_TIME);

            isOperator = await token.methods.isOperatorFor(operator, user1).call();
            assert.equal(isOperator, false, "操作者应该被正确撤销");
        });

        it("操作者应该能代表用户发送代币", async () => {
            // 授权操作者
            const authTx = await token.methods.authorizeOperator(operator).send({ from: user1 });
            await waitForTx(authTx.transactionHash);
            await wait(WAIT_TIME);

            // 监听接收事件
            const receivePromise = new Promise((resolve, reject) => {
                recipient.TokensReceived({}, { fromBlock: 'latest' })
                    .on('data', event => resolve(event))
                    .on('error', reject);
            });

            // 操作者发送代币
            const sendTx = await token.methods.operatorSend(
                user1,
                recipient.address,
                web3.utils.toWei("1"),
                "0x",
                "0x"
            ).send({ from: operator });
            await waitForTx(sendTx.transactionHash);
            await wait(WAIT_TIME);

            // 验证事件
            const event = await receivePromise;
            assert.equal(event.args.operator, operator);
            assert.equal(event.args.from, user1);
            assert.equal(event.args.to, recipient.address);
        });
    });
}); 