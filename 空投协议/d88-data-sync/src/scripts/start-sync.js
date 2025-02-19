const { connectMongoDB } = require('../config/database');
const BlockchainSyncService = require('../services/blockchain/sync');

async function start() {
  try {
    // 连接MongoDB
    await connectMongoDB();
    console.log('MongoDB connected successfully');

    // 实例化并初始化同步服务
    const syncService = new BlockchainSyncService();
    await syncService.initialize();
    console.log('Blockchain sync service started successfully');
  } catch (error) {
    console.error('Failed to start blockchain sync service:', error);
    process.exit(1);
  }
}

start();
