const { spawn } = require('child_process');
const path = require('path');

async function startServices() {
    console.log('正在启动必要服务...');

    // 1. 检查MongoDB服务
    try {
        const mongod = spawn('mongod', ['--dbpath', 'data/db']);
        console.log('MongoDB服务已启动');

        mongod.stderr.on('data', (data) => {
            console.error(`MongoDB错误: ${data}`);
        });
    } catch (error) {
        console.error('MongoDB启动失败，请确保已安装MongoDB');
        process.exit(1);
    }

    // 2. 检查Redis服务
    try {
        const redis = spawn('redis-server');
        console.log('Redis服务已启动');

        redis.stderr.on('data', (data) => {
            console.error(`Redis错误: ${data}`);
        });
    } catch (error) {
        console.error('Redis启动失败，请确保已安装Redis');
        process.exit(1);
    }

    console.log('所有服务启动完成');
}

// 执行启动流程
startServices(); 