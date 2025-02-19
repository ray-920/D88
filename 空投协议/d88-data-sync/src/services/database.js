const mongoose = require('mongoose');
const Redis = require('ioredis');
const config = require('../config/config');

// MongoDB 连接
const connectMongoDB = async () => {
  try {
    await mongoose.connect(config.mongodb.url, config.mongodb.options);
    console.log('MongoDB connected successfully');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

// Redis 连接
const redis = new Redis({
  host: config.redis.host,
  port: config.redis.port,
});

redis.on('connect', () => {
  console.log('Redis connected successfully');
});

redis.on('error', (error) => {
  console.error('Redis connection error:', error);
  process.exit(1);
});

module.exports = {
  connectMongoDB,
  redis,
}; 