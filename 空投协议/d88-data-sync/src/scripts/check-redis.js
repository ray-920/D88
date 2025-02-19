require('dotenv').config();
const Redis = require('ioredis');

async function checkRedisData() {
    try {
        console.log('开始检查Redis数据...');
        
        const redis = new Redis({
            host: process.env.REDIS_HOST || 'localhost',
            port: process.env.REDIS_PORT || 6379,
            db: process.env.REDIS_DB || 0
        });

        // 获取所有用户key
        const keys = await redis.keys('user:*');
        console.log(`\n找到 ${keys.length} 个用户key`);

        // 检查第一个用户的数据
        if (keys.length > 0) {
            console.log('\n第一个用户数据:');
            const firstKey = keys[0];
            console.log('Key:', firstKey);
            
            // 尝试不同的数据读取方式
            console.log('\n1. 尝试hgetall:');
            const hashData = await redis.hgetall(firstKey);
            console.log(hashData);

            console.log('\n2. 尝试get:');
            const strData = await redis.get(firstKey);
            console.log(strData);

            console.log('\n3. 尝试type:');
            const keyType = await redis.type(firstKey);
            console.log('数据类型:', keyType);
        }

        await redis.quit();
        console.log('\n检查完成');
        
    } catch (error) {
        console.error('检查数据时出错:', error);
    }
}

// 执行检查
checkRedisData(); 