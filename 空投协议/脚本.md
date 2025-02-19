/**
 * 区块链事件同步脚本
 * 功能：同步智能合约的推荐关系事件到MongoDB
 * 版本：1.0.0
 * 更新日期：2024-01-12
 * 
 * 同步策略：
 * 1. 首次同步：从区块0开始读取所有历史事件
 * 2. 增量同步：从上次同步的区块高度开始读取新事件
 * 3. 手动触发：通过命令行参数触发同步
 */

require('dotenv').config();
const Web3 = require('web3');
const { MongoClient } = require('mongodb');
const fs = require('fs').promises;
const path = require('path');

// 完整的合约ABI，只保留需要监听的事件
const CONTRACT_ABI = [
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": true,
                "internalType": "address",
                "name": "user",
                "type": "address"
            },
            {
                "indexed": true,
                "internalType": "address",
                "name": "referrer",
                "type": "address"
            },
            {
                "indexed": false,
                "internalType": "uint256",
                "name": "timestamp",
                "type": "uint256"
            },
            {
                "indexed": false,
                "internalType": "bool",
                "name": "isDirectReferral",
                "type": "bool"
            }
        ],
        "name": "ReferralRegistered",
        "type": "event"
    }
];

// 时间戳文件路径，用于记录上次同步的区块高度
const TIMESTAMP_FILE = path.join(__dirname, 'last_sync_timestamp.txt');

/**
 * 获取上次同步的区块高度
 * @returns {Promise<number>} 返回上次同步的区块高度，如果是首次同步则返回0
 */
async function getLastSyncTimestamp() {
    try {
        const timestamp = await fs.readFile(TIMESTAMP_FILE, 'utf8');
        return parseInt(timestamp.trim());
    } catch (error) {
        // 如果文件不存在，返回0作为初始时间戳
        return 0;
    }
}

/**
 * 更新同步时间戳
 * @param {number} timestamp 当前同步的区块高度
 */
async function updateLastSyncTimestamp(timestamp) {
    await fs.writeFile(TIMESTAMP_FILE, timestamp.toString());
}

/**
 * 连接到MongoDB数据库
 * @returns {Promise<Db>} 返回数据库连接实例
 */
async function connectToMongoDB() {
    const client = await MongoClient.connect('mongodb://localhost:27017');
    return client.db('d88');
}

/**
 * 更新用户数据
 * @param {Collection} collection MongoDB集合实例
 * @param {string} user 用户地址
 * @param {string} referrer 推荐人地址
 * @param {number} timestamp 推荐关系建立的时间戳
 * @param {boolean} isDirectReferral 是否为直接推荐
 */
async function updateUserData(collection, user, referrer, timestamp, isDirectReferral) {
    console.log(`更新用户数据: ${user} -> ${referrer} (${isDirectReferral ? '直接' : '间接'}推荐)`);
    
    if (isDirectReferral) {
        // 更新用户数据
        await collection.updateOne(
            { address: user.toLowerCase() },
            {
                $set: {
                    directReferrer: referrer.toLowerCase(),
                    referralTimestamp: timestamp,
                    updatedAt: new Date()
                }
            },
            { upsert: true }
        );
        
        // 更新推荐人的直接推荐计数
        const referrerDoc = await collection.findOne({ address: referrer.toLowerCase() });
        if (referrerDoc) {
            await collection.updateOne(
                { address: referrer.toLowerCase() },
                {
                    $inc: { level1Count: 1 },
                    $set: { updatedAt: new Date() }
                }
            );
        } else {
            await collection.insertOne({
                address: referrer.toLowerCase(),
                directReferrer: '0x0000000000000000000000000000000000000000',
                level1Count: 1,
                level2Count: 0,
                referralTimestamp: timestamp,
                updatedAt: new Date()
            });
        }
    } else {
        // 更新间接推荐计数
        const referrerDoc = await collection.findOne({ address: referrer.toLowerCase() });
        if (referrerDoc) {
            await collection.updateOne(
                { address: referrer.toLowerCase() },
                {
                    $inc: { level2Count: 1 },
                    $set: { updatedAt: new Date() }
                }
            );
        } else {
            await collection.insertOne({
                address: referrer.toLowerCase(),
                directReferrer: '0x0000000000000000000000000000000000000000',
                level1Count: 0,
                level2Count: 1,
                referralTimestamp: timestamp,
                updatedAt: new Date()
            });
        }
    }
}

/**
 * 主同步函数
 * 执行步骤：
 * 1. 读取上次同步的区块高度
 * 2. 连接MongoDB和Web3
 * 3. 获取新的推荐事件
 * 4. 更新用户数据
 * 5. 记录当前同步区块高度
 */
async function syncReferralData() {
    try {
        console.log('开始同步推荐关系数据...');
        
        // 获取上次同步时间戳
        const lastSyncTimestamp = await getLastSyncTimestamp();
        console.log(`上次同步时间戳: ${lastSyncTimestamp}`);
        
        // 连接MongoDB
        const db = await connectToMongoDB();
        const collection = db.collection('users');
        console.log('MongoDB已连接');

        // 连接Web3
        const web3 = new Web3(process.env.WEB3_PROVIDER_URL);
        console.log('Web3已连接');
        
        // 创建合约实例
        const contract = new web3.eth.Contract(CONTRACT_ABI, process.env.CONTRACT_ADDRESS);
        console.log('合约地址:', process.env.CONTRACT_ADDRESS);
        
        // 获取当前区块
        const currentBlock = await web3.eth.getBlockNumber();
        console.log(`当前区块高度: ${currentBlock}`);
        
        // 获取事件
        const events = await contract.getPastEvents('ReferralRegistered', {
            fromBlock: lastSyncTimestamp === 0 ? 0 : lastSyncTimestamp,
            toBlock: 'latest'
        });
        
        console.log(`找到 ${events.length} 个新的推荐事件`);
        
        // 处理每个事件
        for (const event of events) {
            const { user, referrer, timestamp, isDirectReferral } = event.returnValues;
            await updateUserData(collection, user, referrer, timestamp, isDirectReferral);
        }
        
        // 更新同步时间戳
        await updateLastSyncTimestamp(currentBlock);
        console.log(`同步时间戳已更新为: ${currentBlock}`);
        
        console.log('推荐关系数据同步完成');
        process.exit(0);
        
    } catch (error) {
        console.error('同步过程中出错:', error);
        process.exit(1);
    }
}

// 启动同步
syncReferralData(); 