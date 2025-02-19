const express = require('express');
const router = express.Router();
const AirdropConfig = require('../models/airdropConfig');
const User = require('../models/user');

// 创建空投配置
router.post('/config', async (req, res) => {
  try {
    const { totalAmount, level1Ratio, level2Ratio, startTime, endTime } = req.body;
    
    const config = new AirdropConfig({
      totalAmount,
      level1Ratio,
      level2Ratio,
      startTime,
      endTime,
      status: 1
    });

    await config.save();
    res.json({ success: true, data: config });
  } catch (error) {
    console.error('创建空投配置失败:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// 获取所有空投配置
router.get('/configs', async (req, res) => {
  try {
    const configs = await AirdropConfig.find().sort({ createdAt: -1 });
    res.json(configs);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 获取用户空投数量
router.get('/amount/:address', async (req, res) => {
  try {
    const { address } = req.params;
    const user = await User.findOne({ address: address.toLowerCase() });
    if (!user) {
      return res.status(404).json({ success: false, message: '用户不存在' });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 批量计算空投
router.post('/calculate-batch', async (req, res) => {
  try {
    const { configId } = req.body;
    const config = await AirdropConfig.findById(configId);
    if (!config) {
      return res.status(404).json({ success: false, message: '空投配置不存在' });
    }

    const users = await User.find();
    const results = users.map(user => ({
      address: user.address,
      level1Count: user.level1Count,
      level2Count: user.level2Count,
      airdropAmount: calculateAirdrop(user, config),
      status: true,
      remark: ''
    }));

    res.json({ success: true, results, total: results.length });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 更新用户推荐统计
router.post('/update-referral', async (req, res) => {
  try {
    const { address, level1Count, level2Count } = req.body;
    const user = await User.findOneAndUpdate(
      { address: address.toLowerCase() },
      { level1Count, level2Count, lastUpdateTime: new Date() },
      { new: true, upsert: true }
    );
    res.json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 获取用户推荐关系信息
router.get('/referral/:address', async (req, res) => {
  try {
    const address = req.params.address.toLowerCase();
    
    // 获取用户信息
    const user = await User.findOne({ address });
    if (!user) {
      return res.status(404).json({ message: '未找到该用户' });
    }
    
    // 获取该用户推荐的用户列表(一级推荐)
    const level1Referrals = await User.find({ 
      referrer: address,
      status: 1 // 只返回已确认的
    });
    
    // 获取二级推荐用户列表
    const level2Referrals = await User.find({
      referrer: { $in: level1Referrals.map(u => u.address) },
      status: 1
    });
    
    res.json({
      user: {
        address: user.address,
        referrer: user.referrer,
        status: user.status,
        level1Count: user.level1Count,
        level2Count: user.level2Count,
        joinTime: user.joinTime,
        confirmTime: user.confirmTime,
        expireTime: user.expireTime
      },
      level1Referrals: level1Referrals.map(u => ({
        address: u.address,
        joinTime: u.joinTime,
        confirmTime: u.confirmTime
      })),
      level2Referrals: level2Referrals.map(u => ({
        address: u.address,
        referrer: u.referrer,
        joinTime: u.joinTime,
        confirmTime: u.confirmTime
      }))
    });
  } catch (error) {
    console.error('获取推荐关系失败:', error);
    res.status(500).json({ message: '获取推荐关系失败' });
  }
});

function calculateAirdrop(user, config) {
  const level1Amount = config.totalAmount * (config.level1Ratio / 100) * user.level1Count;
  const level2Amount = config.totalAmount * (config.level2Ratio / 100) * user.level2Count;
  return level1Amount + level2Amount;
}

module.exports = router; 