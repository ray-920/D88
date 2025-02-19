# D88 Token 智能合约项目

## 项目说明
D88 Token是一个基于ERC20标准的代币合约，集成了推荐奖励系统。主要功能包括代币发行、转账和推荐奖励分配。

### 核心功能
- 基础代币功能（ERC20标准）
- 推荐奖励系统
  - 推荐人转账 0.88 给新用户
  - 自动分配 0.66 给新用户，0.22 给合约
  - 新用户确认推荐关系
- 安全机制
  - 防重入保护
  - 交易金额验证
  - Gas优化

## 环境要求
- Node.js v16.0.0 或更高版本
- Windows 10/11 或 Linux/MacOS
- Git
- Visual Studio Code（推荐）

## 依赖版本
```json
{
  "dependencies": {
    "@openzeppelin/contracts": "^4.8.0",
    "@truffle/hdwallet-provider": "^2.1.0",
    "dotenv": "^16.0.3",
    "web3": "^1.8.1"
  },
  "devDependencies": {
    "truffle": "^5.7.0"
  }
}
```

## 安装步骤

1. 克隆项目
```bash
git clone [项目地址]
cd d88-token
```

2. 安装依赖
```bash
npm install
```

3. 配置环境变量
创建 `.env` 文件并填入以下信息：
```env
BLOCKCHAIN_RPC="https://your-rpc-endpoint"
NETWORK_ID="your-network-id"
PRIVATE_KEY="your-private-key"  # 不要带0x前缀
```

4. 编译合约
```bash
npx truffle compile
```

5. 部署合约
```bash
npx truffle migrate --network dragonfly
```

## 项目结构
```
d88-token/
├── contracts/
│   └── D88TokenWithReferral.sol
├── migrations/
│   └── 1_deploy_d88token.js
├── test/
│   └── d88token.test.js
├── truffle-config.js
├── .env
├── package.json
└── README.md
```

## 部署验证
1. 确认编译成功
```bash
# 编译输出应该在 build/contracts/ 目录下
ls build/contracts/D88TokenWithReferral.json
```

2. 验证部署结果
- 检查控制台输出的合约地址
- 确认交易已被确认（至少2个区块）
- 记录部署信息（地址、交易哈希等）

## 常见问题
1. Gas不足
   - 确保账户有足够的原生代币支付Gas
   - 可以适当调整 `truffle-config.js` 中的Gas设置

2. 编译错误
   - 检查Solidity版本是否匹配
   - 确认所有依赖都已正确安装

3. 网络连接问题
   - 验证RPC节点地址是否正确
   - 确认网络ID配置正确

## 安全建议
1. 私钥保护
   - 永远不要公开你的私钥
   - 使用环境变量管理敏感信息
   - 定期更换测试网络的私钥

2. 合约交互
   - 总是验证交易参数
   - 保持足够的Gas余额
   - 遵循推荐流程规范

## 测试
```bash
# 运行所有测试
npx truffle test

# 运行特定测试
npx truffle test ./test/d88token.test.js
```

## 维护说明
- 定期更新依赖包
- 关注安全漏洞公告
- 保持文档同步更新

## 贡献指南
1. Fork 项目
2. 创建特性分支
3. 提交更改
4. 发起 Pull Request

## 许可证
MIT License

## 联系方式
- 项目维护者：[联系方式]
- 技术支持：[支持渠道]

## 更新日志
详见 [CHANGELOG.md](./CHANGELOG.md)

---
*最后更新：2024-02-19* 