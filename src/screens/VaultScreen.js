import React from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons, Ionicons } from "@expo/vector-icons";
import { theme } from "../styles/theme";

// Gold color constants
const GOLD_COLORS = {
  primary: "#D4AF37",
  light: "#F4E4BC",
  dark: "#B8941F",
  accent: "#FFD700",
};

// Dummy ownership data
const DUMMY_OWNERSHIP_DATA = {
  totalOwnership: "1250.5000",
  totalValueUSD: "94387.75",
  holdings: [
    {
      id: "HOLD-001",
      amount: "500.2500",
      valueUSD: "37762.50",
      status: "Active",
      purchaseDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toLocaleDateString(),
    },
    {
      id: "HOLD-002",
      amount: "750.2500",
      valueUSD: "56625.25",
      status: "Active",
      purchaseDate: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toLocaleDateString(),
    },
  ],
  recentTransfers: [
    {
      id: "TRF-001",
      type: "Received",
      amount: "100.0000",
      from: "0x1234...5678",
      date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toLocaleDateString(),
    },
    {
      id: "TRF-002",
      type: "Sent",
      amount: "50.0000",
      to: "0xabcd...efgh",
      date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toLocaleDateString(),
    },
  ],
};

const VaultScreen = ({ navigation }) => {
  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <View style={styles.iconContainer}>
            <MaterialIcons name="account-balance" size={64} color={GOLD_COLORS.primary} />
          </View>
          <Text style={styles.title}>Ownership Vault</Text>
          <Text style={styles.subtitle}>
            Your tokenized gold ownership portfolio
          </Text>
        </View>

        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Total Ownership</Text>
          <Text style={styles.summaryAmount}>{DUMMY_OWNERSHIP_DATA.totalOwnership} GRX</Text>
          <Text style={styles.summaryValue}>≈ ${DUMMY_OWNERSHIP_DATA.totalValueUSD} USD</Text>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <MaterialIcons name="inventory" size={20} color={GOLD_COLORS.primary} />
            <Text style={styles.sectionTitle}>Holdings</Text>
          </View>
          {DUMMY_OWNERSHIP_DATA.holdings.map((holding) => (
            <View key={holding.id} style={styles.holdingCard}>
              <View style={styles.holdingHeader}>
                <Text style={styles.holdingId}>{holding.id}</Text>
                <View style={[styles.statusBadge, holding.status === "Active" && styles.statusActive]}>
                  <Text style={styles.statusText}>{holding.status}</Text>
                </View>
              </View>
              <View style={styles.holdingRow}>
                <Text style={styles.holdingLabel}>Amount:</Text>
                <Text style={styles.holdingValue}>{holding.amount} GRX</Text>
              </View>
              <View style={styles.holdingRow}>
                <Text style={styles.holdingLabel}>Value:</Text>
                <Text style={styles.holdingValue}>${holding.valueUSD} USD</Text>
              </View>
              <View style={styles.holdingRow}>
                <Text style={styles.holdingLabel}>Purchase Date:</Text>
                <Text style={styles.holdingDate}>{holding.purchaseDate}</Text>
              </View>
            </View>
          ))}
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <MaterialIcons name="swap-horiz" size={20} color={GOLD_COLORS.primary} />
            <Text style={styles.sectionTitle}>Recent Transfers</Text>
          </View>
          {DUMMY_OWNERSHIP_DATA.recentTransfers.map((transfer) => (
            <View key={transfer.id} style={styles.transferCard}>
              <View style={styles.transferHeader}>
                <Ionicons
                  name={transfer.type === "Received" ? "arrow-down-circle" : "arrow-up-circle"}
                  size={24}
                  color={transfer.type === "Received" ? GOLD_COLORS.primary : theme.colors.textSecondary}
                />
                <View style={styles.transferInfo}>
                  <Text style={styles.transferType}>{transfer.type}</Text>
                  <Text style={styles.transferAmount}>{transfer.amount} GRX</Text>
                </View>
                <Text style={styles.transferDate}>{transfer.date}</Text>
              </View>
              <Text style={styles.transferAddress}>
                {transfer.type === "Received" ? "From: " : "To: "}
                {transfer.from || transfer.to}
              </Text>
            </View>
          ))}
        </View>

        <TouchableOpacity
          style={styles.swapButton}
          onPress={() => navigation.navigate("OwnershipSwap")}
        >
          <Ionicons name="swap-vertical" size={24} color="#FFFFFF" />
          <Text style={styles.swapButtonText}> Ownership Swapping</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  content: {
    height:"100vh",
    overflow:"auto",
    padding: theme.spacing.lg,
  },
  header: {
    alignItems: "center",
    marginBottom: theme.spacing.lg,
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: GOLD_COLORS.light,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: theme.spacing.md,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: GOLD_COLORS.primary,
    marginBottom: theme.spacing.xs,
  },
  subtitle: {
    fontSize: 16,
    color: theme.colors.textSecondary,
    textAlign: "center",
  },
  summaryCard: {
    backgroundColor: GOLD_COLORS.light,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    alignItems: "center",
    marginBottom: theme.spacing.lg,
    borderWidth: 2,
    borderColor: GOLD_COLORS.primary,
    ...theme.shadows.medium,
  },
  summaryLabel: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.xs,
    fontWeight: "600",
  },
  summaryAmount: {
    fontSize: 32,
    fontWeight: "700",
    color: GOLD_COLORS.dark,
    marginBottom: theme.spacing.xs,
  },
  summaryValue: {
    fontSize: 16,
    color: theme.colors.textSecondary,
  },
  section: {
    marginBottom: theme.spacing.lg,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: theme.spacing.md,
    gap: theme.spacing.xs,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: theme.colors.text,
  },
  holdingCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    borderWidth: 1.5,
    borderColor: GOLD_COLORS.light,
    ...theme.shadows.small,
  },
  holdingHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: theme.spacing.sm,
  },
  holdingId: {
    fontSize: 14,
    fontWeight: "600",
    color: theme.colors.textSecondary,
  },
  statusBadge: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: theme.colors.textSecondary + "20",
  },
  statusActive: {
    backgroundColor: GOLD_COLORS.light,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
    color: GOLD_COLORS.dark,
  },
  holdingRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: theme.spacing.xs,
  },
  holdingLabel: {
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
  holdingValue: {
    fontSize: 14,
    fontWeight: "600",
    color: theme.colors.text,
  },
  holdingDate: {
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
  transferCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    borderWidth: 1.5,
    borderColor: GOLD_COLORS.light,
    ...theme.shadows.small,
  },
  transferHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: theme.spacing.xs,
    gap: theme.spacing.sm,
  },
  transferInfo: {
    flex: 1,
  },
  transferType: {
    fontSize: 14,
    fontWeight: "600",
    color: theme.colors.text,
  },
  transferAmount: {
    fontSize: 16,
    fontWeight: "700",
    color: GOLD_COLORS.primary,
  },
  transferDate: {
    fontSize: 12,
    color: theme.colors.textSecondary,
  },
  transferAddress: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    fontFamily: "monospace",
  },
  swapButton: {
    backgroundColor: GOLD_COLORS.primary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    marginTop: theme.spacing.md,
    ...theme.shadows.medium,
  },
  swapButtonText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "600",
  },
});

export default VaultScreen;

