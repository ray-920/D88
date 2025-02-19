const { MongoClient } = require('mongodb');
const Redis = require('ioredis');
require('dotenv').config();

// MongoDB配置
const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const dbName = process.env.MONGODB_DB || 'airdrop';

// Redis配置
const redis = new Redis({
    host: process.env.REDIS_HOST || 'localhost',
    port: process.env.REDIS_PORT || 6379,
    db: process.env.REDIS_DB || 0
});

// MongoDB连接函数
async function connectMongoDB() {
    const client = new MongoClient(mongoURI);
    await client.connect();
    return client.db(dbName);
}

module.exports = {
    connectMongoDB,
    redisClient: redis
};
