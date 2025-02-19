const User = require('../models/User');

class DBOperations {
    // 创建或更新用户
    static async upsertUser(userData) {
        try {
            const { address, directReferrer, indirectReferrer, timestamp } = userData;
            
            return await User.findOneAndUpdate(
                { address: address.toLowerCase() },
                {
                    $set: {
                        directReferrer: directReferrer?.toLowerCase(),
                        indirectReferrer: indirectReferrer?.toLowerCase(),
                        referralTimestamp: timestamp,
                        updatedAt: new Date()
                    }
                },
                { upsert: true, new: true }
            );
        } catch (error) {
            console.error('更新用户数据失败:', error);
            throw error;
        }
    }

    // 更新推荐计数
    static async updateReferralCounts(referrer, isDirectReferral) {
        try {
            const update = isDirectReferral 
                ? { $inc: { level1Count: 1 } }
                : { $inc: { level2Count: 1 } };
                
            return await User.findOneAndUpdate(
                { address: referrer.toLowerCase() },
                update,
                { upsert: true, new: true }
            );
        } catch (error) {
            console.error('更新推荐计数失败:', error);
            throw error;
        }
    }

    // 获取用户推荐信息
    static async getUserReferralInfo(address) {
        try {
            return await User.findOne({ 
                address: address.toLowerCase() 
            });
        } catch (error) {
            console.error('获取用户推荐信息失败:', error);
            throw error;
        }
    }

    // 获取系统统计信息
    static async getSystemStats() {
        try {
            const stats = await User.aggregate([
                {
                    $group: {
                        _id: null,
                        totalUsers: { $sum: 1 },
                        totalLevel1: { $sum: '$level1Count' },
                        totalLevel2: { $sum: '$level2Count' }
                    }
                }
            ]);
            return stats[0];
        } catch (error) {
            console.error('获取系统统计信息失败:', error);
            throw error;
        }
    }
}

module.exports = DBOperations; 