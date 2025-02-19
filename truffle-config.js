require('dotenv').config();
const HDWalletProvider = require('@truffle/hdwallet-provider');

module.exports = {
  networks: {
    development: {
      host: "127.0.0.1",
      port: 8545,
      network_id: "*"
    },
    dragonfly: {
      provider: () => new HDWalletProvider({
        privateKeys: [process.env.PRIVATE_KEY.replace('0x', '')],
        providerOrUrl: process.env.BLOCKCHAIN_RPC
      }),
      network_id: process.env.NETWORK_ID,
      confirmations: 2,
      timeoutBlocks: 200,
      skipDryRun: true
    }
  },
  compilers: {
    solc: {
      version: "0.8.0",
      settings: {
        optimizer: {
          enabled: true,
          runs: 200
        }
      }
    }
  }
}; 