require('dotenv').config();
const Redis = require('ioredis');
const fs = require('fs');

// 配置参数
const CONFIG = {
    TOTAL_AMOUNT: 100000000, // 总发放数量1亿
    WEIGHT: {
        BASE: 7,
        DIRECT: 2,
        INDIRECT: 1
    }
};

async function calculateRewards() {
    try {
        console.log('开始计算空投奖励...');
        
        // 连接Redis
        const redis = new Redis({
            host: process.env.REDIS_HOST || 'localhost',
            port: process.env.REDIS_PORT || 6379,
            db: process.env.REDIS_DB || 0
        });

        // 获取所有用户数据
        const keys = await redis.keys('user:*');
        const users = [];
        
        for (const key of keys) {
            const userData = await redis.hgetall(key);
            users.push(userData);
        }

        // 计算总推荐数
        let totalLevel1 = 0;
        let totalLevel2 = 0;
        users.forEach(user => {
            totalLevel1 += parseInt(user.level1Count) || 0;
            totalLevel2 += parseInt(user.level2Count) || 0;
        });

        // 计算每单位奖励
        const totalWeight = CONFIG.WEIGHT.BASE * users.length + 
                          CONFIG.WEIGHT.DIRECT * totalLevel1 + 
                          CONFIG.WEIGHT.INDIRECT * totalLevel2;
        
        const unitReward = CONFIG.TOTAL_AMOUNT / totalWeight;

        // 计算各项基础奖励
        const BASE_REWARD = unitReward * CONFIG.WEIGHT.BASE;
        const DIRECT_REWARD = unitReward * CONFIG.WEIGHT.DIRECT;
        const INDIRECT_REWARD = unitReward * CONFIG.WEIGHT.INDIRECT;

        console.log('\n计算参数:');
        console.log(`总权重: ${totalWeight}`);
        console.log(`单位奖励: ${unitReward.toFixed(4)}`);
        console.log(`基础空投: ${BASE_REWARD.toFixed(4)}`);
        console.log(`直接推荐单位奖励: ${DIRECT_REWARD.toFixed(4)}`);
        console.log(`间接推荐单位奖励: ${INDIRECT_REWARD.toFixed(4)}`);

        // 计算奖励
        const rewards = {
            baseAirdrop: [],
            directReferral: [],
            indirectReferral: [],
            total: []
        };

        // 计算每个用户的奖励
        for (const user of users) {
            const address = user.address;
            const level1Count = parseInt(user.level1Count) || 0;
            const level2Count = parseInt(user.level2Count) || 0;

            // 1. 基础空投
            rewards.baseAirdrop.push({
                address,
                amount: BASE_REWARD
            });

            // 2. 直接推荐奖励
            if (level1Count > 0) {
                const directReward = level1Count * DIRECT_REWARD;
                rewards.directReferral.push({
                    address,
                    amount: directReward
                });
            }

            // 3. 间接推荐奖励
            if (level2Count > 0) {
                const indirectReward = level2Count * INDIRECT_REWARD;
                rewards.indirectReferral.push({
                    address,
                    amount: indirectReward
                });
            }

            // 4. 计算总奖励
            const totalReward = BASE_REWARD + 
                (level1Count * DIRECT_REWARD) + 
                (level2Count * INDIRECT_REWARD);
            
            rewards.total.push({
                address,
                amount: totalReward
            });
        }

        // 按奖励金额排序
        rewards.total.sort((a, b) => b.amount - a.amount);

        // 生成CSV文件
        const csvContent = generateCSV(rewards);
        fs.writeFileSync('rewards.csv', csvContent);

        // 输出统计信息
        console.log('\n奖励计算完成:');
        console.log(`总用户数: ${users.length}`);
        console.log(`基础空投用户数: ${rewards.baseAirdrop.length}`);
        console.log(`直接推荐奖励用户数: ${rewards.directReferral.length}`);
        console.log(`间接推荐奖励用户数: ${rewards.indirectReferral.length}`);
        
        const totalAmount = rewards.total.reduce((sum, item) => sum + item.amount, 0);
        console.log(`总发放代币数量: ${totalAmount.toFixed(4)}`);

        await redis.quit();
        
    } catch (error) {
        console.error('计算奖励时出错:', error);
    }
}

function generateCSV(rewards) {
    let content = '';

    // 1. 基础空投
    content += '1. 基础空投(权重7):总人数' + rewards.baseAirdrop.length + '\n';
    content += '地址,数量\n';
    rewards.baseAirdrop.forEach(item => {
        content += `${item.address},${item.amount.toFixed(4)}\n`;
    });
    content += '\n';

    // 2. 直接推荐奖励
    content += '2. 直接推荐奖励(权重2):总人数' + rewards.directReferral.length + '\n';
    content += '地址,数量\n';
    rewards.directReferral.sort((a, b) => b.amount - a.amount)
        .forEach(item => {
            content += `${item.address},${item.amount.toFixed(4)}\n`;
        });
    content += '\n';

    // 3. 间接推荐奖励
    content += '3. 间接推荐奖励(权重1):总人数' + rewards.indirectReferral.length + '\n';
    content += '地址,数量\n';
    rewards.indirectReferral.sort((a, b) => b.amount - a.amount)
        .forEach(item => {
            content += `${item.address},${item.amount.toFixed(4)}\n`;
        });
    content += '\n';

    // 4. 总奖励
    content += '4. 每个地址获得的总代币:总人数' + rewards.total.length + '\n';
    content += '地址,数量\n';
    rewards.total.forEach(item => {
        content += `${item.address},${item.amount.toFixed(4)}\n`;
    });

    // 5. 总计
    const totalAmount = rewards.total.reduce((sum, item) => sum + item.amount, 0);
    content += '\n总计发放token数量: ' + totalAmount.toFixed(4);

    return content;
}

// 执行计算
calculateRewards(); 