import { ethers } from 'ethers';

export const validateAddress = (address) => {
  try {
    return ethers.isAddress(address);
  } catch (error) {
    return false;
  }
};

export const validateMnemonic = (mnemonic) => {
  if (!mnemonic) return false;
  const words = mnemonic.trim().split(/\s+/);
  return words.length === 12;
};

export const validateAmount = (amount) => {
  if (!amount || isNaN(amount) || parseFloat(amount) <= 0) {
    return false;
  }
  return true;
};

export const formatAddress = (address) => {
  if (!address) return '';
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};

export const formatBalance = (balance, decimals = 18) => {
  if (!balance) return '0.00';
  try {
    const formatted = ethers.formatUnits(balance, decimals);
    return parseFloat(formatted).toFixed(4);
  } catch (error) {
    return '0.00';
  }
};

