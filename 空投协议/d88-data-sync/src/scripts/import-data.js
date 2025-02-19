const { connectMongoDB, redisClient } = require('../config/database');
const fs = require('fs').promises;

async function importData() {
    try {
        // 1. 读取一亿.csv
        const data = await fs.readFile('src/一亿.csv', 'utf8');
        const lines = data.split('\n');
        
        // 2. 解析数据并存入Redis
        for (const line of lines) {
            if (line.includes('0x')) {  // 只处理包含地址的行
                const [address, amount] = line.split(',');
                
                // 从最终奖励反推推荐数量
                const baseAmount = 880494.3396;
                const totalAmount = parseFloat(amount);
                
                // 如果总量大于基础奖励，说明有推荐奖励
                if (totalAmount > baseAmount) {
                    const userData = {
                        address,
                        level1Count: 0,
                        level2Count: 0
                    };
                    
                    // 存入Redis
                    await redisClient.set(
                        `user:${address}`, 
                        JSON.stringify(userData)
                    );
                }
            }
        }
        
        console.log('数据导入完成');
        
    } catch (error) {
        console.error('导入错误:', error);
    } finally {
        process.exit(0);
    }
}

importData(); 