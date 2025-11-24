import { ethers } from 'ethers';
import { getProvider } from './networkService';
import { GRX_TOKEN_ADDRESSES, GRX_TOKEN_METADATA } from '../utils/constants';
import { generateInvoiceId } from '../utils/generateInvoiceId';
import GRXToken from '../abis/GRXToken.json';

const { abi: GRX_ABI } = GRXToken;

export const resolveGrxAddress = (networkKey = 'ETHEREUM', isTestnet = false) => {
  const normalized = networkKey?.toUpperCase() === 'BSC' ? 'BSC' : 'ETHEREUM';
  const bucket = GRX_TOKEN_ADDRESSES[normalized];
  if (!bucket) return null;
  return isTestnet ? bucket.testnet : bucket.mainnet;
};

export const getGrxContract = (networkKey, isTestnet, signerOrProvider) => {
  const contractAddress = resolveGrxAddress(networkKey, isTestnet);
  if (!contractAddress || contractAddress === ethers.ZeroAddress) {
    throw new Error('GRX contract address not configured for this network');
  }
  return new ethers.Contract(contractAddress, GRX_ABI, signerOrProvider);
};

/**
 * Burns GRX tokens with invoice using the new invoiceId generation
 * @param {Object} params
 * @param {string} params.privateKey - Wallet private key
 * @param {string} params.amount - Amount in GRX (string)
 * @param {string} params.networkKey - Network key (ETHEREUM/BSC)
 * @param {boolean} params.isTestnet - Whether using testnet
 * @param {string} params.senderAddress - Sender wallet address (for invoiceId generation)
 * @returns {Promise<Object>} Transaction details including invoiceId
 */
export const burnGrxWithInvoice = async ({
  privateKey,
  amount,
  networkKey,
  isTestnet,
  senderAddress,
}) => {
  if (!privateKey) {
    throw new Error('Wallet is locked. Please re-enter your PIN to unlock.');
  }

  if (!senderAddress) {
    throw new Error('Sender address is required for invoice ID generation');
  }

  const provider = getProvider(networkKey, isTestnet);
  const wallet = new ethers.Wallet(privateKey, provider);
  const contract = getGrxContract(networkKey, isTestnet, wallet);

  const normalizedAmount = amount ? amount.toString() : '0';
  const amountWei = ethers.parseUnits(normalizedAmount, GRX_TOKEN_METADATA.decimals);
  const timestamp = new Date().toISOString();

  // Generate invoice ID using the new deterministic method
  const zeroAddress = ethers.ZeroAddress; // For burns, recipient is zero address
  const invoiceId = generateInvoiceId(senderAddress, zeroAddress, amountWei);

  // Call burnWithInvoice on the contract
  const tx = await contract.burnWithInvoice(invoiceId, amountWei);
  const receipt = await tx.wait();

  return {
    tx,
    receipt,
    invoiceId,
    timestamp,
    amountWei: amountWei.toString(),
  };
};


