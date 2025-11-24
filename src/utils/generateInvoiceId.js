import { ethers } from 'ethers';

/**
 * Generates a deterministic invoice ID using keccak256 hash of:
 * - sender address
 * - recipient address
 * - amount (in Wei)
 * - timestamp (ISO string)
 * - nonce (random 8 bytes)
 *
 * @param {string} sender - Sender wallet address
 * @param {string} recipient - Recipient wallet address (can be zero address for burns)
 * @param {string|bigint} amountWei - Amount in Wei (as string or bigint)
 * @returns {string} 32-byte hex string (0x prefixed)
 */
export const generateInvoiceId = (sender, recipient, amountWei) => {
  const ts = new Date().toISOString();
  const nonce = ethers.hexlify(ethers.randomBytes(8));

  // Convert amountWei to bigint if it's a string
  const amountBigInt =
    typeof amountWei === 'string' ? BigInt(amountWei) : amountWei;

  // Encode all parameters
  // Note: Using ethers v6 API (in v5 it would be ethers.utils.defaultAbiCoder.encode)
  const abiCoder = new ethers.AbiCoder();
  const encoded = abiCoder.encode(
    ['address', 'address', 'uint256', 'string', 'bytes'],
    [sender, recipient, amountBigInt, ts, nonce]
  );

  // Generate keccak256 hash
  const invoiceId = ethers.keccak256(encoded);

  return invoiceId;
};

