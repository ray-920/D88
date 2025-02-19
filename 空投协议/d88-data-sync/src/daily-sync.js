const { connectMongoDB } = require('./config/database');
const web3Service = require('./services/web3Service');

async function startDailySync() {
    try {
        // 连接数据库
        await connectMongoDB();
        console.log('数据库连接成功');

        // 启动定时同步
        web3Service.startDailySync();
        
        // 保持进程运行
        process.on('SIGINT', () => {
            web3Service.stopDailySync();
            console.log('停止同步服务');
            process.exit(0);
        });
    } catch (error) {
        console.error('服务启动失败:', error);
        process.exit(1);
    }
}

startDailySync(); 