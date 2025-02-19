const mongoose = require('mongoose');

const airdropSchema = new mongoose.Schema({
  totalAmount: {
    type: Number,
    required: true,
  },
  startTime: {
    type: Date,
    required: true,
  },
  endTime: {
    type: Date,
    required: true,
  },
  distribution: {
    level1: {
      type: Number,
      default: 60,  // 60% 给一级推荐
    },
    level2: {
      type: Number,
      default: 40,  // 40% 给二级推荐
    }
  },
  status: {
    type: Number,
    default: 0,  // 0: 待开始, 1: 进行中, 2: 已结束
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  }
});

module.exports = mongoose.model('Airdrop', airdropSchema); 