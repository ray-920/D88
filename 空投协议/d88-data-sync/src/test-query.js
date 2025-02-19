const { connectMongoDB, redisClient } = require('./config/database');
const User = require('./models/user');
const fs = require('fs');

async function exportAddressesToCSV() {
    try {
        console.log('连接数据库...');
        await connectMongoDB();
        console.log('MongoDB连接成功');

        // 获取所有用户键
        const keys = await redisClient.keys('user:*');
        console.log(`\n总用户数: ${keys.length}\n`);

        // 收集所有用户数据
        const users = [];
        for (const key of keys) {
            const value = await redisClient.get(key);
            const userData = JSON.parse(value);
            users.push(userData);
        }

        // 按注册时间排序
        users.sort((a, b) => new Date(a.registrationTime) - new Date(b.registrationTime));

        // 准备CSV内容
        let csvContent = 'No.,Address,RegistrationTime\n';
        users.forEach((user, index) => {
            csvContent += `${index + 1},${user.address},${new Date(user.registrationTime).toLocaleString()}\n`;
        });

        // 写入CSV文件
        const filename = 'user_addresses.csv';
        fs.writeFileSync(filename, csvContent);
        console.log(`数据已导出到文件: ${filename}`);
        console.log(`总计导出 ${users.length} 个地址`);

    } catch (error) {
        console.error('导出出错:', error);
    } finally {
        process.exit(0);
    }
}

exportAddressesToCSV(); 