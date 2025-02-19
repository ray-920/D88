require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

async function testMongoConnection() {
    try {
        console.log('开始测试MongoDB连接...');
        
        // 连接MongoDB
        await mongoose.connect(process.env.MONGODB_URI, {
            dbName: process.env.MONGODB_DB,
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        
        console.log('MongoDB连接成功');
        
        // 测试数据操作
        const testAddress = '0x1234567890123456789012345678901234567890';
        
        // 创建测试用户
        const testUser = new User({
            address: testAddress,
            directReferrer: '0x0000000000000000000000000000000000000000',
            level1Count: 0,
            level2Count: 0,
            referralTimestamp: Date.now()
        });
        
        // 保存测试用户
        await testUser.save();
        console.log('测试用户创建成功');
        
        // 查询测试用户
        const foundUser = await User.findOne({ address: testAddress });
        console.log('查询结果:', foundUser);
        
        // 删除测试用户
        await User.deleteOne({ address: testAddress });
        console.log('测试用户删除成功');
        
        // 关闭连接
        await mongoose.connection.close();
        console.log('MongoDB连接已关闭');
        
    } catch (error) {
        console.error('MongoDB测试失败:', error);
        process.exit(1);
    }
}

// 运行测试
testMongoConnection(); 