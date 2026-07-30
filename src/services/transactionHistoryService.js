import axios from "axios";
import { ethers } from "ethers";
import { API_BASE_URL } from "../utils/constants";
import { NETWORKS } from "../utils/constants";
import { getProvider } from "./networkService";
import { fetchBackendInvoices } from "./backendInvoiceService";
import { getInvoices } from "./invoiceService";
import { StargateClient } from "@cosmjs/stargate";
import { GRX_CHAIN_CONFIG } from "../utils/constants";

/**
 * Fetch on-chain transactions using ethers provider
 * Note: This is a basic implementation. For production, use a block explorer API
 */
export const fetchOnChainTransactions = async (address, networkKey, isTestnet = false) => {
  try {
    const provider = getProvider(networkKey, isTestnet);
    const network = isTestnet
      ? networkKey === "ETHEREUM"
        ? NETWORKS.ETHEREUM_TESTNET
        : NETWORKS.BSC_TESTNET
      : networkKey === "ETHEREUM"
      ? NETWORKS.ETHEREUM_MAINNET
      : NETWORKS.BSC_MAINNET;

    // Limit to last 20 blocks to avoid rate limiting
    const currentBlock = await provider.getBlockNumber();
    const startBlock = Math.max(0, currentBlock - 20);
    
    const transactions = [];
    
    // Scan recent blocks for transactions (with delay to avoid rate limiting)
    for (let i = currentBlock; i >= startBlock && transactions.length < 10; i--) {
      try {
        // Add delay between block fetches to avoid rate limiting
        if (i < currentBlock) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
        const block = await provider.getBlock(i, true);
        if (block && block.transactions) {
          for (const tx of block.transactions) {
            if (typeof tx === "string") {
              const fullTx = await provider.getTransaction(tx);
              if (
                fullTx &&
                (fullTx.from?.toLowerCase() === address.toLowerCase() ||
                  fullTx.to?.toLowerCase() === address.toLowerCase())
              ) {
                const receipt = await provider.getTransactionReceipt(tx);
                transactions.push({
                  id: tx,
                  type: fullTx.from?.toLowerCase() === address.toLowerCase() ? "send" : "receive",
                  from: fullTx.from,
                  to: fullTx.to,
                  amount: fullTx.value ? ethers.formatEther(fullTx.value) : "0",
                  token: networkKey === "ETHEREUM" ? "ETH" : "BNB",
                  timestamp: block.timestamp ? new Date(block.timestamp * 1000).toISOString() : new Date().toISOString(),
                  txHash: tx,
                  status: receipt?.status === 1 ? "confirmed" : "failed",
                  network: networkKey,
                  isTestnet,
                  source: "onchain",
                });
              }
            } else if (tx && (tx.from?.toLowerCase() === address.toLowerCase() || tx.to?.toLowerCase() === address.toLowerCase())) {
              const receipt = await provider.getTransactionReceipt(tx.hash);
              transactions.push({
                id: tx.hash,
                type: tx.from?.toLowerCase() === address.toLowerCase() ? "send" : "receive",
                from: tx.from,
                to: tx.to,
                amount: tx.value ? ethers.formatEther(tx.value) : "0",
                token: networkKey === "ETHEREUM" ? "ETH" : "BNB",
                timestamp: block.timestamp ? new Date(block.timestamp * 1000).toISOString() : new Date().toISOString(),
                txHash: tx.hash,
                status: receipt?.status === 1 ? "confirmed" : "failed",
                network: networkKey,
                isTestnet,
                source: "onchain",
              });
            }
          }
        }
      } catch (blockError) {
        // Skip blocks that fail to fetch
        continue;
      }
    }
    
    return transactions;
  } catch (error) {
    // Check for rate limiting (Too Many Requests from Infura)
    if (
      error.code === 'BAD_DATA' &&
      (error.message?.includes('Too Many Requests') || 
       error.info?.value?.some?.(err => err.message?.includes('Too Many Requests')))
    ) {
      console.warn("Rate limit exceeded, skipping on-chain transactions (using demo data)");
      return [];
    }
    
    // Suppress network errors - return empty array gracefully
    if (
      error.code === 'NETWORK_ERROR' ||
      error.code === 'BAD_DATA' ||
      error.message?.includes('Failed to fetch') ||
      error.message?.includes('ERR_NAME_NOT_RESOLVED')
    ) {
      console.warn("Network error fetching transactions, returning empty array");
      return [];
    }
    
    console.warn("Error fetching on-chain transactions:", error.message);
    return [];
  }
};

/**
 * Fetch backend custodial transactions
 */
export const fetchCustodialTransactions = async (address) => {
  if (!API_BASE_URL) {
    return [];
  }

  try {
    const { data } = await axios.get(`${API_BASE_URL}/api/transaction/history`, {
      params: { address },
    });
    
    return (data?.transactions || data || []).map((tx) => ({
      id: tx.id || tx.txHash,
      type: tx.type || (tx.from?.toLowerCase() === address.toLowerCase() ? "send" : "receive"),
      from: tx.from,
      to: tx.to,
      amount: tx.amount,
      token: tx.token || "GRX",
      timestamp: tx.timestamp || tx.createdAt,
      txHash: tx.txHash,
      status: tx.status || "confirmed",
      network: tx.network,
      isTestnet: tx.isTestnet,
      source: "custodial",
    }));
  } catch (error) {
    console.warn("Error fetching custodial transactions:", error.message);
    return [];
  }
};

/**
 * Fetch burn transactions from invoices
 */
export const fetchBurnTransactions = async (address) => {
  try {
    let invoices = [];
    
    // Try backend first
    if (API_BASE_URL) {
      try {
        invoices = await fetchBackendInvoices({ address });
      } catch (err) {
        // Fall back to local
        invoices = await getInvoices();
      }
    } else {
      invoices = await getInvoices();
    }
    
    // Filter for burn/redeem invoices
    return invoices
      .filter((inv) => inv.status === "SETTLED" || inv.status === "BURN_PENDING" || inv.txHash)
      .map((inv) => ({
        id: inv.id,
        type: "burn",
        from: address,
        to: null,
        amount: inv.amount || "0",
        token: "GRX",
        timestamp: inv.timestamp || inv.createdAt || new Date().toISOString(),
        txHash: inv.txHash,
        status: inv.status === "SETTLED" ? "confirmed" : inv.status?.toLowerCase() || "pending",
        network: inv.network,
        isTestnet: inv.isTestnet,
        source: "burn",
        invoiceId: inv.id,
        settlementAmount: inv.settlementAmount,
        settlementCurrency: inv.settlementCurrency,
      }));
  } catch (error) {
    console.warn("Error fetching burn transactions:", error.message);
    return [];
  }
};

/**
 * Fetch mint transactions (if available)
 */
export const fetchMintTransactions = async (address) => {
  if (!API_BASE_URL) {
    return [];
  }

  try {
    const { data } = await axios.get(`${API_BASE_URL}/api/mint/history`, {
      params: { address },
    });
    
    return (data?.mints || data || []).map((mint) => ({
      id: mint.id || mint.txHash,
      type: "mint",
      from: null,
      to: address,
      amount: mint.amount,
      token: "GRX",
      timestamp: mint.timestamp || mint.createdAt,
      txHash: mint.txHash,
      status: mint.status || "confirmed",
      network: mint.network,
      isTestnet: mint.isTestnet,
      source: "mint",
    }));
  } catch (error) {
    // Mints might not be available, so don't log as error
    return [];
  }
};

/**
 * Fetch GRX Cosmos chain transactions
 */
export const fetchGRXChainTransactions = async (address) => {
  if (!address || !address.startsWith('grx')) return [];
  try {
    let rpcUrl = GRX_CHAIN_CONFIG.RPC_URL;
    if (typeof window !== 'undefined') {
      rpcUrl = window.location.origin + '/rpc';
    }
    const client = await StargateClient.connect(rpcUrl);
    
    // Fetch both sent and received transactions
    const [sentTxs, receivedTxs] = await Promise.all([
      client.searchTx([{ key: "transfer.sender", value: address }]),
      client.searchTx([{ key: "transfer.recipient", value: address }])
    ]);

    const allGRXTxs = [...sentTxs, ...receivedTxs];
    
    // Map Cosmos TX responses to our internal format
    return allGRXTxs.map(tx => {
      let amount = "0";
      let toAddress = null;
      let fromAddress = null;

      try {
        // Use pre-parsed events from CosmJS
        const events = tx.events || [];
        // The last transfer event usually represents the main token transfer
        const transferEvents = events.filter(e => e.type === "transfer");
        if (transferEvents.length > 0) {
          // Get the last transfer event (in case fee was paid first)
          const transferEvent = transferEvents[transferEvents.length - 1];
          const amountAttr = transferEvent.attributes.find(a => a.key === "amount");
          const senderAttr = transferEvent.attributes.find(a => a.key === "sender");
          const recipientAttr = transferEvent.attributes.find(a => a.key === "recipient");
          
          if (amountAttr) {
            // Format like '1000000grx' or '1000000ugrx'
            const rawAmount = amountAttr.value.replace(/[^0-9.]/g, '');
            // Some Cosmos chains use base units, some don't. Assuming GRX uses 1e6.
            if (rawAmount) amount = (parseFloat(rawAmount) / 1000000).toString();
          }
          if (senderAttr) fromAddress = senderAttr.value;
          if (recipientAttr) toAddress = recipientAttr.value;
        }
      } catch (e) {
        console.warn("Error parsing GRX tx log:", e);
      }

      return {
        id: tx.hash,
        type: fromAddress === address ? "send" : "receive",
        from: fromAddress,
        to: toAddress,
        amount: amount,
        token: "GRX",
        timestamp: new Date().toISOString(), // Fallback if block time isn't available
        txHash: tx.hash,
        status: tx.code === 0 ? "confirmed" : "failed",
        network: "GRX Chain",
        isTestnet: false,
        source: "onchain",
      };
    });
  } catch (error) {
    console.warn("Error fetching GRX chain transactions:", error.message);
    return [];
  }
};

/**
 * Combine all transaction sources and sort by recent first
 */
export const fetchCombinedTransactionHistory = async (address, networkKey, isTestnet = false) => {
  try {
    const [onChain, custodial, burns, mints, grxChain] = await Promise.all([
      fetchOnChainTransactions(address, networkKey, isTestnet),
      fetchCustodialTransactions(address),
      fetchBurnTransactions(address),
      fetchMintTransactions(address),
      fetchGRXChainTransactions(address)
    ]);

    // Combine all transactions
    const allTransactions = [...onChain, ...custodial, ...burns, ...mints, ...grxChain];

    // Sort by timestamp (recent first)
    allTransactions.sort((a, b) => {
      const timeA = new Date(a.timestamp || 0).getTime();
      const timeB = new Date(b.timestamp || 0).getTime();
      return timeB - timeA;
    });

    // Remove duplicates based on txHash
    const seen = new Set();
    const uniqueTransactions = allTransactions.filter((tx) => {
      if (tx.txHash && seen.has(tx.txHash)) {
        return false;
      }
      if (tx.txHash) {
        seen.add(tx.txHash);
      }
      return true;
    });

    return uniqueTransactions.slice(0, 50); // Limit to 50 most recent
  } catch (error) {
    console.error("Error fetching combined transaction history:", error);
    return [];
  }
};

