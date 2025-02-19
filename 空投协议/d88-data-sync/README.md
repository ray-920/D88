# 推广协议数据同步与奖励计算工具

## 项目说明
本项目用于同步区块链推广协议数据到MongoDB和Redis，并计算用户奖励分配。

## 环境要求
- Node.js >= 14.0.0
- MongoDB
- Redis
- Web3

## 安装步骤
1. 安装依赖:
```bash
npm install mongodb@4.1.0
npm install web3@1.10.0
npm install ioredis
npm install dotenv
```

2. 配置环境变量(.env):
```
# Web3配置
WEB3_PROVIDER_URL=https://node.dragonfly-chain.com
CONTRACT_ADDRESS=0xf37a70365686BF2A1148b692B92773D9F58e365C
NETWORK_ID=920

# MongoDB配置
MONGODB_URI=mongodb://localhost:27017
MONGODB_DB=d88
MONGODB_COLLECTION=users

# Redis配置
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_DB=0

# 奖励配置
TOTAL_SUPPLY=100000000
WEIGHT_BASE=7
WEIGHT_DIRECT=2
WEIGHT_INDIRECT=1
```

## 功能说明

### 1. 区块链数据同步
- `blockchain-sync.js`: 从区块链同步推广关系数据到MongoDB
- 支持增量同步和手动触发
- 记录同步时间戳，避免重复同步

### 2. Redis数据同步
- `sync-to-redis.js`: 将MongoDB数据同步到Redis
- 使用hash结构存储用户数据
- 包含直接和间接推荐统计

### 3. 奖励计算
- `calculate-rewards.js`: 计算用户奖励分配
- 基于权重计算基础空投、直接推荐和间接推荐奖励
- 生成详细的CSV格式报告

## 使用说明

1. 同步区块链数据:
```bash
node src/scripts/blockchain-sync.js --manual
```

2. 同步Redis数据:
```bash
node src/scripts/sync-to-redis.js
```

3. 计算奖励分配:
```bash
node src/scripts/calculate-rewards.js
```

## 重要说明
1. 首次运行需要完整同步历史数据
2. 建议按顺序执行：区块链同步 -> Redis同步 -> 奖励计算
3. 每次计算奖励前确保数据已完成同步 