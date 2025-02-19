const express = require('express');
const router = express.Router();
const airdropService = require('../services/airdropService');

// 获取用户空投数量
router.get('/amount/:address', async (req, res) => {
    try {
        const { address } = req.params;
        const amount = await airdropService.calculateUserAirdrop(address);
        res.json({
            success: true,
            data: amount
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// 获取用户推荐关系
router.get('/referrals/:address', async (req, res) => {
    try {
        const { address } = req.params;
        const referrals = await airdropService.getReferralInfo(address);
        res.json({
            success: true,
            data: referrals
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// 批量获取用户空投数量
router.post('/batch-amount', async (req, res) => {
    try {
        const { addresses } = req.body;
        const amounts = await airdropService.calculateBatchAirdrop(addresses);
        res.json({
            success: true,
            data: amounts
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

module.exports = router; 