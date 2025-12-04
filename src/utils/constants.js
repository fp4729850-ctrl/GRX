// GRX Chain Cosmos configuration
export const GRX_CHAIN_CONFIG = {
  RPC_URL:
    (typeof process !== 'undefined' && process.env?.EXPO_PUBLIC_GRX_RPC_URL) ||
    'http://localhost:26657',
  REST_URL:
    (typeof process !== 'undefined' && process.env?.EXPO_PUBLIC_GRX_REST_URL) ||
    'http://localhost:1317',
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
  APP_LOCKED: 'appLocked',
  BIOMETRIC_ENABLED: 'biometricEnabled',
  CUSTODIAL_MODE: 'custodialMode',
  AUTH_TOKEN: 'authToken',
  INVOICES: 'grxInvoices',
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

