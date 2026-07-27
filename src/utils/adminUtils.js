// Admin wallet addresses
export const ADMIN_ADDRESSES = [
  'grx1cf97hmg0kgpclr6l384d3u7qth3klxlar0h3xr',
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

