const Web3 = require('web3');
const User = require('../models/user');
const CONTRACT_ABI = require('../config/contractABI');
const { BLOCKCHAIN, BUSINESS } = require('../config/constants');

class Web3Service {
    constructor() {
        this.web3 = new Web3(BLOCKCHAIN.RPC_URL);
        this.contract = new this.web3.eth.Contract(CONTRACT_ABI, BLOCKCHAIN.CONTRACT_ADDRESS);
        this.timer = null;
    }

    // 获取用户推荐关系
    async getReferralInfo(address) {
        try {
            console.log(`获取用户 ${address} 的推荐关系...`);
            const result = await this.contract.methods.getReferralInfo(address).call();
            console.log('合约返回值:', result);
            
            const { direct, indirect, timestamp, isRegistered } = result;
            
            return {
                directReferrer: direct,
                indirectReferrer: indirect,
                registrationTime: new Date(Number(timestamp) * 1000),
                isRegistered
            };
        } catch (error) {
            console.error(`获取用户 ${address} 的推荐关系失败:`, error);
            throw error;
        }
    }

    // 同步用户数据到数据库
    async syncUserData(address, timestamp) {
        try {
            console.log(`\n开始同步用户 ${address} 的数据...`);
            
            const { directReferrer, indirectReferrer, registrationTime, isRegistered } = await this.getReferralInfo(address);
            
            if (!isRegistered) {
                console.log(`用户 ${address} 未完成注册，跳过`);
                return false;
            }

            // 更新或创建用户记录
            const user = await User.findOneAndUpdate(
                { address: address.toLowerCase() },
                {
                    directReferrer: directReferrer.toLowerCase(),
                    indirectReferrer: indirectReferrer.toLowerCase(),
                    registrationTime: timestamp ? new Date(timestamp * 1000) : registrationTime,
                    lastUpdateTime: new Date()
                },
                { upsert: true, new: true }
            );
            console.log(`用户 ${address} 数据已更新:`, user);

            // 更新推荐人的推荐计数
            if (directReferrer !== BUSINESS.ZERO_ADDRESS) {
                const directRef = await User.findOneAndUpdate(
                    { address: directReferrer.toLowerCase() },
                    { $inc: { level1Count: 1 } },
                    { upsert: true, new: true }
                );
                console.log(`直接推荐人 ${directReferrer} 的level1Count更新为:`, directRef.level1Count);
            }

            if (indirectReferrer !== BUSINESS.ZERO_ADDRESS) {
                const indirectRef = await User.findOneAndUpdate(
                    { address: indirectReferrer.toLowerCase() },
                    { $inc: { level2Count: 1 } },
                    { upsert: true, new: true }
                );
                console.log(`间接推荐人 ${indirectReferrer} 的level2Count更新为:`, indirectRef.level2Count);
            }

            return true;
        } catch (error) {
            console.error(`同步用户 ${address} 数据失败:`, error);
            throw error;
        }
    }

    // 手动同步所有历史事件
    async manualSync() {
        try {
            console.log('开始获取所有历史注册事件...');
            
            // 获取当前区块
            const currentBlock = await this.web3.eth.getBlockNumber();
            console.log('当前区块高度:', currentBlock);
            
            // 获取所有已确认的推荐关系事件
            const referralEvents = await this.contract.getPastEvents('ReferralRegistered', {
                fromBlock: 0,
                toBlock: 'latest'
            });

            console.log(`找到 ${referralEvents.length} 个推荐关系事件`);

            // 按用户地址分组，只保留每个用户最新的事件
            const userEvents = new Map();
            for (const event of referralEvents) {
                const { user, timestamp } = event.returnValues;
                if (!userEvents.has(user) || userEvents.get(user).timestamp < timestamp) {
                    userEvents.set(user, {
                        timestamp: Number(timestamp),
                        blockNumber: event.blockNumber
                    });
                }
            }

            console.log(`共有 ${userEvents.size} 个唯一用户`);
            let processedCount = 0;

            // 同步每个用户的最新状态
            for (const [user, eventInfo] of userEvents) {
                await this.syncUserData(user, eventInfo.timestamp);
                processedCount++;
                
                if (processedCount % 10 === 0) {
                    console.log(`已处理 ${processedCount}/${userEvents.size} 个用户`);
                }
            }

            console.log('所有历史事件同步完成');
            console.log(`总共处理了 ${processedCount} 个用户`);
            return processedCount;
        } catch (error) {
            console.error('同步历史事件失败:', error);
            throw error;
        }
    }

    // 开始定时同步（24小时一次）
    startDailySync() {
        // 立即执行一次
        this.manualSync().catch(console.error);

        // 设置24小时定时器
        this.timer = setInterval(() => {
            this.manualSync().catch(console.error);
        }, 24 * 60 * 60 * 1000);

        console.log('定时同步服务已启动，间隔: 24小时');
    }

    // 停止定时同步
    stopDailySync() {
        if (this.timer) {
            clearInterval(this.timer);
            this.timer = null;
            console.log('定时同步服务已停止');
        }
    }
}

module.exports = new Web3Service(); 