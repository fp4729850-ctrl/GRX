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
};

// Token addresses
export const TOKEN_ADDRESSES = {
  USDT_ETHEREUM: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
  USDT_BSC: '0x55d398326f99059fF775485246999027B3197955',
};

// CoinGecko API
export const COINGECKO_API = 'https://api.coingecko.com/api/v3/simple/price';

