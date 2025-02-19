require('dotenv').config();
const Web3 = require('web3');
const HDWalletProvider = require('@truffle/hdwallet-provider');
const { abi: routerABI } = require('@pancakeswap/sdk/dist/abis/IPancakeRouter02.json');

// Validate environment variables
if (!process.env.PRIVATE_KEY || !process.env.PROVIDER_URL || !process.env.CHAIN_ID) {
  throw new Error('Missing required environment variables. Please check your .env file');
}

// Configuration
const privateKey = process.env.PRIVATE_KEY;
const providerUrl = process.env.PROVIDER_URL;
const chainId = parseInt(process.env.CHAIN_ID);

// Addresses
const pankRouterAddress = '0x8863583B5b70539487276b972f9F409Cbc8DFA0A';
const yasuiqianAddress = '0x1baC58E9b504f6c8406693097852dB556e057DBa';
const creatorAddress = '0xC56584a0A43DBc9CAFaC4068B4BFD65d2eFce0f4';

// Amounts
const yasuiqianAmount = Web3.utils.toWei('100000', 'ether');
const dfcAmount = Web3.utils.toWei('1', 'ether');

async function main() {
  // Initialize provider and web3
  const provider = new HDWalletProvider({
    privateKeys: [privateKey],
    providerOrUrl: providerUrl,
    chainId: chainId
  });
  const web3 = new Web3(provider);
  
  // Verify connection
  const networkId = await web3.eth.net.getId();
  if (networkId !== chainId) {
    throw new Error(`Connected to wrong network. Expected ${chainId}, got ${networkId}`);
  }

  // Get router contract instance
  const router = new web3.eth.Contract(routerABI, pankRouterAddress);

  // Create liquidity pool
  try {
    console.log('Creating liquidity pool...');
    
    // Add liquidity
    const tx = await router.methods.addLiquidity(
      yasuiqianAddress, // tokenA
      '0x0000000000000000000000000000000000000000', // DFC is native token
      yasuiqianAmount,
      dfcAmount,
      0, // amountAMin
      0, // amountBMin
      creatorAddress, // to
      Math.floor(Date.now() / 1000) + 60 * 20 // deadline
    ).send({
      from: creatorAddress,
      value: dfcAmount
    });

    console.log('Liquidity pool created successfully!');
    console.log('Transaction hash:', tx.transactionHash);
  } catch (error) {
    console.error('Error creating liquidity pool:', error);
  } finally {
    provider.engine.stop();
  }
}

main();
