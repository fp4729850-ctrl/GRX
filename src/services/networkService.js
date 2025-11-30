import { ethers } from 'ethers';
import { NETWORKS, TOKEN_ADDRESSES, GRX_TOKEN_ADDRESSES, GRX_TOKEN_METADATA } from '../utils/constants';

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
    // Check for rate limiting (Too Many Requests from Infura)
    if (
      error.code === 'BAD_DATA' &&
      (error.message?.includes('Too Many Requests') || 
       error.info?.value?.some?.(err => err.message?.includes('Too Many Requests')))
    ) {
      console.warn('Rate limit exceeded, returning zero balance (using demo data)');
      return 0n;
    }
    
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
    // Get the correct token address based on network
    let tokenAddress;
    if (isTestnet) {
      tokenAddress = networkKey === 'ETHEREUM' 
        ? TOKEN_ADDRESSES.USDT_ETHEREUM_TESTNET 
        : TOKEN_ADDRESSES.USDT_BSC_TESTNET;
    } else {
      tokenAddress = networkKey === 'ETHEREUM' 
        ? TOKEN_ADDRESSES.USDT_ETHEREUM 
        : TOKEN_ADDRESSES.USDT_BSC;
    }
    
    // If token address is null (not available on this network), return zero balance
    if (!tokenAddress) {
      console.warn(`USDT not available on ${networkKey} ${isTestnet ? 'testnet' : 'mainnet'}`);
      return { balance: 0n, decimals: 6 };
    }
    
    const provider = getProvider(networkKey, isTestnet);
    const tokenContract = new ethers.Contract(tokenAddress, ERC20_ABI, provider);
    
    // Check if contract exists by trying to read code
    const code = await provider.getCode(tokenAddress);
    if (code === '0x' || code === '0x0') {
      console.warn(`Token contract not found at address ${tokenAddress}`);
      return { balance: 0n, decimals: 6 };
    }
    
    const balance = await tokenContract.balanceOf(address);
    const decimals = await tokenContract.decimals();
    
    return { balance, decimals };
  } catch (error) {
    // Check for rate limiting (Too Many Requests from Infura)
    if (
      error.code === 'BAD_DATA' &&
      (error.message?.includes('Too Many Requests') || 
       error.info?.value?.some?.(err => err.message?.includes('Too Many Requests')))
    ) {
      console.warn('Rate limit exceeded, returning zero balance (using demo data)');
      return { balance: 0n, decimals: 6 };
    }
    
    console.error('Error fetching token balance:', error);
    // Return zero balance on errors (network issues, contract not found, etc.)
    if (
      error.code === 'NETWORK_ERROR' || 
      error.code === 'BAD_DATA' ||
      error.code === 'CALL_EXCEPTION' ||
      error.message?.includes('Failed to fetch') || 
      error.message?.includes('ERR_NAME_NOT_RESOLVED') ||
      error.message?.includes('could not decode result') ||
      error.message?.includes('execution reverted')
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
    // Get the correct token address based on network
    let tokenAddress;
    if (isTestnet) {
      tokenAddress = networkKey === 'ETHEREUM' 
        ? TOKEN_ADDRESSES.USDT_ETHEREUM_TESTNET 
        : TOKEN_ADDRESSES.USDT_BSC_TESTNET;
    } else {
      tokenAddress = networkKey === 'ETHEREUM' 
        ? TOKEN_ADDRESSES.USDT_ETHEREUM 
        : TOKEN_ADDRESSES.USDT_BSC;
    }
    
    if (!tokenAddress) {
      throw new Error(`USDT not available on ${networkKey} ${isTestnet ? 'testnet' : 'mainnet'}`);
    }
    
    const provider = getProvider(networkKey, isTestnet);
    const wallet = new ethers.Wallet(privateKey, provider);
    
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
 * Send GRX token transaction
 */
export const sendGRXTransaction = async (
  privateKey,
  to,
  amount,
  gasLimit,
  networkKey,
  isTestnet = false
) => {
  try {
    // Get the correct GRX token address based on network
    const normalized = networkKey?.toUpperCase() === 'BSC' ? 'BSC' : 'ETHEREUM';
    const bucket = GRX_TOKEN_ADDRESSES[normalized];
    
    if (!bucket) {
      throw new Error(`GRX not available on ${networkKey}`);
    }
    
    const tokenAddress = isTestnet ? bucket.testnet : bucket.mainnet;
    
    if (!tokenAddress || tokenAddress === ethers.ZeroAddress) {
      throw new Error(`GRX contract address not configured for ${networkKey} ${isTestnet ? 'testnet' : 'mainnet'}`);
    }
    
    const provider = getProvider(networkKey, isTestnet);
    const wallet = new ethers.Wallet(privateKey, provider);
    
    const tokenContract = new ethers.Contract(tokenAddress, ERC20_ABI, wallet);
    
    const amountWei = ethers.parseUnits(amount.toString(), GRX_TOKEN_METADATA.decimals);
    
    const tx = await tokenContract.transfer(to, amountWei, {
      gasLimit: gasLimit || undefined,
    });
    
    return tx;
  } catch (error) {
    console.error('Error sending GRX transaction:', error);
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

