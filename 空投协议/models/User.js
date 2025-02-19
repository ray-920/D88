const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    address: {
        type: String,
        required: true,
        unique: true,
        lowercase: true
    },
    directReferrer: {
        type: String,
        lowercase: true,
        default: null
    },
    indirectReferrer: {
        type: String,
        lowercase: true,
        default: null
    },
    level1Count: {
        type: Number,
        default: 0
    },
    level2Count: {
        type: Number,
        default: 0
    },
    referralTimestamp: {
        type: Number,
        default: null
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// 索引
userSchema.index({ address: 1 });
userSchema.index({ directReferrer: 1 });
userSchema.index({ indirectReferrer: 1 });

const User = mongoose.model('User', userSchema);

module.exports = User; 