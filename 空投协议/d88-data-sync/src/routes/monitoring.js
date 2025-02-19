const express = require('express');
const router = express.Router();

// 测试端点
router.get('/test', (req, res) => {
  res.json({
    status: 'success',
    message: '监控服务正常运行'
  });
});

// 获取系统健康状态
router.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    services: {
      web3: {
        status: 'healthy',
        latency: 100
      }
    },
    timestamp: Date.now()
  });
});

// 获取操作统计
router.get('/stats/:operationName', (req, res) => {
  res.json({
    average: 100,
    count: 1,
    recent: [{
      timestamp: Date.now(),
      value: 100
    }]
  });
});

// 获取告警历史
router.get('/alerts', (req, res) => {
  res.json({
    web3: []
  });
});

module.exports = router; 