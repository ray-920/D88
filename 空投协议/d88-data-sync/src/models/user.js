const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  address: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
  },
  level1Count: {
    type: Number,
    default: 0,
  },
  level2Count: {
    type: Number,
    default: 0,
  },
  directReferrer: {
    type: String,
    lowercase: true,
  },
  indirectReferrer: {
    type: String,
    lowercase: true,
  },
  registrationTime: {
    type: Date,
    default: Date.now,
  },
  lastUpdateTime: {
    type: Date,
    default: Date.now,
  }
}, {
  timestamps: true
});

// 添加索引
userSchema.index({ address: 1 });
userSchema.index({ directReferrer: 1 });
userSchema.index({ indirectReferrer: 1 });
userSchema.index({ registrationTime: -1 });

module.exports = mongoose.model('User', userSchema);
