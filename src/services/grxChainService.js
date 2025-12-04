import { DirectSecp256k1HdWallet } from '@cosmjs/proto-signing';
import { SigningStargateClient } from '@cosmjs/stargate';
import { Registry } from '@cosmjs/proto-signing';
import { defaultRegistryTypes } from '@cosmjs/stargate';
import protobuf from 'protobufjs';
import { TxRaw } from 'cosmjs-types/cosmos/tx/v1beta1/tx';
import { GRX_CHAIN_CONFIG, GRX_TOKEN_METADATA } from '../utils/constants';

// Define the custom message structure for MsgCreateSovereignVault
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
          },
        },
      },
    },
  },
});

const MsgCreateSovereignVault = root.lookupType('grx.sovereign.MsgCreateSovereignVault');

// Create Registry with custom message type
const registry = new Registry(defaultRegistryTypes);
registry.register('/grx.sovereign.MsgCreateSovereignVault', MsgCreateSovereignVault);

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
      console.warn('GRX REST URL not configured');
      return '0';
    }

    const response = await fetch(`${restUrl}/cosmos/bank/v1beta1/balances/${address}`);
    
    if (!response.ok) {
      console.warn(`Failed to fetch balance: ${response.status} ${response.statusText}`);
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
  } catch (error) {
    console.error('Error fetching GRX balance:', error);
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
 * @param {string|number} mintDetails.amount - Amount to mint (will be converted to ownedBalance)
 * @returns {Promise<string>} Transaction hash
 */
export const createMintTransaction = async (mnemonic, mintDetails) => {
  try {
    const rpcUrl = GRX_CHAIN_CONFIG.RPC_URL;
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

