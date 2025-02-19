// TT77Token的最小ABI
const TT77TokenABI = [
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
    }
];

contract("检查TT77Token代币状态", accounts => {
    const TT77_TOKEN_ADDRESS = "0xe86348e940Dd7A4F160823145C48221D441c4774";
    let token;

    before(async () => {
        // 检查合约代码
        const code = await web3.eth.getCode(TT77_TOKEN_ADDRESS);
        console.log("\n合约状态检查:");
        console.log("- 合约地址:", TT77_TOKEN_ADDRESS);
        console.log("- 是否已部署:", code !== "0x" ? "是" : "否");
        console.log("- 代码长度:", code.length);

        if(code === "0x") {
            console.log("警告: 该地址没有合约代码!");
            return;
        }

        // 创建合约实例
        token = new web3.eth.Contract(TT77TokenABI, TT77_TOKEN_ADDRESS);
        console.log("已连接到合约地址:", TT77_TOKEN_ADDRESS);
    });

    it("检查代币余额", async () => {
        try {
            // 获取总供应量
            const totalSupply = await token.methods.totalSupply().call();
            console.log("\n代币信息:");
            console.log("- 总供应量:", web3.utils.fromWei(totalSupply), "TT77");

            // 检查部署者账户余额
            const deployerBalance = await token.methods.balanceOf("0x549308FC3FC6dA72C84a85029171A6dd3536279c").call();
            console.log("- 部署者余额:", web3.utils.fromWei(deployerBalance), "TT77");

        } catch (error) {
            console.error("读取余额失败:", error.message);
            // 获取更多错误信息
            try {
                const result = await web3.eth.call({
                    to: TT77_TOKEN_ADDRESS,
                    data: token.methods.totalSupply().encodeABI()
                });
                console.log("调用结果:", result);
            } catch (callError) {
                console.error("调用详情:", callError.message);
            }
        }
    });
}); 