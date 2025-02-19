import Web3 from 'web3';
import { config } from 'dotenv';
import path from 'path';

// 加载环境变量
config({ path: path.resolve(__dirname, '../.env') });

async function main() {
  try {
    console.log('环境变量检查:');
    console.log('BLOCKCHAIN_RPC:', process.env.BLOCKCHAIN_RPC);
    console.log('PRIVATE_KEY:', process.env.PRIVATE_KEY ? '已设置' : '未设置');

    const web3 = new Web3(process.env.BLOCKCHAIN_RPC);
    const isConnected = await web3.eth.net.isListening();
    console.log('网络连接状态:', isConnected ? '已连接' : '未连接');
  } catch (error) {
    console.error('错误:', error);
    process.exit(1);
  }
}

main(); 