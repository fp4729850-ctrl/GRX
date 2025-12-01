// Network configurations
export const NETWORKS = {
  ETHEREUM_MAINNET: {
    name: 'Ethereum Mainnet',
    chainId: 1,
    rpcUrl: 'https://mainnet.infura.io/v3/5ac894977b43497b8851db51173be16a',
    symbol: 'ETH',
    explorer: 'https://etherscan.io',
  },
  BSC_MAINNET: {
    name: 'BNB Chain',
    chainId: 56,
    rpcUrl: 'https://bsc-mainnet.infura.io/v3/5ac894977b43497b8851db51173be16a',
    symbol: 'BNB',
    explorer: 'https://bscscan.com',
  },
  ETHEREUM_TESTNET: {
    name: 'Ethereum Sepolia',
    chainId: 11155111,
    rpcUrl: 'https://sepolia.infura.io/v3/5ac894977b43497b8851db51173be16a',
    symbol: 'ETH',
    explorer: 'https://sepolia.etherscan.io',
  },
  BSC_TESTNET: {
    name: 'BNB Chain Testnet',
    chainId: 97,
    rpcUrl: 'https://data-seed-prebsc-1-s1.binance.org:8545/',
    symbol: 'BNB',
    explorer: 'https://testnet.bscscan.com',
  },
};

// Derivation path for Ethereum/BNB wallets
export const DERIVATION_PATH = "m/44'/60'/0'/0/0";

// Storage keys
export const STORAGE_KEYS = {
  MNEMONIC: 'mnemonic',
  PRIVATE_KEY: 'privateKey',
  WALLET_ADDRESS: 'walletAddress',
  PIN_HASH: 'pinHash',
  APP_LOCKED: 'appLocked',
  BIOMETRIC_ENABLED: 'biometricEnabled',
  CURRENT_NETWORK: 'currentNetwork',
  IS_TESTNET: 'isTestnet',
  CUSTODIAL_MODE: 'custodialMode',
  AUTH_TOKEN: 'authToken',
  INVOICES: 'grxInvoices',
};

// Token addresses
export const TOKEN_ADDRESSES = {
  // Mainnet
  USDT_ETHEREUM: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
  USDT_BSC: '0x55d398326f99059fF775485246999027B3197955',
  // Testnet (if available, otherwise will return zero balance)
  USDT_ETHEREUM_TESTNET: null, // USDT not typically available on Sepolia
  USDT_BSC_TESTNET: '0x337610d27c682E347C9cD60BD4b3b107C9d34dDd', // BSC Testnet USDT
};

export const GRX_TOKEN_ADDRESSES = {
  ETHEREUM: {
    mainnet: '0x0000000000000000000000000000000000000000', // TODO: replace with live GRX mainnet contract
    testnet: '0x0000000000000000000000000000000000000000', // TODO: replace with GRX testnet contract
  },
  BSC: {
    mainnet: '0x0000000000000000000000000000000000000000',
    testnet: '0x0000000000000000000000000000000000000000',
  },
};

export const GRX_TOKEN_METADATA = {
  symbol: 'GRX',
  name: 'GRX Token',
  decimals: 18,
};

// CoinGecko API
export const COINGECKO_API = 'https://api.coingecko.com/api/v3/simple/price';

export const ORACLE_API_URL =
  (typeof process !== 'undefined' && process.env?.EXPO_PUBLIC_ORACLE_API) ||
  null;

export const API_BASE_URL =
  (typeof process !== 'undefined' && process.env?.EXPO_PUBLIC_API_BASE_URL) ||
  null;

// Oracle snapshot configuration
export const ORACLE_SNAPSHOT_CONFIG = {
  allowedWindowMinutes:
    (typeof process !== 'undefined' &&
      parseInt(process.env?.EXPO_PUBLIC_ORACLE_WINDOW_MINUTES)) ||
    10,
  pollIntervalMs: 30000, // 30 seconds
};

