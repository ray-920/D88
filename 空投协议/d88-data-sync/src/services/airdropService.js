const User = require('../models/user');
const { redis } = require('../config/database');
const web3Service = require('./web3Service');

class AirdropService {
  constructor() {
    this.CACHE_EXPIRE = 24 * 60 * 60; // 24小时缓存
    this.BATCH_SIZE = 100; // 批量处理大小
  }

  // 计算单个用户的空投数量
  async calculateUserAirdrop(userAddress, airdropConfig) {
    try {
      // 检查地址有效性
      if (!web3Service.isValidAddress(userAddress)) {
        throw new Error('无效的地址格式');
      }

      // 从缓存中获取计算结果
      const cacheKey = `airdrop:${userAddress}:${airdropConfig._id}`;
      const cachedResult = await redis.get(cacheKey);
      if (cachedResult) {
        return JSON.parse(cachedResult);
      }

      // 获取用户信息
      const user = await User.findOne({ address: userAddress.toLowerCase() });
      if (!user) {
        return { amount: 0, reason: 'User not found' };
      }

      // 获取最新的推荐数据
      const referralCounts = await web3Service.getReferralCounts(userAddress);
      
      // 更新用户推荐数据
      if (referralCounts.directCount !== user.level1Count || 
          referralCounts.indirectCount !== user.level2Count) {
        await this.updateUserReferralCount(
          userAddress,
          referralCounts.directCount,
          referralCounts.indirectCount
        );
      }

      // 计算空投数量
      let amount = 0;
      
      // 计算一级推荐奖励
      if (referralCounts.directCount > 0) {
        const level1Amount = (airdropConfig.totalAmount * airdropConfig.level1Ratio) / 
                           await this.getTotalLevel1Referrals();
        amount += level1Amount * referralCounts.directCount;
      }

      // 计算二级推荐奖励
      if (referralCounts.indirectCount > 0) {
        const level2Amount = (airdropConfig.totalAmount * airdropConfig.level2Ratio) / 
                           await this.getTotalLevel2Referrals();
        amount += level2Amount * referralCounts.indirectCount;
      }

      const result = {
        amount,
        referralCounts,
        timestamp: Date.now()
      };

      // 缓存计算结果
      await redis.set(cacheKey, JSON.stringify(result), 'EX', this.CACHE_EXPIRE);

      return result;
    } catch (error) {
      console.error('Calculate user airdrop error:', error);
      throw error;
    }
  }

  // 批量计算空投数量
  async calculateBatchAirdrop(addresses, airdropConfig) {
    try {
      const results = [];
      // 将地址分批处理
      for (let i = 0; i < addresses.length; i += this.BATCH_SIZE) {
        const batch = addresses.slice(i, i + this.BATCH_SIZE);
        const batchPromises = batch.map(address => 
          this.calculateUserAirdrop(address, airdropConfig)
        );
        const batchResults = await Promise.all(batchPromises);
        results.push(...batchResults);
      }
      return results;
    } catch (error) {
      console.error('Calculate batch airdrop error:', error);
      throw error;
    }
  }

  // 批量更新用户推荐统计
  async batchUpdateReferralCounts(updates) {
    try {
      const bulkOps = updates.map(({ address, level1Count, level2Count }) => ({
        updateOne: {
          filter: { address: address.toLowerCase() },
          update: {
            $set: {
              level1Count,
              level2Count,
              lastUpdateTime: new Date()
            }
          },
          upsert: true
        }
      }));

      return await User.bulkWrite(bulkOps);
    } catch (error) {
      console.error('Batch update referral counts error:', error);
      throw error;
    }
  }

  // 获取一级推荐总数
  async getTotalLevel1Referrals() {
    const cacheKey = 'total:level1Referrals';
    try {
      const cached = await redis.get(cacheKey);
      if (cached) return parseInt(cached);

      const result = await User.aggregate([
        { $group: { _id: null, total: { $sum: '$level1Count' } } }
      ]);

      const total = result[0]?.total || 0;
      await redis.set(cacheKey, total, 'EX', this.CACHE_EXPIRE);
      return total;
    } catch (error) {
      console.error('Get total level1 referrals error:', error);
      throw error;
    }
  }

  // 获取二级推荐总数
  async getTotalLevel2Referrals() {
    const cacheKey = 'total:level2Referrals';
    try {
      const cached = await redis.get(cacheKey);
      if (cached) return parseInt(cached);

      const result = await User.aggregate([
        { $group: { _id: null, total: { $sum: '$level2Count' } } }
      ]);

      const total = result[0]?.total || 0;
      await redis.set(cacheKey, total, 'EX', this.CACHE_EXPIRE);
      return total;
    } catch (error) {
      console.error('Get total level2 referrals error:', error);
      throw error;
    }
  }

  // 清除用户缓存
  async clearUserCache(userAddress) {
    try {
      const pattern = `airdrop:${userAddress}:*`;
      const keys = await redis.keys(pattern);
      if (keys.length > 0) {
        await redis.del(keys);
      }
    } catch (error) {
      console.error('Clear user cache error:', error);
      throw error;
    }
  }

  // 清除所有缓存
  async clearAllCache() {
    try {
      const patterns = ['airdrop:*', 'total:*'];
      for (const pattern of patterns) {
        const keys = await redis.keys(pattern);
        if (keys.length > 0) {
          await redis.del(keys);
        }
      }
    } catch (error) {
      console.error('Clear all cache error:', error);
      throw error;
    }
  }
}

module.exports = new AirdropService(); 