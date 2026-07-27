import React, { useEffect, useState, useCallback, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
  ActivityIndicator,
} from "react-native";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { useRoute } from "@react-navigation/native";
import {
  fetchBackendInvoiceDetail,
  fetchPayoutStatus,
} from "../services/backendInvoiceService";
import { getInvoices } from "../services/invoiceService";
import { theme } from "../styles/theme";
import { NETWORKS } from "../utils/constants";

// Gold color constants
const GOLD_COLORS = {
  primary: "#D4AF37",
  light: "#F4E4BC",
  dark: "#B8941F",
  accent: "#FFD700",
};

const statusColor = (status) => {
  switch ((status || "").toUpperCase()) {
    case "RECEIVED":
      return theme.colors.primary;
    case "AWAITING_REDEEM":
      return theme.colors.warning;
    case "BURN_PENDING":
      return theme.colors.primaryDark;
    case "USED":
      return theme.colors.textSecondary;
    case "SETTLED":
      return theme.colors.success;
    default:
      return theme.colors.textSecondary;
  }
};

const InvoiceDetailScreen = () => {
  const route = useRoute();
  const { invoiceId, invoice: initialInvoice } =
    route.params || {};
  const [invoice, setInvoice] = useState(initialInvoice || null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [payoutStatus, setPayoutStatus] = useState(null);
  const pollingIntervalRef = useRef(null);

  const explorerUrl =
    invoice?.txHash &&
    getExplorerUrl(
      invoice?.network || "GRX", // Default to GRX since that's the main chain
      invoice?.isTestnet || false,
      invoice.txHash
    );

  const loadDetail = useCallback(async () => {
    if (!invoiceId && !invoice?.id) return;
    setLoading(true);
    setError(null);
    try {
      const detail = await fetchBackendInvoiceDetail(invoiceId || invoice?.id);
      setInvoice((prev) => ({ ...prev, ...detail }));
    } catch (apiError) {
      console.warn("Backend invoice detail unavailable", apiError.message);
      try {
        const savedInvoices = await getInvoices();
        const fallback =
          savedInvoices.find((entry) => entry.id === invoiceId) || invoice;
        setInvoice(fallback || null);
      } catch (localError) {
        setError("Unable to load invoice details.");
      }
    } finally {
      setLoading(false);
    }
  }, [invoiceId, invoice?.id]);

  const loadPayoutStatus = useCallback(async () => {
    const id = invoiceId || invoice?.id;
    if (!id) return;
    
    const status = await fetchPayoutStatus(id);
    setPayoutStatus(status);
  }, [invoiceId, invoice?.id]);

  useEffect(() => {
    loadDetail();
    loadPayoutStatus();
    
    // DISABLED: Polling causes too many API calls
    // Poll for payout status updates every 10 seconds
    // pollingIntervalRef.current = setInterval(() => {
    //   loadPayoutStatus();
    // }, 10000);
    
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, [loadDetail, loadPayoutStatus]);

  if (!invoice) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>Invoice not found.</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <MaterialIcons name="description" size={24} color={GOLD_COLORS.primary} />
          <Text style={styles.cardLabel}>Invoice</Text>
        </View>
        <Text style={styles.cardValue}>{invoice.id}</Text>
        <Text style={styles.subtitle}>Burned {invoice.amount} GRX</Text>

        <View style={styles.statusRow}>
          <Text style={styles.statusLabel}>Status</Text>
          <Text
            style={[
              styles.statusPill,
              { backgroundColor: statusColor(invoice.status) },
            ]}
          >
            {(invoice.status || "pending").replace(/_/g, " ")}
          </Text>
        </View>

        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Settlement</Text>
          <Text style={styles.detailValue}>
            {invoice.settlementAmount && invoice.settlementCurrency
              ? `${invoice.settlementAmount} ${invoice.settlementCurrency}`
              : "Pending"}
          </Text>
        </View>

        {invoice.totalUSD && (
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Oracle Payout</Text>
            <Text style={styles.detailValue}>
              ${Number(invoice.totalUSD).toFixed(2)}
            </Text>
          </View>
        )}

        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Network</Text>
          <Text style={styles.detailValue}>
            {invoice.network || "ETHEREUM"} {invoice.isTestnet ? "(Testnet)" : ""}
          </Text>
        </View>

        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Timestamp</Text>
          <Text style={styles.detailValue}>{invoice.timestamp}</Text>
        </View>

        {explorerUrl && (
          <TouchableOpacity
            style={styles.explorerButton}
            onPress={() => Linking.openURL(explorerUrl)}
          >
            <Ionicons name="open-outline" size={18} color={GOLD_COLORS.primary} />
            <Text style={styles.explorerText}> View on Explorer</Text>
          </TouchableOpacity>
        )}
      </View>

      {payoutStatus && (
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <MaterialIcons name="payment" size={24} color={GOLD_COLORS.primary} />
            <Text style={styles.cardLabel}>Payout Confirmation</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Payout Amount</Text>
            <Text style={styles.detailValue}>
              {payoutStatus.payoutAmount} {payoutStatus.payoutCurrency}
            </Text>
          </View>
          {payoutStatus.partnerId && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Partner ID</Text>
              <Text style={styles.detailValue}>{payoutStatus.partnerId}</Text>
            </View>
          )}
          {(payoutStatus.payoutTx || payoutStatus.confirmationCode) && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>
                {payoutStatus.payoutTx ? "Transaction Hash" : "Confirmation Code"}
              </Text>
              <Text style={[styles.detailValue, styles.confirmationCode]}>
                {payoutStatus.payoutTx || payoutStatus.confirmationCode}
              </Text>
            </View>
          )}
        </View>
      )}

      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <MaterialIcons name="timeline" size={24} color={GOLD_COLORS.primary} />
          <Text style={styles.cardLabel}>Timeline</Text>
        </View>
        {loading && (
          <ActivityIndicator color={theme.colors.primary} style={styles.loader} />
        )}
        {invoice.events?.length ? (
          invoice.events.map((event, index) => (
            <View key={event.id || index} style={styles.timelineRow}>
              <View style={styles.timelineDot} />
              <View style={styles.timelineContent}>
                <Text style={styles.timelineTitle}>{event.title || event.type}</Text>
                <Text style={styles.timelineSubtitle}>
                  {event.description || event.message}
                </Text>
                <Text style={styles.timelineTimestamp}>{event.timestamp}</Text>
              </View>
            </View>
          ))
        ) : (
          <Text style={styles.emptyTimeline}>No timeline events yet.</Text>
        )}
      </View>

      {error && <Text style={styles.errorText}>{error}</Text>}
    </ScrollView>
  );
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  content: {
    padding: theme.spacing.lg,
    gap: theme.spacing.lg,
  },
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    borderWidth: 1.5,
    borderColor: GOLD_COLORS.light,
    ...theme.shadows.small,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: theme.spacing.sm,
  },
  cardLabel: {
    fontSize: 18,
    fontWeight: "700",
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  cardValue: {
    fontSize: 20,
    fontWeight: "600",
    color: theme.colors.text,
  },
  subtitle: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.md,
  },
  statusRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: theme.spacing.md,
  },
  statusLabel: {
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
  statusPill: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "700",
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 999,
    textTransform: "uppercase",
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: theme.spacing.sm,
  },
  detailLabel: {
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
  detailValue: {
    fontSize: 14,
    color: theme.colors.text,
    textAlign: "right",
    flexShrink: 1,
  },
  explorerButton: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: theme.spacing.md,
    alignSelf: "flex-start",
    backgroundColor: GOLD_COLORS.light,
    paddingVertical: theme.spacing.xs,
    paddingHorizontal: theme.spacing.sm,
    borderRadius: theme.borderRadius.sm,
  },
  explorerText: {
    color: GOLD_COLORS.dark,
    fontWeight: "600",
  },
  timelineRow: {
    flexDirection: "row",
    marginBottom: theme.spacing.md,
  },
  timelineDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: GOLD_COLORS.primary,
    marginRight: theme.spacing.md,
    marginTop: 4,
  },
  timelineContent: {
    flex: 1,
  },
  timelineTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: theme.colors.text,
  },
  timelineSubtitle: {
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
  timelineTimestamp: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginTop: 4,
  },
  emptyTimeline: {
    color: theme.colors.textSecondary,
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: theme.spacing.lg,
  },
  errorText: {
    color: theme.colors.error,
    textAlign: "center",
  },
  loader: {
    marginVertical: theme.spacing.md,
  },
  confirmationCode: {
    fontFamily: "monospace",
    fontSize: 12,
  },
});

export default InvoiceDetailScreen;


