import * as bip39 from 'bip39';
import { ethers } from 'ethers';
import { Platform } from 'react-native';
import { DERIVATION_PATH } from '../utils/constants';

// Polyfill Buffer for web if not already defined
if (Platform.OS === 'web' && typeof global.Buffer === 'undefined') {
  global.Buffer = require('buffer').Buffer;
}

/**
 * Generate a new 12-word mnemonic phrase using BIP39
 */
export const generateMnemonic = () => {
  return bip39.generateMnemonic(128); // 128 bits = 12 words
};

/**
 * Validate a mnemonic phrase
 */
export const validateMnemonicPhrase = (mnemonic) => {
  return bip39.validateMnemonic(mnemonic);
};

/**
 * Derive wallet from mnemonic using the standard Ethereum derivation path
 * Path: m/44'/60'/0'/0/0
 */
export const deriveWalletFromMnemonic = async (mnemonic) => {
  if (!validateMnemonicPhrase(mnemonic)) {
    throw new Error('Invalid mnemonic phrase');
  }

  // Generate seed from mnemonic
  const seed = await bip39.mnemonicToSeed(mnemonic);
  
  // Create HD wallet
  const hdNode = ethers.HDNodeWallet.fromSeed(seed);
  
  // Derive wallet at the standard path
  const wallet = hdNode.derivePath(DERIVATION_PATH);
  
  return {
    address: wallet.address,
    privateKey: wallet.privateKey,
    mnemonic: mnemonic,
  };
};

/**
 * Create a wallet instance from private key
 */
export const getWalletFromPrivateKey = (privateKey) => {
  return new ethers.Wallet(privateKey);
};

/**
 * Get wallet address from private key
 */
export const getAddressFromPrivateKey = (privateKey) => {
  const wallet = getWalletFromPrivateKey(privateKey);
  return wallet.address;
};

