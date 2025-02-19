const { connectMongoDB, redisClient } = require('./config/database');
const fs = require('fs');

async function calculateAirdrop() {
    try {
        console.log('连接数据库...');
        await connectMongoDB();
        console.log('MongoDB连接成功');

        const TOTAL_TOKENS = 100000000;  // 1亿token
        const BASE_WEIGHT = 7;      // 基础权重
        const DIRECT_WEIGHT = 2;    // 直推权重
        const INDIRECT_WEIGHT = 1;  // 间推权重

        // 获取所有用户数据
        const keys = await redisClient.keys('user:*');
        const users = [];
        const tokenDistribution = new Map();
        
        // 获取用户数据并计算总权重
        let totalWeight = 0;
        for (const key of keys) {
            const value = await redisClient.get(key);
            const userData = JSON.parse(value);
            users.push(userData);
            
            // 计算该用户的总权重
            const userWeight = BASE_WEIGHT + 
                             (userData.level1Count || 0) * DIRECT_WEIGHT + 
                             (userData.level2Count || 0) * INDIRECT_WEIGHT;
            totalWeight += userWeight;
            tokenDistribution.set(userData.address, 0);
        }

        // 计算每个权重点对应的代币数，稍微减小一点以确保不会超过总量
        const tokenPerWeight = (TOTAL_TOKENS * 0.99999) / totalWeight;
        console.log(`总权重: ${totalWeight}`);
        console.log(`每个权重点对应代币数: ${tokenPerWeight}`);

        // 计算每个地址获得的代币
        const baseRewards = [];
        const directReferralRewards = [];
        const indirectReferralRewards = [];

        users.forEach(user => {
            // 基础奖励
            const baseToken = BASE_WEIGHT * tokenPerWeight;
            baseRewards.push({
                address: user.address,
                amount: baseToken.toFixed(4)
            });
            tokenDistribution.set(user.address, parseFloat(baseToken.toFixed(4)));

            // 直接推荐奖励
            if (user.level1Count > 0) {
                const directToken = user.level1Count * DIRECT_WEIGHT * tokenPerWeight;
                directReferralRewards.push({
                    address: user.address,
                    amount: directToken.toFixed(4)
                });
                tokenDistribution.set(
                    user.address, 
                    parseFloat((tokenDistribution.get(user.address) + parseFloat(directToken.toFixed(4))).toFixed(4))
                );
            }

            // 间接推荐奖励
            if (user.level2Count > 0) {
                const indirectToken = user.level2Count * INDIRECT_WEIGHT * tokenPerWeight;
                indirectReferralRewards.push({
                    address: user.address,
                    amount: indirectToken.toFixed(4)
                });
                tokenDistribution.set(
                    user.address, 
                    parseFloat((tokenDistribution.get(user.address) + parseFloat(indirectToken.toFixed(4))).toFixed(4))
                );
            }
        });

        // 按数量排序
        directReferralRewards.sort((a, b) => parseFloat(b.amount) - parseFloat(a.amount));
        indirectReferralRewards.sort((a, b) => parseFloat(b.amount) - parseFloat(a.amount));

        // 写入CSV文件
        let csvContent = '1. 基础空投(权重7):\n地址,数量\n';
        baseRewards.forEach(reward => {
            csvContent += `${reward.address},${reward.amount}\n`;
        });

        csvContent += '\n2. 直接推荐奖励(权重2):\n地址,数量\n';
        directReferralRewards.forEach(reward => {
            csvContent += `${reward.address},${reward.amount}\n`;
        });

        csvContent += '\n3. 间接推荐奖励(权重1):\n地址,数量\n';
        indirectReferralRewards.forEach(reward => {
            csvContent += `${reward.address},${reward.amount}\n`;
        });

        csvContent += '\n4. 每个地址获得的总代币:\n地址,数量\n';
        const sortedTotal = Array.from(tokenDistribution.entries())
            .sort((a, b) => b[1] - a[1])
            .map(([address, amount]) => ({
                address,
                amount
            }));
        sortedTotal.forEach(item => {
            csvContent += `${item.address},${item.amount}\n`;
        });

        // 计算实际发放总量
        const actualTotal = Array.from(tokenDistribution.values())
            .reduce((a, b) => a + b, 0);
        csvContent += `\n总计发放token数量: ${actualTotal.toFixed(4)}`;

        // 写入文件
        const filename = 'token_distribution.csv';
        fs.writeFileSync(filename, '\ufeff' + csvContent, 'utf8');
        console.log(`数据已导出到文件: ${filename}`);
        console.log(`总计发放token数量: ${actualTotal.toFixed(4)}`);

    } catch (error) {
        console.error('计算出错:', error);
    } finally {
        process.exit(0);
    }
}

calculateAirdrop(); 