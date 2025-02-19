const { connectMongoDB } = require('./config/database');
const web3Service = require('./services/web3Service');

async function manualSync() {
    try {
        // 连接数据库
        await connectMongoDB();
        console.log('数据库连接成功');

        // 执行手动同步
        await web3Service.manualSync();
        
        process.exit(0);
    } catch (error) {
        console.error('同步失败:', error);
        process.exit(1);
    }
}

manualSync(); 