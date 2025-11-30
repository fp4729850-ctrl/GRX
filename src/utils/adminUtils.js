// Admin wallet addresses
export const ADMIN_ADDRESSES = [
  '0x86fa132685b2f22d17AB0c37e00F9Bc9d13Ef69f',
  '0xE6B5636C49EA21aEf6A60F24b2371b3448509cb8',
];

/**
 * Check if a wallet address is an admin address
 * @param {string} address - Wallet address to check
 * @returns {boolean} - True if address is an admin
 */
export const isAdminAddress = (address) => {
  if (!address) return false;
  const normalizedAddress = address.toLowerCase();
  return ADMIN_ADDRESSES.some(
    (adminAddr) => adminAddr.toLowerCase() === normalizedAddress
  );
};

