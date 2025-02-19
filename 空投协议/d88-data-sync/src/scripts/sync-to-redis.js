require('dotenv').config();
const { MongoClient } = require('mongodb');
const Redis = require('ioredis');

async function syncToRedis() {
    try {
        // 连接MongoDB
        const mongoClient = await MongoClient.connect('mongodb://localhost:27017');
        const db = mongoClient.db('d88');
        const collection = db.collection('users');
        console.log('MongoDB连接成功');

        // 连接Redis
        const redis = new Redis({
            host: process.env.REDIS_HOST || 'localhost',
            port: process.env.REDIS_PORT || 6379,
            db: process.env.REDIS_DB || 0
        });

        // 清理Redis缓存
        const keys = await redis.keys('user:*');
        if (keys.length > 0) {
            await redis.del(...keys);
        }
        console.log('Redis缓存已清理');

        // 获取MongoDB数据
        const users = await collection.find().toArray();
        let successCount = 0;

        // 同步到Redis
        for (const user of users) {
            const key = `user:${user.address}`;
            const data = {
                address: user.address,
                level1Count: user.level1Count || 0,
                level2Count: user.level2Count || 0,
                directReferrer: user.directReferrer || '0x0000000000000000000000000000000000000000',
                indirectReferrer: user.indirectReferrer || '0x0000000000000000000000000000000000000000'
            };

            // 使用hmset存储为hash结构
            await redis.hmset(key, data);
            successCount++;
        }

        console.log(`成功同步 ${successCount}/${users.length} 条数据到Redis`);

        // 显示一个示例数据
        if (users.length > 0) {
            const sampleKey = `user:${users[0].address}`;
            const sampleData = await redis.hgetall(sampleKey);
            console.log('Redis中的示例数据:', sampleData);
        }

        await mongoClient.close();
        await redis.quit();

    } catch (error) {
        console.error('同步数据时出错:', error);
    }
}

// 执行同步
syncToRedis(); 