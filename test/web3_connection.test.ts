/**
 * Web3 连接测试脚本 (TypeScript版本)
 * 
 * 功能说明：
 * 1. 测试与区块链网络的连接状态
 * 2. 获取区块链基本信息（区块高度、Gas价格等）
 * 3. 获取最新区块详细信息
 * 4. 测试账户相关功能（查询账户、余额等）
 * 5. 测试合约部署环境
 * 
 * 运行环境：
 * - Node.js v14+
 * - TypeScript v4+
 * - Web3.js v1.7.4
 * - dotenv v16+
 * - chalk v4.1.2
 */

import Web3 from 'web3';
import { config } from 'dotenv';
import chalk from 'chalk';
import fs from 'fs';
import path from 'path';

// 加载环境变量
config();

interface BlockchainInfo {
  isConnected: boolean;
  networkId: string;
  networkType: string;
  blockNumber: string;
  gasPrice: string;
  latestBlock: {
    number: string;
    timestamp: number;
    transactions: string[];
  };
}

interface ContractEnvironment {
  hasOpenZeppelin: boolean;
  hasTruffle: boolean;
  solcVersion: string;
  contractExists: boolean;
  contractCompiled: boolean;
}

class Web3ConnectionTest {
  private web3: Web3;
  private privateKey: string;
  private projectRoot: string;

  constructor(rpcUrl: string, privateKey: string) {
    this.web3 = new Web3(rpcUrl);
    this.privateKey = privateKey;
    this.projectRoot = path.resolve(__dirname, '../');
    
    try {
      // 添加账户到钱包
      const account = this.web3.eth.accounts.privateKeyToAccount(privateKey);
      this.web3.eth.accounts.wallet.add(account);
      this.web3.eth.defaultAccount = account.address;
    } catch (error) {
      console.error(chalk.red('初始化Web3账户时出错:'), error);
      throw error;
    }
  }

  async getBlockchainInfo(): Promise<BlockchainInfo> {
    const isConnected = await this.web3.eth.net.isListening();
    const networkId = (await this.web3.eth.net.getId()).toString();
    const chainId = await this.web3.eth.net.getId();
    const networkType = `Chain ID: ${chainId}`;
    const blockNumber = (await this.web3.eth.getBlockNumber()).toString();
    const gasPrice = await this.web3.eth.getGasPrice();
    const latestBlock = await this.web3.eth.getBlock('latest', true);

    return {
      isConnected,
      networkId,
      networkType,
      blockNumber,
      gasPrice: this.web3.utils.fromWei(gasPrice, 'gwei'),
      latestBlock: {
        number: latestBlock.number.toString(),
        timestamp: Number(latestBlock.timestamp),
        transactions: latestBlock.transactions.map(tx => 
          typeof tx === 'string' ? tx : tx.hash
        )
      }
    };
  }

  async getAccountInfo(address?: string): Promise<{ address: string; balance: string }> {
    const targetAddress = address || this.web3.eth.defaultAccount;
    
    if (!targetAddress) {
      throw new Error('未找到可用账户');
    }

    const balance = await this.web3.eth.getBalance(targetAddress);
    return {
      address: targetAddress,
      balance: this.web3.utils.fromWei(balance, 'ether')
    };
  }

  async checkContractEnvironment(): Promise<ContractEnvironment> {
    try {
      // 检查package.json
      const packageJsonPath = path.join(this.projectRoot, 'package.json');
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
      const hasOpenZeppelin = packageJson.dependencies?.['@openzeppelin/contracts'] !== undefined;
      const hasTruffle = packageJson.devDependencies?.['truffle'] !== undefined;

      // 检查truffle配置
      const truffleConfigPath = path.join(this.projectRoot, 'truffle-config.js');
      let solcVersion = 'Not Found';
      let contractExists = false;
      let contractCompiled = false;

      if (fs.existsSync(truffleConfigPath)) {
        try {
          const truffleConfig = require(truffleConfigPath);
          solcVersion = truffleConfig.compilers.solc.version;
        } catch (error) {
          console.warn(chalk.yellow('无法读取truffle配置文件'));
        }
      }

      // 检查合约文件
      const contractPath = path.join(this.projectRoot, 'contracts');
      if (fs.existsSync(contractPath)) {
        contractExists = fs.readdirSync(contractPath).some(file => file.endsWith('.sol'));
      }

      // 检查编译文件
      const buildPath = path.join(this.projectRoot, 'build', 'contracts');
      if (fs.existsSync(buildPath)) {
        contractCompiled = fs.readdirSync(buildPath).some(file => file.endsWith('.json'));
      }

      return {
        hasOpenZeppelin,
        hasTruffle,
        solcVersion,
        contractExists,
        contractCompiled
      };
    } catch (error) {
      console.error(chalk.red('检查合约环境时出错:'), error);
      throw error;
    }
  }

  async checkDeploymentRequirements(): Promise<boolean> {
    const accountInfo = await this.getAccountInfo();
    const balance = parseFloat(accountInfo.balance);
    
    // 检查账户余额是否足够支付部署费用（至少0.1 DFC）
    if (balance < 0.1) {
      throw new Error(`账户余额不足: ${balance} DFC, 建议至少准备0.1 DFC用于部署`);
    }

    return true;
  }

  async runTests(): Promise<void> {
    try {
      console.log(chalk.blue.bold('\n=== Web3 连接测试开始 ===\n'));
      console.log(chalk.cyan('Web3 版本:'), this.web3.version);

      // 1. 区块链基本信息测试
      const info = await this.getBlockchainInfo();
      console.log(chalk.yellow('\n📊 区块链网络状态:'));
      console.log('- 网络连接:', info.isConnected ? chalk.green('✓ 已连接') : chalk.red('✗ 未连接'));
      console.log('- 网络 ID:', chalk.cyan(info.networkId));
      console.log('- 网络类型:', chalk.cyan(info.networkType));
      console.log('- 当前区块高度:', chalk.cyan(info.blockNumber));
      console.log('- Gas 价格:', chalk.cyan(info.gasPrice), 'Gwei');

      // 2. 最新区块信息
      console.log(chalk.yellow('\n📦 最新区块信息:'));
      console.log('- 区块号:', chalk.cyan(info.latestBlock.number));
      console.log('- 时间戳:', chalk.cyan(new Date(info.latestBlock.timestamp * 1000).toLocaleString()));
      console.log('- 交易数量:', chalk.cyan(info.latestBlock.transactions.length));

      // 3. 账户测试
      const accountInfo = await this.getAccountInfo();
      console.log(chalk.yellow('\n👤 账户信息:'));
      console.log('- 地址:', chalk.cyan(accountInfo.address));
      console.log('- 余额:', chalk.cyan(accountInfo.balance), 'DFC');

      // 4. 合约环境检查
      console.log(chalk.yellow('\n📝 合约环境检查:'));
      const contractEnv = await this.checkContractEnvironment();
      console.log('- OpenZeppelin:', contractEnv.hasOpenZeppelin ? chalk.green('✓ 已安装') : chalk.red('✗ 未安装'));
      console.log('- Truffle:', contractEnv.hasTruffle ? chalk.green('✓ 已安装') : chalk.red('✗ 未安装'));
      console.log('- Solidity版本:', chalk.cyan(contractEnv.solcVersion));
      console.log('- 合约文件:', contractEnv.contractExists ? chalk.green('✓ 存在') : chalk.red('✗ 不存在'));
      console.log('- 合约已编译:', contractEnv.contractCompiled ? chalk.green('✓ 是') : chalk.red('✗ 否'));

      // 5. 部署要求检查
      console.log(chalk.yellow('\n🚀 部署要求检查:'));
      const deploymentReady = await this.checkDeploymentRequirements();
      console.log('- 部署条件:', deploymentReady ? chalk.green('✓ 满足') : chalk.red('✗ 不满足'));

      console.log(chalk.blue.bold('\n=== 测试完成 ===\n'));
    } catch (error: any) {
      console.error(chalk.red('\n❌ 测试过程出错:'));
      console.error('- 错误类型:', chalk.red(error.name));
      console.error('- 错误信息:', chalk.red(error.message));
      if (error.code) {
        console.error('- 错误代码:', chalk.red(error.code));
      }
      throw error;
    }
  }
}

async function main() {
  try {
    // 添加环境变量调试信息
    console.log('环境变量检查:');
    console.log('- BLOCKCHAIN_RPC:', process.env.BLOCKCHAIN_RPC);
    console.log('- PRIVATE_KEY:', process.env.PRIVATE_KEY ? '已设置' : '未设置');

    const rpcUrl = process.env.BLOCKCHAIN_RPC;
    let privateKey = process.env.PRIVATE_KEY;
    
    if (!rpcUrl) {
      throw new Error('请在 .env 文件中设置 BLOCKCHAIN_RPC 环境变量');
    }

    if (!privateKey) {
      throw new Error('请在 .env 文件中设置有效的 PRIVATE_KEY 环境变量');
    }

    // 如果私钥包含0x前缀，移除它
    privateKey = privateKey.replace('0x', '');

    const tester = new Web3ConnectionTest(rpcUrl, privateKey);
    await tester.runTests();
  } catch (error: any) {
    console.error(chalk.red('\n❌ 初始化测试时出错:'));
    console.error('- 错误信息:', chalk.red(error.message));
    if (error.stack) {
      console.error('- 错误堆栈:', chalk.red(error.stack));
    }
    process.exit(1);
  }
}

// 如果直接运行文件则执行测试
if (require.main === module) {
  main();
}

export default Web3ConnectionTest; 