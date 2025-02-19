const { redis } = require('../config/database');

class MonitoringService {
  constructor() {
    this.METRICS_EXPIRE = 7 * 24 * 60 * 60; // 7天过期
    this.ALERT_THRESHOLD = {
      latency: 1000, // 1秒
      errorRate: 0.1, // 10%
      unhealthyDuration: 5 * 60 * 1000 // 5分钟
    };
    this.lastAlertTime = {};
    this.unhealthyStartTime = {};
  }

  // 记录操作耗时
  async trackOperation(operationName, callback) {
    const startTime = Date.now();
    try {
      const result = await callback();
      const duration = Date.now() - startTime;
      await this.recordMetric(operationName, duration);
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      await this.recordMetric(`${operationName}_error`, duration);
      throw error;
    }
  }

  // 记录指标
  async recordMetric(name, value) {
    try {
      const timestamp = Date.now();
      const key = `metrics:${name}:${timestamp}`;
      await redis.set(key, value, 'EX', this.METRICS_EXPIRE);

      // 更新平均值
      const avgKey = `metrics:${name}:avg`;
      const countKey = `metrics:${name}:count`;
      
      const count = await redis.incr(countKey);
      const currentAvg = parseFloat(await redis.get(avgKey) || '0');
      const newAvg = (currentAvg * (count - 1) + value) / count;
      
      await redis.set(avgKey, newAvg);
      await redis.expire(avgKey, this.METRICS_EXPIRE);
      await redis.expire(countKey, this.METRICS_EXPIRE);
    } catch (error) {
      console.error('Record metric error:', error);
    }
  }

  // 获取操作统计
  async getOperationStats(operationName) {
    try {
      const pattern = `metrics:${operationName}:*`;
      const keys = await redis.keys(pattern);
      
      const stats = {
        average: parseFloat(await redis.get(`metrics:${operationName}:avg`) || '0'),
        count: parseInt(await redis.get(`metrics:${operationName}:count`) || '0'),
        recent: []
      };

      // 获取最近的记录
      for (const key of keys) {
        if (!key.includes(':avg') && !key.includes(':count')) {
          const value = parseFloat(await redis.get(key));
          const timestamp = parseInt(key.split(':')[2]);
          stats.recent.push({ timestamp, value });
        }
      }

      // 按时间排序
      stats.recent.sort((a, b) => b.timestamp - a.timestamp);
      stats.recent = stats.recent.slice(0, 10); // 只保留最近10条

      return stats;
    } catch (error) {
      console.error('Get operation stats error:', error);
      throw error;
    }
  }

  // 检查并发送告警
  async checkAndAlert(serviceName, metrics) {
    try {
      const now = Date.now();
      const alertKey = `alert:${serviceName}`;
      
      // 检查是否需要发送告警
      if (this.shouldSendAlert(serviceName, metrics, now)) {
        // 记录告警
        const alertData = {
          service: serviceName,
          metrics,
          timestamp: now
        };
        
        await redis.set(alertKey, JSON.stringify(alertData));
        await this.sendAlert(alertData);
        
        this.lastAlertTime[serviceName] = now;
      }
    } catch (error) {
      console.error('Check and alert error:', error);
    }
  }

  // 判断是否需要发送告警
  shouldSendAlert(serviceName, metrics, now) {
    // 检查告警间隔(至少30分钟)
    if (this.lastAlertTime[serviceName] && 
        now - this.lastAlertTime[serviceName] < 30 * 60 * 1000) {
      return false;
    }

    // 检查服务是否不健康
    if (metrics.status === 'unhealthy') {
      if (!this.unhealthyStartTime[serviceName]) {
        this.unhealthyStartTime[serviceName] = now;
      }
      
      // 如果持续不健康超过阈值
      if (now - this.unhealthyStartTime[serviceName] >= this.ALERT_THRESHOLD.unhealthyDuration) {
        return true;
      }
    } else {
      delete this.unhealthyStartTime[serviceName];
    }

    // 检查延迟
    if (metrics.latency && metrics.latency > this.ALERT_THRESHOLD.latency) {
      return true;
    }

    // 检查错误率
    if (metrics.errorRate && metrics.errorRate > this.ALERT_THRESHOLD.errorRate) {
      return true;
    }

    return false;
  }

  // 发送告警
  async sendAlert(alertData) {
    try {
      // 这里可以集成具体的告警通道，如邮件、短信、钉钉等
      console.log('系统告警:', JSON.stringify(alertData, null, 2));
      
      // 记录告警历史
      const historyKey = `alert:history:${alertData.service}`;
      const history = JSON.parse(await redis.get(historyKey) || '[]');
      history.push(alertData);
      
      // 只保留最近10条告警记录
      if (history.length > 10) {
        history.shift();
      }
      
      await redis.set(historyKey, JSON.stringify(history));
    } catch (error) {
      console.error('Send alert error:', error);
    }
  }

  // 获取告警历史
  async getAlertHistory(serviceName) {
    try {
      const historyKey = `alert:history:${serviceName}`;
      const history = await redis.get(historyKey);
      return history ? JSON.parse(history) : [];
    } catch (error) {
      console.error('Get alert history error:', error);
      return [];
    }
  }

  // 重写健康检查方法
  async checkServiceHealth(serviceName, checkFn) {
    try {
      const health = await checkFn();
      await this.checkAndAlert(serviceName, health);
      return health;
    } catch (error) {
      const health = {
        status: 'unhealthy',
        error: error.message
      };
      await this.checkAndAlert(serviceName, health);
      return health;
    }
  }

  // 重写获取系统健康状态方法
  async getSystemHealth() {
    try {
      const health = {
        status: 'healthy',
        services: {
          redis: await this.checkServiceHealth('redis', () => this.checkRedisHealth()),
          mongodb: await this.checkServiceHealth('mongodb', () => this.checkMongoHealth()),
          blockchain: await this.checkServiceHealth('blockchain', () => this.checkBlockchainHealth())
        },
        timestamp: Date.now()
      };

      health.status = Object.values(health.services)
        .every(service => service.status === 'healthy')
        ? 'healthy' : 'unhealthy';

      return health;
    } catch (error) {
      console.error('Get system health error:', error);
      throw error;
    }
  }

  // 检查Redis健康状态
  async checkRedisHealth() {
    try {
      const startTime = Date.now();
      await redis.ping();
      return {
        status: 'healthy',
        latency: Date.now() - startTime
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error.message
      };
    }
  }

  // 检查MongoDB健康状态
  async checkMongoHealth() {
    try {
      const mongoose = require('mongoose');
      const startTime = Date.now();
      await mongoose.connection.db.admin().ping();
      return {
        status: 'healthy',
        latency: Date.now() - startTime
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error.message
      };
    }
  }

  // 检查区块链连接健康状态
  async checkBlockchainHealth() {
    try {
      const web3Service = require('./web3Service');
      const startTime = Date.now();
      await web3Service.web3.eth.net.isListening();
      return {
        status: 'healthy',
        latency: Date.now() - startTime
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error.message
      };
    }
  }
}

module.exports = new MonitoringService(); 