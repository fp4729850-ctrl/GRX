import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
  ActivityIndicator,
} from "react-native";
import { useRoute } from "@react-navigation/native";
import { fetchBackendInvoiceDetail } from "../services/backendInvoiceService";
import { getInvoices } from "../services/invoiceService";
import { theme } from "../styles/theme";
import { NETWORKS } from "../utils/constants";

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

  const explorerUrl =
    invoice?.txHash &&
    getExplorerUrl(
      invoice?.network || "ETHEREUM",
      invoice?.isTestnet,
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

  useEffect(() => {
    loadDetail();
  }, [loadDetail]);

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
        <Text style={styles.cardLabel}>Invoice</Text>
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
            <Text style={styles.explorerText}>View on Explorer</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.card}>
        <Text style={styles.cardLabel}>Timeline</Text>
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
  const isEthereum = networkKey === "ETHEREUM";
  const network = isEthereum
    ? isTestnet
      ? NETWORKS.ETHEREUM_TESTNET
      : NETWORKS.ETHEREUM_MAINNET
    : isTestnet
    ? NETWORKS.BSC_TESTNET
    : NETWORKS.BSC_MAINNET;
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
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...theme.shadows.small,
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
    marginTop: theme.spacing.md,
    alignSelf: "flex-start",
  },
  explorerText: {
    color: theme.colors.primary,
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
    backgroundColor: theme.colors.primary,
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
});

export default InvoiceDetailScreen;


