import { DirectSecp256k1HdWallet } from '@cosmjs/proto-signing';
import { SigningStargateClient } from '@cosmjs/stargate';
import { Registry } from '@cosmjs/proto-signing';
import { defaultRegistryTypes } from '@cosmjs/stargate';
import protobuf from 'protobufjs';
import { TxRaw } from 'cosmjs-types/cosmos/tx/v1beta1/tx';
import { GRX_CHAIN_CONFIG, GRX_TOKEN_METADATA } from '../utils/constants';

// Define the custom message structures for GRX chain
const root = protobuf.Root.fromJSON({
  nested: {
    grx: {
      nested: {
        sovereign: {
          nested: {
            MsgCreateSovereignVault: {
              fields: {
                creator: { type: 'string', id: 1 },
                index: { type: 'string', id: 2 },
                country: { type: 'string', id: 3 },
                vaultId: { type: 'string', id: 4 },
                ownedBalance: { type: 'uint64', id: 5 },
              },
            },
            MsgBurn: {
              fields: {
                creator: { type: 'string', id: 1 },
                amount: { type: 'uint64', id: 2 },
              },
            },
          },
        },
      },
    },
  },
});

const MsgCreateSovereignVault = root.lookupType('grx.sovereign.MsgCreateSovereignVault');
const MsgBurn = root.lookupType('grx.sovereign.MsgBurn');

// Create Registry with custom message types
const registry = new Registry(defaultRegistryTypes);
registry.register('/grx.sovereign.MsgCreateSovereignVault', MsgCreateSovereignVault);
registry.register('/grx.sovereign.MsgBurn', MsgBurn);

/**
 * Get Cosmos wallet from mnemonic
 * @param {string} mnemonic - BIP39 mnemonic phrase
 * @returns {Promise<DirectSecp256k1HdWallet>}
 */
export const getCosmosWallet = async (mnemonic) => {
  try {
    const wallet = await DirectSecp256k1HdWallet.fromMnemonic(mnemonic, {
      prefix: GRX_CHAIN_CONFIG.PREFIX,
    });
    return wallet;
  } catch (error) {
    console.error('Error creating Cosmos wallet:', error);
    throw new Error(`Failed to create Cosmos wallet: ${error.message}`);
  }
};

/**
 * Get Cosmos address from mnemonic
 * @param {string} mnemonic - BIP39 mnemonic phrase
 * @returns {Promise<string>} Cosmos address (bech32 format)
 */
export const getCosmosAddress = async (mnemonic) => {
  try {
    const wallet = await getCosmosWallet(mnemonic);
    const [account] = await wallet.getAccounts();
    return account.address;
  } catch (error) {
    console.error('Error getting Cosmos address:', error);
    throw error;
  }
};

/**
 * Fetch GRX balance from Cosmos REST API
 * @param {string} address - Cosmos address (bech32 format)
 * @returns {Promise<string>} Balance as string
 */
export const fetchGRXBalance = async (address) => {
  try {
    const restUrl = GRX_CHAIN_CONFIG.REST_URL;
    if (!restUrl) {
      // Silently return 0 if REST URL is not configured
      return '0';
    }

    let url = `${restUrl}/cosmos/bank/v1beta1/balances/${address}`;
    
    // In browser environments, use relative URL so Vercel can proxy it
    // This completely bypasses any local DNS blocks or Adblockers!
    const isBrowser = typeof window !== 'undefined';
    if (isBrowser) {
      url = `/cosmos/bank/v1beta1/balances/${address}`;
    }

    // Check if address is valid
    if (!address || typeof address !== 'string') {
      // Silently return 0 for invalid addresses
      return '0';
    }

    // Create AbortController for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000); // 3 second timeout (reduced to fail faster)

    try {
      // Suppress console errors by wrapping in try-catch
      // Note: Browser will still log network errors, but we handle them gracefully
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: controller.signal,
      }).catch((fetchErr) => {
        // Catch fetch errors immediately to prevent propagation
        clearTimeout(timeoutId);
        // Return null to indicate failure
        return null;
      });
      
      clearTimeout(timeoutId);
      
      // If fetch failed (returned null), return 0
      if (!response) {
        return '0';
      }
      
      if (!response.ok) {
        // Silently return 0 for non-OK responses
        return '0';
      }

      const data = await response.json();
      
      // Find GRX balance in the balances array
      const grxBalance = data.balances?.find(
        (b) => b.denom === GRX_TOKEN_METADATA.denom || b.denom === 'grx'
      );

      if (!grxBalance) {
        return '0';
      }

      // Convert from base units (assuming 6 decimals for Cosmos tokens)
      const balance = parseFloat(grxBalance.amount) / Math.pow(10, GRX_TOKEN_METADATA.decimals);
      return balance.toFixed(GRX_TOKEN_METADATA.decimals);
    } catch (fetchError) {
      clearTimeout(timeoutId);
      // Silently handle fetch errors
      return '0';
    }
  } catch (error) {
    // Silently handle all errors - connection refused is expected when server is not running
    // No logging to avoid console noise
    return '0';
  }
};

/**
 * Create and broadcast mint transaction
 * @param {string} mnemonic - BIP39 mnemonic phrase
 * @param {Object} mintDetails - Mint transaction details
 * @param {string} mintDetails.index - Vault index
 * @param {string} mintDetails.country - Country code
 * @param {string} mintDetails.vaultId - Vault ID
 * @param {string|number} mintDetails.amount - Amount in base units (1 GRX = 1,000,000 base units for 6 decimals)
 * @returns {Promise<string>} Transaction hash
 */
export const createMintTransaction = async (mnemonic, mintDetails) => {
  try {
    let rpcUrl = GRX_CHAIN_CONFIG.RPC_URL;
    if (typeof window !== 'undefined') {
      rpcUrl = '/rpc';
    }
    
    if (!rpcUrl) {
      throw new Error('GRX RPC URL not configured');
    }

    // Get wallet and address
    const wallet = await getCosmosWallet(mnemonic);
    const [account] = await wallet.getAccounts();
    // Ensure address is lowercase for bech32 encoding (required by Cosmos)
    const address = account.address.toLowerCase();

    // Connect client with custom registry
    const client = await SigningStargateClient.connectWithSigner(rpcUrl, wallet, {
      registry: registry,
    });

    // Prepare message
    const msg = {
      typeUrl: '/grx.sovereign.MsgCreateSovereignVault',
      value: {
        creator: address, // Already lowercase
        index: mintDetails.index || '',
        country: mintDetails.country || '',
        vaultId: mintDetails.vaultId || '',
        ownedBalance: parseInt(mintDetails.amount) || 0,
      },
    };

    // Set fee
    const fee = {
      amount: [{ denom: GRX_TOKEN_METADATA.denom, amount: '200' }],
      gas: '200000',
    };

    console.log('Signing transaction...');

    console.log('Signing transaction...');

    // Sign transaction (client.sign handles account existence automatically)
    let signedTx;
    try {
      signedTx = await client.sign(address, [msg], fee, 'Minting from App');
    } catch (signError) {
      // Check if error is about account not existing
      if (signError.message && signError.message.includes('does not exist')) {
        throw new Error(
          'Account does not exist on chain yet. Please fund your account with some GRX tokens first using the faucet.'
        );
      }
      // Re-throw other errors
      throw signError;
    }

    // Encode transaction
    const txBytes = TxRaw.encode(signedTx).finish();
    const txHex = Buffer.from(txBytes).toString('hex');

    // Manual broadcast using hex encoding (matching HTML example)
    const broadcastUrl = `${rpcUrl}/broadcast_tx_sync?tx=0x${txHex}`;
    console.log('Broadcasting transaction...');

    const response = await fetch(broadcastUrl);
    const data = await response.json();

    // Handle response (matching HTML example structure)
    if (data.error) {
      throw new Error(data.error.data || data.error.message || JSON.stringify(data.error));
    }

    const result = data.result;
    if (result && result.code === 0) {
      console.log('Success! Transaction hash:', result.hash);
      return result.hash;
    } else {
      const errorMsg = result
        ? `Code: ${result.code}, Log: ${result.log}`
        : JSON.stringify(data);
      throw new Error(`Transaction failed: ${errorMsg}`);
    }
  } catch (error) {
    console.error('Minting failed:', error);
    throw error;
  }
};

/**
 * Create and broadcast burn transaction on GRX Cosmos chain
 * @param {string} mnemonic - BIP39 mnemonic phrase
 * @param {string|number} amount - Amount to burn (in GRX tokens, will be converted to base units)
 * @returns {Promise<string>} Transaction hash
 */
export const burnGRX = async (mnemonic, amount) => {
  try {
    let rpcUrl = GRX_CHAIN_CONFIG.RPC_URL;
    if (typeof window !== 'undefined') {
      rpcUrl = '/rpc';
    }
    
    if (!rpcUrl) {
      throw new Error('GRX RPC URL not configured');
    }

    // Get wallet and address
    const wallet = await getCosmosWallet(mnemonic);
    const [account] = await wallet.getAccounts();
    const address = account.address.toLowerCase();

    // Connect client with custom registry
    const client = await SigningStargateClient.connectWithSigner(rpcUrl, wallet, {
      registry: registry,
    });

    // Convert GRX to base units (1 GRX = 1,000,000 base units for 6 decimals)
    // Following guide: Math.floor(parseFloat(amountToBurn) * 1000000)
    const amountBaseUnits = Math.floor(parseFloat(amount) * 1000000);
    console.log(`Burning ${amount} GRX = ${amountBaseUnits} base units`);

    // Prepare burn message
    const msg = {
      typeUrl: '/grx.sovereign.MsgBurn',
      value: {
        creator: address,
        amount: amountBaseUnits,
      },
    };

    // Set fee
    const fee = {
      amount: [{ denom: GRX_TOKEN_METADATA.denom, amount: '200' }],
      gas: '200000',
    };

    console.log('Signing burn transaction...');

    // Sign transaction
    let signedTx;
    try {
      signedTx = await client.sign(address, [msg], fee, 'Burning GRX');
    } catch (signError) {
      // Check if error is about account not existing
      if (signError.message && signError.message.includes('does not exist')) {
        throw new Error(
          'Account does not exist on chain yet. Please fund your account with some GRX tokens first.'
        );
      }
      // Re-throw other errors
      throw signError;
    }

    // Encode transaction
    const txBytes = TxRaw.encode(signedTx).finish();
    const txHex = Buffer.from(txBytes).toString('hex');

    // Manual broadcast using hex encoding (matching HTML example)
    const broadcastUrl = `${rpcUrl}/broadcast_tx_sync?tx=0x${txHex}`;
    console.log('Broadcasting burn transaction...');

    const response = await fetch(broadcastUrl);
    const data = await response.json();

    // Handle response
    if (data.error) {
      throw new Error(data.error.data || data.error.message || JSON.stringify(data.error));
    }

    const result = data.result;
    if (result && result.code === 0) {
      console.log('Burn successful! Transaction hash:', result.hash);
      return result.hash;
    } else {
      const errorMsg = result
        ? `Code: ${result.code}, Log: ${result.log}`
        : JSON.stringify(data);
      throw new Error(`Burn transaction failed: ${errorMsg}`);
    }
  } catch (error) {
    console.error('Burning failed:', error);
    throw error;
  }
};

/**
 * Send GRX tokens to another address on GRX Cosmos chain
 * @param {string} mnemonic - BIP39 mnemonic phrase
 * @param {string} recipient - Recipient address (bech32 format, starts with 'grx')
 * @param {string|number} amount - Amount to send (in GRX tokens, will be converted to base units)
 * @param {string} memo - Optional memo for the transaction
 * @returns {Promise<string>} Transaction hash
 */
export const sendGRXTokens = async (mnemonic, recipient, amount, memo = '') => {
  try {
    let rpcUrl = GRX_CHAIN_CONFIG.RPC_URL;
    if (typeof window !== 'undefined') {
      rpcUrl = '/rpc';
    }
    
    if (!rpcUrl) {
      throw new Error('GRX RPC URL not configured');
    }

    // Validate recipient address
    if (!recipient || !recipient.startsWith('grx')) {
      throw new Error('Invalid recipient address. Must start with "grx"');
    }

    // Get wallet and address
    const wallet = await getCosmosWallet(mnemonic);
    const [account] = await wallet.getAccounts();
    const senderAddress = account.address.toLowerCase();

    // Connect client with custom registry
    const client = await SigningStargateClient.connectWithSigner(rpcUrl, wallet, {
      registry: registry,
    });

    // Convert GRX to base units (1 GRX = 1,000,000 base units for 6 decimals)
    const amountBaseUnits = Math.floor(parseFloat(amount) * 1000000);
    console.log(`Sending ${amount} GRX = ${amountBaseUnits} base units to ${recipient}`);

    // Prepare bank send message (standard Cosmos SDK message)
    const msg = {
      typeUrl: '/cosmos.bank.v1beta1.MsgSend',
      value: {
        fromAddress: senderAddress,
        toAddress: recipient,
        amount: [{ denom: GRX_TOKEN_METADATA.denom, amount: amountBaseUnits.toString() }],
      },
    };

    // Set fee
    const fee = {
      amount: [{ denom: GRX_TOKEN_METADATA.denom, amount: '500' }],
      gas: '200000',
    };

    console.log('Signing send transaction...');

    // Sign transaction
    let signedTx;
    try {
      signedTx = await client.sign(senderAddress, [msg], fee, memo || 'Sending GRX');
    } catch (signError) {
      // Check if error is about account not existing
      if (signError.message && signError.message.includes('does not exist')) {
        throw new Error(
          'Account does not exist on chain yet. Please fund your account with some GRX tokens first.'
        );
      }
      // Check for insufficient funds
      if (signError.message && (signError.message.includes('insufficient funds') || signError.message.includes('insufficient balance'))) {
        throw new Error('Insufficient balance to send this amount.');
      }
      // Re-throw other errors
      throw signError;
    }

    // Encode transaction
    const txBytes = TxRaw.encode(signedTx).finish();
    const txHex = Buffer.from(txBytes).toString('hex');

    console.log('Broadcasting transaction...');

    // Broadcast transaction
    const response = await fetch(`${rpcUrl}/broadcast_tx_sync?tx=0x${txHex}`);
    const data = await response.json();

    if (data.error) {
      throw new Error(data.error.data || data.error.message || 'Transaction broadcast failed');
    }

    const result = data.result;

    if (result && result.code === 0) {
      console.log('Send successful! Transaction hash:', result.hash);
      return result.hash;
    } else {
      const errorMsg = result
        ? `Code: ${result.code}, Log: ${result.log}`
        : JSON.stringify(data);
      throw new Error(`Send transaction failed: ${errorMsg}`);
    }
  } catch (error) {
    console.error('Sending failed:', error);
    throw error;
  }
};

