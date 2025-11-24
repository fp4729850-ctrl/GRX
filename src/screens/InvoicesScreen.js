import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  Linking,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { getInvoices } from "../services/invoiceService";
import { NETWORKS } from "../utils/constants";
import { theme } from "../styles/theme";
import { useWallet } from "../context/WalletContext";
import {
  fetchBackendInvoices,
  fetchBackendInvoiceDetail,
} from "../services/backendInvoiceService";

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

const STATUS_COLORS = {
  RECEIVED: theme.colors.primary,
  AWAITING_REDEEM: theme.colors.warning,
  BURN_PENDING: theme.colors.primaryDark,
  USED: theme.colors.textSecondary,
  SETTLED: theme.colors.success,
};

const InvoicesScreen = ({ navigation }) => {
  const [invoices, setInvoices] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const { walletAddress } = useWallet();

  const loadInvoices = useCallback(async () => {
    setRefreshing(true);
    try {
      let latestInvoices = [];

      if (walletAddress) {
        try {
          const backendItems = await fetchBackendInvoices({
            address: walletAddress,
          });

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
        } catch (backendError) {
          console.warn("Backend invoices unavailable, falling back to local", backendError.message);
          setError("Backend unavailable. Showing last known invoices.");
        }
      }

      if (!latestInvoices.length) {
        latestInvoices = await getInvoices();
      }

      setInvoices(latestInvoices);
    } catch (err) {
      console.error("Invoice fetch failed:", err);
      setError("Unable to load invoices right now.");
    } finally {
      setRefreshing(false);
    }
  }, [walletAddress]);

  useFocusEffect(
    useCallback(() => {
      loadInvoices();
    }, [loadInvoices])
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
      <View style={styles.row}>
        <Text style={styles.label}>Invoice</Text>
        <Text style={styles.value} numberOfLines={1}>
          {item.id}
        </Text>
      </View>
      <View style={styles.row}>
        <Text style={styles.label}>Amount</Text>
        <Text style={styles.value}>{item.amount} GRX</Text>
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
          <Text style={styles.linkText}>View on Explorer</Text>
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
    padding: theme.spacing.lg,
    gap: theme.spacing.md,
  },
  invoiceCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    ...theme.shadows.small,
    borderWidth: 1,
    borderColor: theme.colors.border,
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
    alignItems: "flex-end",
  },
  linkText: {
    color: theme.colors.primary,
    fontWeight: "600",
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
});

export default InvoicesScreen;


