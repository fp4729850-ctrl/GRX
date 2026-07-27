import React, { useCallback, useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  Linking,
} from "react-native";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { getInvoices } from "../services/invoiceService";
import { NETWORKS } from "../utils/constants";
import { theme } from "../styles/theme";
import { useWallet } from "../context/WalletContext";
import {
  fetchBackendInvoices,
  fetchBackendInvoiceDetail,
  fetchPayoutStatus,
} from "../services/backendInvoiceService";

// Gold color constants
const GOLD_COLORS = {
  primary: "#D4AF37",
  light: "#F4E4BC",
  dark: "#B8941F",
  accent: "#FFD700",
};

const getExplorerUrl = (networkKey, isTestnet, txHash) => {
  if (!txHash) return null;
  
  // Handle GRX chain - use custom explorer
  if (networkKey === "GRX" || networkKey === "grx" || !networkKey) {
    // Use the custom GRX explorer URL
    return `http://127.0.0.1:5500/frontend/explorer.html?tx=${txHash}`;
  }
  
  // Handle Ethereum and BSC
  const isEthereum = networkKey === "ETHEREUM";
  const network = isEthereum
    ? isTestnet
      ? NETWORKS.ETHEREUM_TESTNET
      : NETWORKS.ETHEREUM_MAINNET
    : isTestnet
    ? NETWORKS.BSC_TESTNET
    : NETWORKS.BSC_MAINNET;
  
  if (!network || !network.explorer) {
    return null;
  }
  
  return `${network.explorer}/tx/${txHash}`;
};

const STATUS_COLORS = {
  RECEIVED: theme.colors.primary,
  AWAITING_REDEEM: theme.colors.warning,
  BURN_PENDING: theme.colors.primaryDark,
  USED: theme.colors.textSecondary,
  SETTLED: theme.colors.success,
};

// Dummy data for testing when APIs fail
const DUMMY_INVOICES = [
  {
    id: "INV-DEMO-001",
    amount: "100.5000",
    status: "SETTLED",
    timestamp: new Date().toISOString(),
    totalUSD: 7550.00,
    settlementAmount: "7550.00",
    settlementCurrency: "USD",
    network: "ETHEREUM",
    isTestnet: false,
    txHash: "0x1234567890abcdef1234567890abcdef12345678",
  },
  {
    id: "INV-DEMO-002",
    amount: "250.7500",
    status: "AWAITING_REDEEM",
    timestamp: new Date(Date.now() - 86400000).toISOString(),
    totalUSD: 18875.00,
    settlementAmount: null,
    settlementCurrency: null,
    network: "BSC",
    isTestnet: false,
    txHash: "0xabcdef1234567890abcdef1234567890abcdef12",
  },
  {
    id: "INV-DEMO-003",
    amount: "50.2500",
    status: "BURN_PENDING",
    timestamp: new Date(Date.now() - 172800000).toISOString(),
    totalUSD: 3775.00,
    settlementAmount: null,
    settlementCurrency: null,
    network: "ETHEREUM",
    isTestnet: true,
    txHash: null,
  },
];

const DUMMY_PAYOUT_STATUSES = {
  "INV-DEMO-001": {
    payoutAmount: "7550.00",
    payoutCurrency: "USD",
    partnerId: "PARTNER-001",
    payoutTx: "0x9876543210fedcba9876543210fedcba98765432",
    confirmationCode: null,
    updatedAt: new Date().toISOString(),
  },
  "INV-DEMO-002": {
    payoutAmount: "18875.00",
    payoutCurrency: "USD",
    partnerId: "PARTNER-002",
    payoutTx: null,
    confirmationCode: "CONF-2024-001",
    updatedAt: new Date(Date.now() - 3600000).toISOString(),
  },
};

const InvoicesScreen = ({ navigation }) => {
  const [invoices, setInvoices] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [payoutStatuses, setPayoutStatuses] = useState({});
  const { walletAddress } = useWallet();
  const pollingIntervalRef = useRef(null);
  const invoicesRef = useRef([]);

  const loadInvoices = useCallback(async () => {
    setRefreshing(true);
    try {
      let latestInvoices = [];

      if (walletAddress) {
        try {
          const backendItems = await fetchBackendInvoices({
            address: walletAddress,
          });

          if (backendItems.length > 0) {
            const withDetail = await Promise.all(
              backendItems.map(async (invoice) => {
                try {
                  const detail = await fetchBackendInvoiceDetail(invoice.id);
                  return {
                    ...invoice,
                    ...detail,
                  };
                } catch (detailError) {
                  console.warn(
                    `Failed to load details for invoice ${invoice.id}`,
                    detailError.message
                  );
                  return invoice;
                }
              })
            );

            latestInvoices = withDetail;
            
            // Fetch payout statuses for all invoices
            const payoutPromises = latestInvoices.map(async (invoice) => {
              const payoutStatus = await fetchPayoutStatus(invoice.id);
              return { invoiceId: invoice.id, payoutStatus };
            });
            
            const payoutResults = await Promise.all(payoutPromises);
            const newPayoutStatuses = {};
            payoutResults.forEach(({ invoiceId, payoutStatus }) => {
              newPayoutStatuses[invoiceId] = payoutStatus;
            });
            setPayoutStatuses(newPayoutStatuses);
          }
        } catch (backendError) {
          // Only log if it's not a missing API URL error
          if (backendError.message && !backendError.message.includes("API base URL missing")) {
            console.warn("Backend invoices unavailable, falling back to local", backendError.message);
            setError("Backend unavailable. Showing last known invoices.");
          }
        }
      }

      if (!latestInvoices.length) {
        try {
          latestInvoices = await getInvoices();
        } catch (localError) {
          console.warn("Local invoices unavailable, using dummy data");
        }
      }

      // Use dummy data if no invoices found
      if (!latestInvoices.length) {
        console.log("Using dummy invoice data for testing");
        latestInvoices = DUMMY_INVOICES;
        setPayoutStatuses(DUMMY_PAYOUT_STATUSES);
      }

      setInvoices(latestInvoices);
      invoicesRef.current = latestInvoices;
    } catch (err) {
      console.error("Invoice fetch failed:", err);
      setError("Unable to load invoices right now.");
    } finally {
      setRefreshing(false);
    }
  }, [walletAddress]);

  // Poll for payout status updates
  const pollPayoutStatuses = useCallback(async () => {
    const currentInvoices = invoicesRef.current;
    if (!currentInvoices.length) return;
    
    const payoutPromises = currentInvoices.map(async (invoice) => {
      const payoutStatus = await fetchPayoutStatus(invoice.id);
      return { invoiceId: invoice.id, payoutStatus };
    });
    
    const payoutResults = await Promise.all(payoutPromises);
    const newPayoutStatuses = {};
    payoutResults.forEach(({ invoiceId, payoutStatus }) => {
      newPayoutStatuses[invoiceId] = payoutStatus;
    });
    setPayoutStatuses((prev) => ({ ...prev, ...newPayoutStatuses }));
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadInvoices();
      
      // DISABLED: Polling causes too many API calls
      // Start polling for payout statuses every 10 seconds
      // pollingIntervalRef.current = setInterval(() => {
      //   pollPayoutStatuses();
      // }, 10000);
      
      return () => {
        if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current);
        }
      };
    }, [loadInvoices, pollPayoutStatuses])
  );

  const renderInvoice = ({ item }) => (
    <TouchableOpacity
      style={styles.invoiceCard}
      onPress={() =>
        navigation.navigate("InvoiceDetail", {
          invoiceId: item.id,
          invoice: item,
        })
      }
    >
      <View style={styles.cardHeader}>
        <View style={styles.iconContainer}>
          <MaterialIcons name="description" size={24} color={GOLD_COLORS.primary} />
        </View>
        <View style={styles.headerText}>
          <Text style={styles.label}>Invoice</Text>
          <Text style={styles.value} numberOfLines={1}>
            {item.id}
          </Text>
        </View>
      </View>
      <View style={styles.row}>
        <View style={styles.labelRow}>
          <MaterialIcons name="monetization-on" size={16} color={GOLD_COLORS.primary} />
          <Text style={styles.label}> Amount</Text>
        </View>
        <Text style={[styles.value, styles.amountValue]}>{item.amount} GRX</Text>
      </View>
      <View style={styles.row}>
        <Text style={styles.label}>Status</Text>
        <Text
          style={[
            styles.statusPill,
            {
              color: "#fff",
              backgroundColor:
                STATUS_COLORS[item.status?.toUpperCase()] ||
                theme.colors.textSecondary,
            },
          ]}
        >
          {(item.status || "pending").replace(/_/g, " ")}
        </Text>
      </View>
      <View style={styles.row}>
        <Text style={styles.label}>Timestamp</Text>
        <Text style={styles.value}>{item.timestamp}</Text>
      </View>
      {item.totalUSD && (
        <View style={styles.row}>
          <Text style={styles.label}>Oracle Payout</Text>
          <Text style={styles.value}>${Number(item.totalUSD).toFixed(2)}</Text>
        </View>
      )}
      <View style={styles.row}>
        <Text style={styles.label}>Settlement</Text>
        <Text style={styles.value}>
          {item.settlementAmount && item.settlementCurrency
            ? `${item.settlementAmount} ${item.settlementCurrency}`
            : "—"}
        </Text>
      </View>
      {payoutStatuses[item.id] && (
        <View style={styles.payoutSection}>
          <View style={styles.row}>
            <Text style={styles.label}>Payout Amount</Text>
            <Text style={styles.value}>
              {payoutStatuses[item.id].payoutAmount}{" "}
              {payoutStatuses[item.id].payoutCurrency}
            </Text>
          </View>
          {payoutStatuses[item.id].partnerId && (
            <View style={styles.row}>
              <Text style={styles.label}>Partner ID</Text>
              <Text style={styles.value}>
                {payoutStatuses[item.id].partnerId}
              </Text>
            </View>
          )}
          {(payoutStatuses[item.id].payoutTx ||
            payoutStatuses[item.id].confirmationCode) && (
            <View style={styles.row}>
              <Text style={styles.label}>Confirmation</Text>
              <Text style={[styles.value, styles.confirmationCode]}>
                {payoutStatuses[item.id].payoutTx ||
                  payoutStatuses[item.id].confirmationCode}
              </Text>
            </View>
          )}
        </View>
      )}
      {item.txHash && (
        <TouchableOpacity
          style={styles.linkButton}
          onPress={() => {
            const url = getExplorerUrl(item.network, item.isTestnet, item.txHash);
            if (url) {
              Linking.openURL(url);
            }
          }}
        >
          <Ionicons name="open-outline" size={16} color={GOLD_COLORS.primary} />
          <Text style={styles.linkText}> View on Explorer</Text>
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );

  return (
    <FlatList
      style={styles.container}
      contentContainerStyle={styles.content}
      data={invoices}
      keyExtractor={(item, index) => `${item.id}-${index}`}
      renderItem={renderInvoice}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={loadInvoices} />
      }
      ListEmptyComponent={
        <View style={styles.emptyState}>
          <MaterialIcons name="inbox" size={64} color={theme.colors.textSecondary} />
          <Text style={styles.emptyTitle}>No invoices yet</Text>
          <Text style={styles.emptySubtitle}>
            Burn GRX via the Redeem screen to generate invoices.
          </Text>
          {error && <Text style={styles.errorText}>{error}</Text>}
        </View>
      }
    />
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  content: {
    height:"100vh",
    overflow:"auto",
    padding: theme.spacing.lg,
    gap: theme.spacing.md,
  },
  invoiceCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    ...theme.shadows.small,
    borderWidth: 1.5,
    borderColor: GOLD_COLORS.light,
    marginBottom: theme.spacing.md,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: theme.spacing.md,
    paddingBottom: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: GOLD_COLORS.light,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: GOLD_COLORS.light,
    justifyContent: "center",
    alignItems: "center",
    marginRight: theme.spacing.sm,
  },
  headerText: {
    flex: 1,
  },
  labelRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: theme.spacing.xs,
  },
  label: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    fontWeight: "600",
  },
  value: {
    fontSize: 14,
    color: theme.colors.text,
    flex: 1,
    textAlign: "right",
  },
  linkButton: {
    marginTop: theme.spacing.sm,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    backgroundColor: GOLD_COLORS.light,
    paddingVertical: theme.spacing.xs,
    paddingHorizontal: theme.spacing.sm,
    borderRadius: theme.borderRadius.sm,
  },
  linkText: {
    color: GOLD_COLORS.dark,
    fontWeight: "600",
  },
  amountValue: {
    color: GOLD_COLORS.primary,
    fontWeight: "700",
  },
  statusPill: {
    fontSize: 12,
    fontWeight: "700",
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 999,
    overflow: "hidden",
    textTransform: "uppercase",
  },
  emptyState: {
    padding: theme.spacing.lg,
    alignItems: "center",
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: theme.colors.text,
  },
  emptySubtitle: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    textAlign: "center",
    marginTop: theme.spacing.xs,
  },
  errorText: {
    marginTop: theme.spacing.sm,
    color: theme.colors.error,
    textAlign: "center",
  },
  payoutSection: {
    marginTop: theme.spacing.sm,
    paddingTop: theme.spacing.sm,
    borderTopWidth: 1.5,
    borderTopColor: GOLD_COLORS.light,
    backgroundColor: GOLD_COLORS.light + "20",
    padding: theme.spacing.sm,
    borderRadius: theme.borderRadius.sm,
  },
  confirmationCode: {
    fontFamily: "monospace",
    fontSize: 12,
  },
});

export default InvoicesScreen;


