const mongoose = require('mongoose');

const airdropConfigSchema = new mongoose.Schema({
  totalAmount: {
    type: Number,
    required: true,
    min: 0
  },
  level1Ratio: {
    type: Number,
    required: true,
    min: 0,
    max: 1,
    default: 0.6
  },
  level2Ratio: {
    type: Number,
    required: true,
    min: 0,
    max: 1,
    default: 0.4
  },
  startTime: {
    type: Date,
    required: true
  },
  endTime: {
    type: Date,
    required: true
  },
  status: {
    type: Number,
    default: 1,  // 1: 活跃, 0: 已结束
    enum: [0, 1]
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// 添加索引
airdropConfigSchema.index({ status: 1 });
airdropConfigSchema.index({ startTime: 1, endTime: 1 });

// 验证结束时间必须大于开始时间
airdropConfigSchema.pre('save', function(next) {
  if (this.endTime <= this.startTime) {
    next(new Error('结束时间必须大于开始时间'));
  }
  next();
});

// 验证level1Ratio和level2Ratio的总和必须等于1
airdropConfigSchema.pre('save', function(next) {
  if (Math.abs(this.level1Ratio + this.level2Ratio - 1) > 0.000001) {
    next(new Error('一级和二级比例之和必须等于1'));
  }
  next();
});

module.exports = mongoose.model('AirdropConfig', airdropConfigSchema); 