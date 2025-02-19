require('dotenv').config();

module.exports = {
  mongodb: {
    url: process.env.MONGODB_URL || 'mongodb://localhost:27017/d88',
    options: {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    }
  },
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: process.env.REDIS_PORT || 6379,
  },
  blockchain: {
    rpc: process.env.BLOCKCHAIN_RPC || 'https://node.dragonfly-chain.com',
    networkId: process.env.NETWORK_ID || 920,
    contractAddress: process.env.CONTRACT_ADDRESS,
  }
};
