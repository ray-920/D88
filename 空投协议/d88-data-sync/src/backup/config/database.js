const mongoose = require('mongoose');
const Redis = require('ioredis');
require('dotenv').config();

const MONGODB_URL = process.env.MONGODB_URL || 'mongodb://localhost:27017/D88';

// Redis配置
const REDIS_CONFIG = {
    host: process.env.REDIS_HOST || 'localhost',
    port: process.env.REDIS_PORT || 6379,
    retryStrategy: (times) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
    }
};

// 创建Redis客户端
const redisClient = new Redis(REDIS_CONFIG);

redisClient.on('error', (err) => {
    console.error('Redis连接错误:', err);
});

redisClient.on('connect', () => {
    console.log('Redis连接成功');
});

// MongoDB连接
async function connectMongoDB() {
    try {
        await mongoose.connect(MONGODB_URL);
        console.log('MongoDB连接成功');
    } catch (error) {
        console.error('MongoDB连接失败:', error);
        throw error;
    }
}

module.exports = {
    connectMongoDB,
    redisClient
};
