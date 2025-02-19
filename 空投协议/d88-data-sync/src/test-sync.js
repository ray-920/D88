const { connectMongoDB } = require('./config/database');
const web3Service = require('./services/web3Service');

async function startService() {
    try {
        // 连接数据库
        await connectMongoDB();
        console.log('数据库连接成功');

        // 启动事件监听
        web3Service.startListening();
        
        // 保持进程运行
        process.on('SIGINT', () => {
            console.log('停止监听服务');
            process.exit(0);
        });
    } catch (error) {
        console.error('服务启动失败:', error);
        process.exit(1);
    }
}

startService(); 