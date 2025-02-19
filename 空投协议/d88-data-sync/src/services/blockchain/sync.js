const Web3 = require('web3');
const config = require('../../config/config');
const User = require('../../models/user');
const { redis } = require('../../config/database');

// 添加合约ABI
const CONTRACT_ABI = [
  {
    "anonymous": false,
    "inputs": [
      {"indexed": true, "name": "user", "type": "address"},
      {"indexed": true, "name": "referrer", "type": "address"},
      {"indexed": false, "name": "timestamp", "type": "uint256"}
    ],
    "name": "PotentialReferrerAdded",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {"indexed": true, "name": "user", "type": "address"},
      {"indexed": true, "name": "referrer", "type": "address"},
      {"indexed": false, "name": "timestamp", "type": "uint256"},
      {"indexed": false, "name": "isDirectReferral", "type": "bool"}
    ],
    "name": "ReferralRegistered",
    "type": "event"
  }
];

class BlockchainSyncService {
  constructor() {
    this.web3 = new Web3(config.blockchain.rpc);
    this.contractAddress = config.blockchain.contractAddress;
    this.contract = new this.web3.eth.Contract(CONTRACT_ABI, this.contractAddress);
    this.lastSyncedBlock = 0;
    this.retryDelay = 5000;
    this.maxRetries = 3;
    this.syncInterval = 30000; // 30秒同步一次
  }

  async initialize() {
    try {
      this.lastSyncedBlock = parseInt(await redis.get('lastSyncedBlock')) || 0;
      console.log(`Starting sync from block: ${this.lastSyncedBlock}`);
      await this.startSync();
    } catch (error) {
      console.error('Initialization error:', error);
      throw error;
    }
  }

  async startSync() {
    console.log('Blockchain sync service started successfully');
    this.syncTimer = setInterval(async () => {
      try {
        await this.syncEvents();
      } catch (error) {
        console.error('Sync error:', error);
      }
    }, this.syncInterval);
  }

  async syncEvents() {
    try {
      const currentBlock = await this.web3.eth.getBlockNumber();
      if (currentBlock <= this.lastSyncedBlock) {
        return;
      }

      console.log(`Syncing events from block ${this.lastSyncedBlock} to ${currentBlock}`);

      // 获取PotentialReferrerAdded事件
      const potentialReferrerEvents = await this.contract.getPastEvents('PotentialReferrerAdded', {
        fromBlock: this.lastSyncedBlock + 1,
        toBlock: currentBlock
      });

      // 获取ReferralRegistered事件
      const referralRegisteredEvents = await this.contract.getPastEvents('ReferralRegistered', {
        fromBlock: this.lastSyncedBlock + 1,
        toBlock: currentBlock
      });

      // 处理事件
      for (const event of potentialReferrerEvents) {
        await this.handlePotentialReferrer(event);
      }

      for (const event of referralRegisteredEvents) {
        await this.handleReferralRegistered(event);
      }

      // 更新最后同步的区块
      this.lastSyncedBlock = currentBlock;
      await redis.set('lastSyncedBlock', currentBlock);
      
      console.log(`Synced to block ${currentBlock}`);
    } catch (error) {
      console.error('Error syncing events:', error);
    }
  }

  async handlePotentialReferrer(event) {
    try {
      const { user, referrer, timestamp } = event.returnValues;
      console.log(`New potential referrer: ${user} -> ${referrer}`);
      
      await User.findOneAndUpdate(
        { address: user.toLowerCase() },
        {
          $setOnInsert: {
            address: user.toLowerCase(),
            referrer: referrer.toLowerCase(),
            status: 0,
            joinTime: new Date(timestamp * 1000)
          }
        },
        { upsert: true }
      );
    } catch (error) {
      console.error('Error handling potential referrer:', error);
    }
  }

  async handleReferralRegistered(event) {
    try {
      const { user, referrer, timestamp, isDirectReferral } = event.returnValues;
      console.log(`Referral registered: ${user} -> ${referrer} (Direct: ${isDirectReferral})`);
      
      const userData = await User.findOne({ address: user.toLowerCase() });
      if (userData) {
        userData.status = 1;
        userData.confirmTime = new Date(timestamp * 1000);
        await userData.save();
        
        if (!userData.isExpired()) {
          await this.updateReferralCounts(referrer.toLowerCase(), user.toLowerCase());
        }
      }
    } catch (error) {
      console.error('Error handling referral registration:', error);
    }
  }

  async updateReferralCounts(referrerAddress, userAddress) {
    try {
      // 更新一级推荐人数
      await User.updateOne(
        { address: referrerAddress },
        { $inc: { level1Count: 1 } }
      );

      // 更新二级推荐人数
      const referrer = await User.findOne({ address: referrerAddress });
      if (referrer && referrer.referrer) {
        await User.updateOne(
          { address: referrer.referrer },
          { $inc: { level2Count: 1 } }
        );
      }
    } catch (error) {
      console.error('Error updating referral counts:', error);
      throw error;
    }
  }

  async retryOperation(operation, retries = this.maxRetries) {
    for (let i = 0; i < retries; i++) {
      try {
        return await operation();
      } catch (error) {
        if (i === retries - 1) throw error;
        await new Promise(resolve => setTimeout(resolve, this.retryDelay));
      }
    }
  }
}

module.exports = BlockchainSyncService;
