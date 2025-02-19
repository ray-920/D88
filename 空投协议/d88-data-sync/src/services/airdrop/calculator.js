const User = require('../../models/user');
const Airdrop = require('../../models/airdrop');
const { redis } = require('../../config/database');

class AirdropCalculator {
  constructor() {
    this.cacheKeyPrefix = 'airdrop:';
  }

  /**
   * 计算单个用户的空投数量
   * @param {string} address 用户地址
   * @param {number} totalAmount 空投总量
   * @returns {Promise<{amount: number, details: Object}>}
   */
  async calculateUserAirdrop(address, totalAmount) {
    try {
      const user = await User.findOne({ address: address.toLowerCase() });
      if (!user || user.status !== 1) {
        return { amount: 0, details: { level1: 0, level2: 0 } };
      }

      const cacheKey = `${this.cacheKeyPrefix}${address}`;
      const cachedResult = await redis.get(cacheKey);
      if (cachedResult) {
        return JSON.parse(cachedResult);
      }

      // 获取用户的推荐统计
      const referralCount = user.referralCount || { level1: 0, level2: 0 };
      
      // 获取当前有效的空投配置
      const airdrop = await Airdrop.findOne({ status: 1 });
      if (!airdrop) {
        throw new Error('No active airdrop configuration found');
      }

      // 计算分配比例
      const level1Amount = (totalAmount * airdrop.distribution.level1 / 100) * 
                         (referralCount.level1 / await this.getTotalLevel1Referrals());
      
      const level2Amount = (totalAmount * airdrop.distribution.level2 / 100) * 
                         (referralCount.level2 / await this.getTotalLevel2Referrals());

      const result = {
        amount: level1Amount + level2Amount,
        details: {
          level1: level1Amount,
          level2: level2Amount,
          referralCount: referralCount
        }
      };

      // 缓存结果
      await redis.set(cacheKey, JSON.stringify(result), 'EX', 3600); // 1小时缓存

      return result;
    } catch (error) {
      console.error('Error calculating user airdrop:', error);
      throw error;
    }
  }

  /**
   * 批量计算所有用户的空投数量
   * @param {number} totalAmount 空投总量
   * @returns {Promise<Array>}
   */
  async calculateAllAirdrops(totalAmount) {
    try {
      const users = await User.find({ status: 1 });
      const results = [];

      for (const user of users) {
        const result = await this.calculateUserAirdrop(user.address, totalAmount);
        results.push({
          address: user.address,
          ...result
        });
      }

      return results;
    } catch (error) {
      console.error('Error calculating all airdrops:', error);
      throw error;
    }
  }

  /**
   * 获取总的一级推荐数量
   * @returns {Promise<number>}
   */
  async getTotalLevel1Referrals() {
    const cacheKey = `${this.cacheKeyPrefix}total:level1`;
    const cached = await redis.get(cacheKey);
    if (cached) return parseInt(cached);

    const result = await User.aggregate([
      { $match: { status: 1 } },
      { $group: { _id: null, total: { $sum: '$referralCount.level1' } } }
    ]);

    const total = result[0]?.total || 0;
    await redis.set(cacheKey, total, 'EX', 3600);
    return total;
  }

  /**
   * 获取总的二级推荐数量
   * @returns {Promise<number>}
   */
  async getTotalLevel2Referrals() {
    const cacheKey = `${this.cacheKeyPrefix}total:level2`;
    const cached = await redis.get(cacheKey);
    if (cached) return parseInt(cached);

    const result = await User.aggregate([
      { $match: { status: 1 } },
      { $group: { _id: null, total: { $sum: '$referralCount.level2' } } }
    ]);

    const total = result[0]?.total || 0;
    await redis.set(cacheKey, total, 'EX', 3600);
    return total;
  }

  /**
   * 清除缓存
   */
  async clearCache() {
    const keys = await redis.keys(`${this.cacheKeyPrefix}*`);
    if (keys.length > 0) {
      await redis.del(keys);
    }
  }
}

module.exports = new AirdropCalculator(); 