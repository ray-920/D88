try {
  console.log('=== 测试开始 ===');
  console.log('1. 加载依赖...');
  const { Web3 } = require('web3');
  const dotenv = require('dotenv');
  const path = require('path');
  const { execSync } = require('child_process');
  const fs = require('fs');
  console.log('依赖加载成功');

  // 检查Truffle是否安装
  console.log('\n1.1 检查Truffle环境...');
  let truffleInstalled = false;
  try {
    execSync('truffle version', { stdio: 'ignore' });
    truffleInstalled = true;
    console.log('- Truffle已安装');
  } catch (error) {
    console.log('- Truffle未安装，请按以下步骤安装：');
    console.log('  1. 以管理员身份打开PowerShell');
    console.log('  2. 运行命令：npm install -g truffle@5.8.1');
    console.log('  3. 安装完成后重新运行此测试脚本');
    console.log('\n提示：如果安装失败，可能需要：');
    console.log('  1. 检查Node.js是否正确安装');
    console.log('  2. 检查npm是否正常工作');
    console.log('  3. 确保有管理员权限');
    console.log('  4. 如果仍然失败，可以尝试：');
    console.log('     - 清理npm缓存：npm cache clean --force');
    console.log('     - 或使用yarn安装：yarn global add truffle@5.8.1\n');
  }

  // 检查项目是否初始化了Truffle
  if (truffleInstalled) {
    console.log('\n1.2 检查项目Truffle配置...');
    const truffleConfigPath = path.join(process.cwd(), 'truffle-config.js');
    if (!fs.existsSync(truffleConfigPath)) {
      console.log('- 项目中未找到truffle-config.js，准备初始化...');
      try {
        execSync('truffle init', { stdio: 'inherit' });
        console.log('- Truffle项目初始化成功！');
        
        // 修改truffle-config.js以适配DFC网络
        const truffleConfig = `module.exports = {
  networks: {
    development: {
      host: "127.0.0.1",
      port: 8545,
      network_id: "*"
    },
    dfc: {
      host: "node.dragonfly-chain.com",
      port: 443,
      network_id: "920",
      protocol: 'https'
    }
  },
  compilers: {
    solc: {
      version: "0.8.19"
    }
  }
};`;
        fs.writeFileSync(truffleConfigPath, truffleConfig);
        console.log('- Truffle配置文件已更新，添加了DFC网络支持');
      } catch (initError) {
        console.error('- Truffle项目初始化失败');
        console.error('  错误信息:', initError.message);
      }
    } else {
      console.log('- 项目已包含Truffle配置');
    }
  }

  console.log('\n2. 加载环境变量...');
  const envPath = path.resolve(__dirname, '../.env');
  console.log('环境变量文件路径:', envPath);
  dotenv.config({ path: envPath });

  console.log('\n3. 检查环境变量:');
  const rpcUrl = process.env.BLOCKCHAIN_RPC;
  const privateKey = process.env.PRIVATE_KEY;
  
  if (!rpcUrl) {
    throw new Error('未设置 BLOCKCHAIN_RPC 环境变量');
  }
  console.log('- BLOCKCHAIN_RPC:', rpcUrl);
  
  if (!privateKey) {
    throw new Error('未设置 PRIVATE_KEY 环境变量');
  }
  console.log('- PRIVATE_KEY:', privateKey ? '已设置' : '未设置');

  console.log('\n4. 初始化 Web3...');
  const web3 = new Web3(rpcUrl);
  console.log('Web3 实例已创建');

  console.log('\n5. 测试网络连接...');
  web3.eth.getNodeInfo()
    .then(nodeInfo => {
      console.log('节点连接成功');
      console.log('节点信息:', nodeInfo);
      
      console.log('\n6. 测试账户访问...');
      const account = web3.eth.accounts.privateKeyToAccount(privateKey);
      console.log('账户地址:', account.address);
      
      return web3.eth.getBalance(account.address);
    })
    .then(balance => {
      console.log('账户余额:', web3.utils.fromWei(balance, 'ether'), 'DFC');
      console.log('\n=== 测试完成 ===');
      process.exit(0);
    })
    .catch(error => {
      console.error('\n❌ 测试过程出错:');
      console.error('错误类型:', error.constructor.name);
      console.error('错误信息:', error.message);
      if (error.stack) {
        console.error('\n错误堆栈:');
        console.error(error.stack);
      }
      process.exit(1);
    });

} catch (error) {
  console.error('\n❌ 初始化过程出错:');
  console.error('错误类型:', error.constructor.name);
  console.error('错误信息:', error.message);
  if (error.stack) {
    console.error('\n错误堆栈:');
    console.error(error.stack);
  }
  process.exit(1);
} 