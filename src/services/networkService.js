import { ethers } from 'ethers';
import { NETWORKS, TOKEN_ADDRESSES } from '../utils/constants';

// ERC20 ABI for balance checking
const ERC20_ABI = [
  'function balanceOf(address owner) view returns (uint256)',
  'function transfer(address to, uint256 amount) returns (bool)',
  'function decimals() view returns (uint8)',
];

/**
 * Get provider for a network
 */
export const getProvider = (networkKey, isTestnet = false) => {
  const network = isTestnet 
    ? (networkKey === 'ETHEREUM' ? NETWORKS.ETHEREUM_TESTNET : NETWORKS.BSC_TESTNET)
    : (networkKey === 'ETHEREUM' ? NETWORKS.ETHEREUM_MAINNET : NETWORKS.BSC_MAINNET);
  
  // Create provider with timeout configuration
  const provider = new ethers.JsonRpcProvider(network.rpcUrl, {
    name: network.name,
    chainId: network.chainId,
  });
  
  return provider;
};

/**
 * Get wallet balance (native token: ETH or BNB)
 */
export const getBalance = async (address, networkKey, isTestnet = false) => {
  try {
    const provider = getProvider(networkKey, isTestnet);
    const balance = await provider.getBalance(address);
    return balance;
  } catch (error) {
    console.error('Error fetching balance:', error);
    // Return zero balance on network errors instead of throwing
    if (error.code === 'NETWORK_ERROR' || error.message?.includes('Failed to fetch') || error.message?.includes('ERR_NAME_NOT_RESOLVED')) {
      console.warn('Network error, returning zero balance');
      return 0n;
    }
    throw error;
  }
};

/**
 * Get ERC20 token balance (USDT)
 */
export const getTokenBalance = async (address, networkKey, isTestnet = false) => {
  try {
    const provider = getProvider(networkKey, isTestnet);
    const tokenAddress = networkKey === 'ETHEREUM' 
      ? TOKEN_ADDRESSES.USDT_ETHEREUM 
      : TOKEN_ADDRESSES.USDT_BSC;
    
    const tokenContract = new ethers.Contract(tokenAddress, ERC20_ABI, provider);
    const balance = await tokenContract.balanceOf(address);
    const decimals = await tokenContract.decimals();
    
    return { balance, decimals };
  } catch (error) {
    console.error('Error fetching token balance:', error);
    // Return zero balance on errors (network issues, contract not found, etc.)
    if (
      error.code === 'NETWORK_ERROR' || 
      error.code === 'BAD_DATA' ||
      error.message?.includes('Failed to fetch') || 
      error.message?.includes('ERR_NAME_NOT_RESOLVED') ||
      error.message?.includes('could not decode result')
    ) {
      console.warn('Token balance error, returning zero balance');
      // Default to 6 decimals for USDT
      return { balance: 0n, decimals: 6 };
    }
    throw error;
  }
};

/**
 * Estimate gas for a transaction
 */
export const estimateGas = async (from, to, value, data = '0x', networkKey, isTestnet = false) => {
  try {
    const provider = getProvider(networkKey, isTestnet);
    const gasEstimate = await provider.estimateGas({
      from,
      to,
      value,
      data,
    });
    return gasEstimate;
  } catch (error) {
    console.error('Error estimating gas:', error);
    // Re-throw with more context for insufficient funds
    if (error.code === 'INSUFFICIENT_FUNDS' || error.message?.includes('insufficient funds')) {
      const enhancedError = new Error('Insufficient funds for transaction');
      enhancedError.code = 'INSUFFICIENT_FUNDS';
      enhancedError.originalError = error;
      throw enhancedError;
    }
    throw error;
  }
};

/**
 * Get current gas price
 */
export const getGasPrice = async (networkKey, isTestnet = false) => {
  try {
    const provider = getProvider(networkKey, isTestnet);
    const feeData = await provider.getFeeData();
    return feeData.gasPrice || feeData.maxFeePerGas;
  } catch (error) {
    console.error('Error fetching gas price:', error);
    throw error;
  }
};

/**
 * Send native token transaction (ETH or BNB)
 */
export const sendTransaction = async (
  privateKey,
  to,
  amount,
  gasLimit,
  networkKey,
  isTestnet = false
) => {
  try {
    const provider = getProvider(networkKey, isTestnet);
    const wallet = new ethers.Wallet(privateKey, provider);
    
    const tx = await wallet.sendTransaction({
      to,
      value: ethers.parseEther(amount.toString()),
      gasLimit: gasLimit || undefined,
    });
    
    return tx;
  } catch (error) {
    console.error('Error sending transaction:', error);
    throw error;
  }
};

/**
 * Send ERC20 token transaction (USDT)
 */
export const sendTokenTransaction = async (
  privateKey,
  to,
  amount,
  decimals,
  gasLimit,
  networkKey,
  isTestnet = false
) => {
  try {
    const provider = getProvider(networkKey, isTestnet);
    const wallet = new ethers.Wallet(privateKey, provider);
    
    const tokenAddress = networkKey === 'ETHEREUM' 
      ? TOKEN_ADDRESSES.USDT_ETHEREUM 
      : TOKEN_ADDRESSES.USDT_BSC;
    
    const tokenContract = new ethers.Contract(tokenAddress, ERC20_ABI, wallet);
    
    const amountWei = ethers.parseUnits(amount.toString(), decimals);
    
    const tx = await tokenContract.transfer(to, amountWei, {
      gasLimit: gasLimit || undefined,
    });
    
    return tx;
  } catch (error) {
    console.error('Error sending token transaction:', error);
    throw error;
  }
};

/**
 * Get transaction history (basic implementation)
 * Note: For production, you'd want to use a service like Etherscan API
 */
export const getTransactionHistory = async (address, networkKey, isTestnet = false) => {
  try {
    const network = isTestnet 
      ? (networkKey === 'ETHEREUM' ? NETWORKS.ETHEREUM_TESTNET : NETWORKS.BSC_TESTNET)
      : (networkKey === 'ETHEREUM' ? NETWORKS.ETHEREUM_MAINNET : NETWORKS.BSC_MAINNET);
    
    // This is a placeholder - in production, use blockchain explorer API
    // For now, return empty array
    return [];
  } catch (error) {
    console.error('Error fetching transaction history:', error);
    return [];
  }
};

