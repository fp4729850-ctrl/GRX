import { ethers } from 'ethers';

/**
 * Generates a deterministic invoice ID using keccak256 hash of:
 * - sender address
 * - recipient address
 * - amount (in Wei/base units)
 * - timestamp (ISO string)
 * - nonce (random 8 bytes)
 *
 * @param {string} sender - Sender wallet address (Ethereum or Cosmos)
 * @param {string} recipient - Recipient wallet address (can be zero address for burns)
 * @param {string|bigint} amountWei - Amount in Wei/base units (as string or bigint)
 * @returns {string} 32-byte hex string (0x prefixed)
 */
export const generateInvoiceId = (sender, recipient, amountWei) => {
  const ts = new Date().toISOString();
  const nonce = ethers.hexlify(ethers.randomBytes(8));

  // Check if addresses are Cosmos addresses (start with bech32 prefix like 'grx', 'cosmos', etc.)
  const isCosmosAddress = (addr) => {
    if (!addr) return false;
    // Cosmos addresses are bech32 encoded and typically start with a prefix followed by numbers/letters
    // Common prefixes: cosmos, grx, osmo, etc.
    return /^[a-z]{1,10}1[a-z0-9]{38,58}$/.test(addr.toLowerCase());
  };

  const senderIsCosmos = isCosmosAddress(sender);
  const recipientIsCosmos = isCosmosAddress(recipient);

  // Convert amountWei to bigint if it's a string
  const amountBigInt =
    typeof amountWei === 'string' ? BigInt(amountWei) : amountWei;

  let encoded;

  if (senderIsCosmos || recipientIsCosmos) {
    // For Cosmos addresses, use string encoding instead of address encoding
    // Create a string representation and hash it
    const dataString = `${sender}|${recipient}|${amountBigInt.toString()}|${ts}|${nonce}`;
    // Convert string to bytes and hash
    const dataBytes = ethers.toUtf8Bytes(dataString);
    encoded = dataBytes;
  } else {
    // For Ethereum addresses, use standard ABI encoding
    const abiCoder = new ethers.AbiCoder();
    encoded = abiCoder.encode(
      ['address', 'address', 'uint256', 'string', 'bytes'],
      [sender, recipient, amountBigInt, ts, nonce]
    );
  }

  // Generate keccak256 hash
  const invoiceId = ethers.keccak256(encoded);

  return invoiceId;
};

