const { connectMongoDB, redisClient } = require('../config/database');

async function initializeSystem() {
    try {
        // 1. 测试MongoDB连接
        const db = await connectMongoDB();
        console.log('MongoDB连接成功');

        // 2. 测试Redis连接
        await redisClient.ping();
        console.log('Redis连接成功');

        // 3. 清理Redis缓存
        await redisClient.flushall();
        console.log('Redis缓存已清理');

        // 4. 准备MongoDB集合
        await db.collection('addresses').deleteMany({});
        console.log('MongoDB集合已清理');

        console.log('系统初始化完成');

    } catch (error) {
        console.error('初始化错误:', error);
    } finally {
        process.exit(0);
    }
}

initializeSystem(); 