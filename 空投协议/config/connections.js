require('dotenv').config();
const { Web3 } = require('web3');
const mongoose = require('mongoose');

// Web3 连接
const getWeb3 = () => {
    try {
        const options = {
            timeout: 30000, // 毫秒
            headers: [
                {
                    name: 'Content-Type',
                    value: 'application/json'
                }
            ]
        };
        const provider = new Web3.providers.HttpProvider(process.env.WEB3_PROVIDER_URL, options);
        const web3 = new Web3(provider);
        console.log('Web3 connected to:', process.env.WEB3_PROVIDER_URL);
        return web3;
    } catch (error) {
        console.error('Web3 connection error:', error);
        throw error;
    }
};

// MongoDB 连接
const connectMongo = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI, {
            dbName: process.env.MONGODB_DB,
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        console.log('MongoDB connected successfully');
    } catch (error) {
        console.error('MongoDB connection error:', error);
        throw error;
    }
};

// 合约连接配置
const getContractInstance = (web3, abi) => {
    try {
        return new web3.eth.Contract(
            abi,
            process.env.CONTRACT_ADDRESS
        );
    } catch (error) {
        console.error('Contract initialization error:', error);
        throw error;
    }
};

module.exports = {
    getWeb3,
    connectMongo,
    getContractInstance
}; 