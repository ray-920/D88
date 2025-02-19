/**
 * 区块链网络配置
 */
exports.BLOCKCHAIN = {
    RPC_URL: 'https://node.dragonfly-chain.com',
    NETWORK_ID: 920,
    CONTRACT_ADDRESS: '0xf37a70365686BF2A1148b692B92773D9F58e365C',
    EXPLORER_URL: 'https://www.scandfc.com'
};

/**
 * 数据库配置
 */
exports.DATABASE = {
    MONGODB_URL: process.env.MONGODB_URL || 'mongodb://localhost:27017/d88',
    REDIS_HOST: process.env.REDIS_HOST || 'localhost',
    REDIS_PORT: process.env.REDIS_PORT || 6379
};

/**
 * 业务配置
 */
exports.BUSINESS = {
    // 零地址
    ZERO_ADDRESS: '0x0000000000000000000000000000000000000000',
    // 缓存过期时间（秒）
    CACHE_EXPIRE: 3600,
    // 批处理大小
    BATCH_SIZE: 100,
    // 数据同步间隔（毫秒）- 1小时
    SYNC_INTERVAL: 60 * 60 * 1000
}; 