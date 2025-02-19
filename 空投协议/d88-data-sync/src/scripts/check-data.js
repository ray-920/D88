require('dotenv').config();
const { MongoClient } = require('mongodb');

async function checkUserData(address) {
    try {
        console.log('开始查询用户数据...');
        
        // 连接MongoDB
        const client = await MongoClient.connect('mongodb://localhost:27017');
        const db = client.db('d88');
        const collection = db.collection('users');
        
        // 查询用户数据
        const user = await collection.findOne({ address: address.toLowerCase() });
        
        if (user) {
            console.log('\n用户数据:');
            console.log(`地址: ${user.address}`);
            console.log(`直接推荐数: ${user.level1Count || 0}`);
            console.log(`间接推荐数: ${user.level2Count || 0}`);
            console.log(`直接推荐人: ${user.directReferrer || '无'}`);
            console.log(`间接推荐人: ${user.indirectReferrer || '无'}`);
            console.log(`注册时间: ${user.registrationTime || '未知'}`);
        } else {
            console.log('\n未找到该用户数据');
        }
        
        await client.close();
        console.log('\n数据查询完成');
        
    } catch (error) {
        console.error('查询数据时出错:', error);
    }
}

// 从命令行参数获取地址
const address = process.argv[2];
if (!address) {
    console.error('请提供要查询的地址');
    process.exit(1);
}

checkUserData(address); 