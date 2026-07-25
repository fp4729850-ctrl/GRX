// GRX Chain Cosmos configuration
export const GRX_CHAIN_CONFIG = {
  RPC_URL:
    (typeof process !== 'undefined' && process.env?.EXPO_PUBLIC_GRX_RPC_URL) ||
    'https://187.127.186.10.nip.io/rpc',
  REST_URL:
    (typeof process !== 'undefined' && process.env?.EXPO_PUBLIC_GRX_REST_URL) ||
    'https://187.127.186.10.nip.io/api',
  PREFIX: 'grx',
};

// Cosmos derivation path (m/44'/118'/0'/0/0 is standard for Cosmos, but GRX uses custom prefix)
export const COSMOS_DERIVATION_PATH = "m/44'/118'/0'/0/0";

// Storage keys
export const STORAGE_KEYS = {
  MNEMONIC: 'mnemonic',
  PRIVATE_KEY: 'privateKey',
  WALLET_ADDRESS: 'walletAddress',
  PIN_HASH: 'pinHash',
  PIN_VERIFIED_TIMESTAMP: 'pinVerifiedTimestamp',
  APP_LOCKED: 'appLocked',
  BIOMETRIC_ENABLED: 'biometricEnabled',
  CUSTODIAL_MODE: 'custodialMode',
  AUTH_TOKEN: 'authToken',
  INVOICES: 'grxInvoices',
  MINT_TRANSACTIONS: 'grxMintTransactions',
};

// GRX Token metadata (Cosmos native token)
export const GRX_TOKEN_METADATA = {
  symbol: 'grx',
  name: 'GRX Token',
  denom: 'grx', // Cosmos denomination
  decimals: 6, // Standard Cosmos token decimals
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

// Network configurations
export const NETWORKS = {
  ETHEREUM_MAINNET: {
    name: 'Ethereum Mainnet',
    chainId: 1,
    rpcUrl: 'https://mainnet.infura.io/v3/5ac894977b43497b8851db51173be16a',
    explorer: 'https://etherscan.io',
    symbol: 'ETH',
  },
  ETHEREUM_TESTNET: {
    name: 'Ethereum Sepolia',
    chainId: 11155111,
    rpcUrl: 'https://sepolia.infura.io/v3/5ac894977b43497b8851db51173be16a',
    explorer: 'https://sepolia.etherscan.io',
    symbol: 'ETH',
  },
  BSC_MAINNET: {
    name: 'BNB Chain',
    chainId: 56,
    rpcUrl: 'https://bsc-mainnet.infura.io/v3/5ac894977b43497b8851db51173be16a',
    explorer: 'https://bscscan.com',
    symbol: 'BNB',
  },
  BSC_TESTNET: {
    name: 'BNB Chain Testnet',
    chainId: 97,
    rpcUrl: 'https://data-seed-prebsc-1-s1.binance.org:8545/',
    explorer: 'https://testnet.bscscan.com',
    symbol: 'BNB',
  },
  GRX_MAINNET: {
    name: 'GRX Chain',
    chainId: 'grx-1',
    rpcUrl: GRX_CHAIN_CONFIG.RPC_URL,
    explorer: GRX_CHAIN_CONFIG.REST_URL.replace('/api', '') || 'https://187.127.186.10.nip.io/api',
    symbol: 'GRX',
  },
};

