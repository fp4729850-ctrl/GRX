import React, { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Clipboard,
  Alert,
  Animated,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useWallet } from "../context/WalletContext";
import { useGRXBalance } from "../hooks/useGRXBalance";
import BalanceCard from "../components/BalanceCard";
import Coin3D from "../components/Coin3D";
import { formatAddress } from "../utils/validation";
import { theme } from "../styles/theme";
import { fetchMetalPrices } from "../services/metalPriceService";
import { fetchOracleSnapshot } from "../services/oracleSnapshotService";

const DashboardScreen = ({ navigation }) => {
  const {
    walletAddress,
    currentNetwork,
    isTestnet,
    ethBalance,
    usdtBalance,
    ethBalanceUSD,
    usdtBalanceUSD,
    loading,
    refreshBalances,
    refreshPrices,
    updateNetwork,
    custodialMode,
  } = useWallet();
  const {
    balance: grxBalance,
    loading: grxBalanceLoading,
    error: grxBalanceError,
  } = useGRXBalance(walletAddress, currentNetwork, isTestnet);
  const formattedGrxBalance = parseFloat(grxBalance || "0").toFixed(4);
  const [isDropdownOpen, setDropdownOpen] = useState(false);
  const [metalTicker, setMetalTicker] = useState(null);
  const [metalError, setMetalError] = useState(null);
  const [oracleSnapshot, setOracleSnapshot] = useState(null);
  const [oracleError, setOracleError] = useState(null);
  const scrollX = useRef(new Animated.Value(0)).current;
  const networkOptions = [
    { key: "ETHEREUM", label: "Ethereum" },
    { key: "BSC", label: "BNB Chain" },
  ];

  useEffect(() => {
    refreshBalances();
    refreshPrices();
    loadMetalPrices();
    loadOracleSnapshot();
  }, []);

  useEffect(() => {
    if (metalTicker?.goldPerGramUSD) {
      const scrollWidth = 300;
      Animated.loop(
        Animated.sequence([
          Animated.timing(scrollX, {
            toValue: -scrollWidth,
            duration: 12000,
            useNativeDriver: true,
          }),
          Animated.timing(scrollX, {
            toValue: 0,
            duration: 0,
            useNativeDriver: true,
          }),
        ])
      ).start();
    }
  }, [metalTicker]);

  const loadMetalPrices = async () => {
    try {
      const data = await fetchMetalPrices();
      setMetalTicker(data);
      setMetalError(null);
    } catch (error) {
      console.warn("Metal price fetch failed:", error?.message);
      setMetalError("Live metal quotes unavailable.");
    }
  };

  const loadOracleSnapshot = async () => {
    try {
      const snapshot = await fetchOracleSnapshot();
      setOracleSnapshot(snapshot);
      setOracleError(null);
    } catch (error) {
      console.error("Oracle snapshot fetch failed:", error?.message);
      setOracleError("Oracle snapshot unavailable.");
    }
  };

  const handleRefresh = async () => {
    await refreshBalances();
    await refreshPrices();
    await loadMetalPrices();
  };

  const handleCopyAddress = () => {
    Clipboard.setString(walletAddress);
    Alert.alert("Copied", "Wallet address copied to clipboard");
  };

  const handleSelectNetwork = async (network) => {
    setDropdownOpen(false);
    updateNetwork(network, isTestnet);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={handleRefresh} />
        }
        showsVerticalScrollIndicator
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.content}>
        {/* Top Bar */}
        <View style={styles.topBar}>
          <View style={styles.networkSelector}>
            <TouchableOpacity
              style={styles.networkButton}
              onPress={() => setDropdownOpen(!isDropdownOpen)}
            >
              <Text style={styles.networkLabel}>
                {currentNetwork === "ETHEREUM" ? "Ethereum" : "BNB Chain"}
              </Text>
              <Text style={styles.dropdownIcon}>
                {isDropdownOpen ? "▲" : "▼"}
              </Text>
            </TouchableOpacity>
            {isDropdownOpen && (
              <View style={styles.dropdownMenu}>
                {networkOptions.map((option) => (
                  <TouchableOpacity
                    key={option.key}
                    style={[
                      styles.dropdownItem,
                      currentNetwork === option.key &&
                        styles.dropdownItemActive,
                    ]}
                    onPress={() => handleSelectNetwork(option.key)}
                  >
                    <Text
                      style={[
                        styles.dropdownItemText,
                        currentNetwork === option.key &&
                          styles.dropdownItemTextActive,
                      ]}
                    >
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
          <TouchableOpacity
            style={styles.profileButton}
            onPress={() => navigation.navigate("Settings")}
          >
            <Text style={styles.profileIcon}>👤</Text>
          </TouchableOpacity>
        </View>

        {/* Wallet Address */}
        <View style={styles.addressContainer}>
          <Text style={styles.addressLabel}>Wallet Address</Text>
          <View style={styles.addressRow}>
            <Text style={styles.addressText}>
              {formatAddress(walletAddress)}
            </Text>
            <TouchableOpacity
              style={styles.copyButton}
              onPress={handleCopyAddress}
            >
              <Text style={styles.copyButtonText}>Copy</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Mode Banner */}
        <View
          style={[
            styles.modeBanner,
            custodialMode ? styles.custodialBanner : styles.onchainBanner,
          ]}
        >
          <Text
            style={[
              styles.modeBannerText,
              custodialMode ? styles.custodialBannerText : styles.onchainBannerText,
            ]}
          >
            {custodialMode
              ? "Custodial wallet active · Backend team signs transactions"
              : "Self-custody mode · You sign every on-chain transaction"}
          </Text>
        </View>

        {metalTicker?.goldPerGramUSD && (
          <View style={styles.tickerContainer}>
            <Animated.View
              style={[
                styles.tickerScrollContent,
                { transform: [{ translateX: scrollX }] },
              ]}
            >
              {[0, 1, 2].map((i) => (
                <View style={styles.tickerChip} key={`ticker-${i}`}>
                  <Text style={styles.tickerLabel}>🪙 Gold (24K)</Text>
                  <Text style={styles.tickerValue}>
                    ${Number(metalTicker.goldPerGramUSD).toFixed(2)} / gram
                  </Text>
                </View>
              ))}
            </Animated.View>
          </View>
        )}
        {metalError && (
          <Text style={styles.tickerError}>{metalError}</Text>
        )}

        {oracleSnapshot && (
          <View style={styles.oracleCard}>
            <Text style={styles.sectionOverline}>Oracle Snapshot</Text>
            <View style={styles.oracleRow}>
              <Text style={styles.oracleLabel}>Gold</Text>
              <Text style={styles.oracleValue}>
                ₹
                {Number(oracleSnapshot.goldPriceINRPerGram ?? 0).toLocaleString(
                  "en-IN",
                  { maximumFractionDigits: 2 }
                )}{" "}
                / gram
              </Text>
            </View>
            <View style={styles.oracleDivider} />
            <View style={styles.oracleFxGrid}>
              {["INR", "AED", "RUB", "CNY"].map((currency) => (
                <View key={currency} style={styles.oracleFxItem}>
                  <Text style={styles.fxLabel}>USD → {currency}</Text>
                  <Text style={styles.fxValue}>
                    {oracleSnapshot.fx?.[currency]?.toFixed(4) ?? "--"}
                  </Text>
                </View>
              ))}
            </View>
            <Text style={styles.oracleTimestamp}>
              Last updated:{" "}
              {oracleSnapshot.updatedAt
                ? new Date(oracleSnapshot.updatedAt).toLocaleString()
                : "—"}
            </Text>
          </View>
        )}
        {oracleError && (
          <Text style={styles.tickerError}>{oracleError}</Text>
        )}

        {/* Coin Icon */}
        <View style={styles.coinContainer}>
          <View style={styles.badgeRow}>
            <Text style={styles.sectionOverline}>Portfolio Snapshot</Text>
            <View style={styles.networkPill}>
              <Text style={styles.networkPillText}>
                {currentNetwork === "ETHEREUM" ? "Ethereum" : "BNB"} ·{" "}
                {isTestnet ? "Testnet" : "Mainnet"}
              </Text>
            </View>
          </View>
          <Coin3D />
        </View>

        <Text style={styles.sectionOverline}>GRX Tokens</Text>
        <View style={styles.mintBalanceCard}>
          <View style={styles.mintHeader}>
            <Text style={styles.mintTitle}>MINT GRX BALANCE</Text>
            <Text style={styles.mintIcon}>🪙</Text>
          </View>
          <Text style={styles.mintAmount}>
            {grxBalanceLoading ? "…" : `${formattedGrxBalance} GRX`}
          </Text>
          <Text style={styles.mintSubText}>
            {grxBalanceError
              ? grxBalanceError
              : "Auto-refreshes every 3s or when app resumes"}
          </Text>
          <View style={styles.cardActionRow}>
            <TouchableOpacity
              style={styles.cardActionButton}
              onPress={() => navigation.navigate("Send")}
            >
              <Text style={styles.cardActionIcon}>📤</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.cardActionButton}
              onPress={() => navigation.navigate("Receive")}
            >
              <Text style={styles.cardActionIcon}>📥</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.ownershipBalanceCard}>
          <View style={styles.mintHeader}>
            <Text style={styles.ownershipTitle}>OWNERSHIP GRX BALANCE</Text>
            <Text style={styles.ownershipIcon}>🏛️</Text>
          </View>
          <Text style={styles.ownershipAmount}>
            {grxBalanceLoading ? "…" : `${formattedGrxBalance} GRX`}
          </Text>
          <Text style={styles.ownershipSubText}>
            Redeem GRX for physical ownership via burn invoices.
          </Text>
          <View style={styles.cardActionRow}>
            <TouchableOpacity
              style={styles.cardActionButton}
              onPress={() => navigation.navigate("Send")}
            >
              <Text style={styles.cardActionIcon}>📤</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.cardActionButton}
              onPress={() => navigation.navigate("Receive")}
            >
              <Text style={styles.cardActionIcon}>📥</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.totalBalance}>
          <Text style={styles.totalLabel}>Total Balance</Text>
          <Text style={styles.totalAmount}>
            {ethBalance} {currentNetwork === "ETHEREUM" ? "ETH" : "GRX"}
          </Text>
          <Text style={styles.totalSubText}>≈ {ethBalanceUSD} USD</Text>
        </View>

        <Text style={styles.sectionOverline}>Assets</Text>
        {/* Balance Cards */}
        <BalanceCard
          symbol={currentNetwork === "ETHEREUM" ? "ETH" : "BNB"}
          balance={ethBalance}
          usdBalance={ethBalanceUSD}
          icon="💰"
        />

        <BalanceCard
          symbol="USDT"
          balance={usdtBalance}
          usdBalance={usdtBalanceUSD}
          icon="💵"
        />

        <BalanceCard
          symbol="GRX"
          balance={formattedGrxBalance}
          usdBalance="—"
          icon="🏅"
        />

        {/* Action Cards */}
        <Text style={styles.sectionOverline}>Quick Actions</Text>
        <View style={styles.actionGrid}>
          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => navigation.navigate("Mint")}
          >
            <Text style={styles.actionEmoji}>🪙</Text>
            <Text style={styles.actionTitle}>Mint</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => navigation.navigate("Vault")}
          >
            <Text style={styles.actionEmoji}>🏛️</Text>
            <Text style={styles.actionTitle}>View Ownership</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => navigation.navigate("Send")}
          >
            <Text style={styles.actionEmoji}>📤</Text>
            <Text style={styles.actionTitle}>Send / Receive</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => navigation.navigate("Redeem")}
          >
            <Text style={styles.actionEmoji}>📄</Text>
            <Text style={styles.actionTitle}>Redeem</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => navigation.navigate("Invoices")}
          >
            <Text style={styles.actionEmoji}>🧾</Text>
            <Text style={styles.actionTitle}>Invoices</Text>
          </TouchableOpacity>
        </View>

        {/* Recent Transactions Placeholder */}
        <View style={styles.transactionsContainer}>
          <Text style={styles.sectionTitle}>Recent Transactions</Text>
          <Text style={styles.emptyText}>No transactions yet</Text>
        </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scrollContent: {
    paddingBottom: theme.spacing.xl * 2,
  },
  content: {
    padding: theme.spacing.lg,
  },
  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: theme.spacing.md,
  },
  networkSelector: {
    position: "relative",
  },
  networkButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: theme.colors.surface,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  networkLabel: {
    fontSize: 16,
    fontWeight: "600",
    marginRight: 8,
  },
  dropdownIcon: {
    fontSize: 12,
  },
  dropdownMenu: {
    position: "absolute",
    top: 48,
    left: 0,
    width: 180,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...theme.shadows.small,
    zIndex: 10,
  },
  dropdownItem: {
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  dropdownItemActive: {
    backgroundColor: theme.colors.primaryLight,
  },
  dropdownItemText: {
    fontSize: 14,
    color: theme.colors.text,
  },
  dropdownItemTextActive: {
    fontWeight: "600",
    color: theme.colors.secondary,
  },
  profileButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: theme.colors.surface,
    justifyContent: "center",
    alignItems: "center",
    ...theme.shadows.small,
  },
  profileIcon: {
    fontSize: 20,
  },
  addressContainer: {
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing.md,
    ...theme.shadows.small,
  },
  addressLabel: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.xs,
  },
  addressRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  addressText: {
    fontSize: 16,
    fontWeight: "600",
    color: theme.colors.text,
    flex: 1,
  },
  copyButton: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
  },
  copyButtonText: {
    color: theme.colors.primary,
    fontSize: 14,
    fontWeight: "600",
  },
  coinContainer: {
    alignItems: "center",
    marginBottom: theme.spacing.lg,
  },
  badgeRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: theme.spacing.sm,
  },
  networkPill: {
    backgroundColor: theme.colors.surfaceAlt,
    borderRadius: 999,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  networkPillText: {
    color: theme.colors.textSecondary,
    fontSize: 12,
    fontWeight: "600",
  },
  totalBalance: {
    backgroundColor: theme.colors.surfaceAlt,
    padding: theme.spacing.lg,
    borderRadius: theme.borderRadius.lg,
    alignItems: "center",
    marginBottom: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...theme.shadows.small,
  },
  totalLabel: {
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
  totalAmount: {
    fontSize: 32,
    fontWeight: "bold",
    color: theme.colors.text,
    marginTop: theme.spacing.xs,
  },
  totalSubText: {
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
  mintBalanceCard: {
    backgroundColor: theme.colors.surfaceAlt,
    padding: theme.spacing.lg,
    borderRadius: theme.borderRadius.lg,
    marginBottom: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...theme.shadows.medium,
    position: "relative",
    minHeight: 140,
  },
  mintHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: theme.spacing.sm,
  },
  mintTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: theme.colors.text,
  },
  mintIcon: {
    fontSize: 24,
  },
  mintAmount: {
    fontSize: 32,
    fontWeight: "bold",
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
    marginTop: theme.spacing.xs,
  },
  mintSubText: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.sm,
    paddingRight: 100,
  },
  ownershipBalanceCard: {
    backgroundColor: theme.colors.surfaceAlt,
    padding: theme.spacing.lg,
    borderRadius: theme.borderRadius.lg,
    marginBottom: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...theme.shadows.medium,
    position: "relative",
    minHeight: 140,
  },
  ownershipTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: theme.colors.text,
  },
  ownershipIcon: {
    fontSize: 24,
  },
  ownershipAmount: {
    fontSize: 32,
    fontWeight: "bold",
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
    marginTop: theme.spacing.xs,
  },
  ownershipSubText: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.sm,
    paddingRight: 100,
  },
  cardActionRow: {
    flexDirection: "row",
    gap: theme.spacing.sm,
    position: "absolute",
    bottom: theme.spacing.md,
    right: theme.spacing.md,
    alignItems: "center",
  },
  cardActionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.primary,
    justifyContent: "center",
    alignItems: "center",
    ...theme.shadows.small,
  },
  cardActionIcon: {
    fontSize: 18,
  },
  actionGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginVertical: theme.spacing.lg,
  },
  actionCard: {
    width: "48%",
    backgroundColor: theme.colors.surfaceAlt,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.md,
    alignItems: "center",
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...theme.shadows.small,
  },
  actionEmoji: {
    fontSize: 28,
    marginBottom: theme.spacing.sm,
  },
  actionTitle: {
    fontSize: 14,
    fontWeight: "600",
    textAlign: "center",
  },
  transactionsContainer: {
    backgroundColor: theme.colors.surfaceAlt,
    padding: theme.spacing.lg,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...theme.shadows.small,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  emptyText: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    textAlign: "center",
    paddingVertical: theme.spacing.lg,
  },
  sectionOverline: {
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 1,
    textTransform: "uppercase",
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.sm,
  },
  modeBanner: {
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.lg,
  },
  custodialBanner: {
    backgroundColor: theme.colors.surfaceAlt,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  onchainBanner: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  modeBannerText: {
    fontSize: 14,
    fontWeight: "600",
  },
  custodialBannerText: {
    color: theme.colors.warning,
  },
  onchainBannerText: {
    color: theme.colors.accent,
  },
  tickerContainer: {
    height: 64,
    marginBottom: theme.spacing.lg,
    overflow: "hidden",
    backgroundColor: theme.colors.surfaceAlt,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  tickerScrollContent: {
    flexDirection: "row",
    alignItems: "center",
    height: "100%",
    paddingHorizontal: theme.spacing.md,
  },
  tickerChip: {
    marginRight: theme.spacing.lg,
  },
  tickerLabel: {
    fontSize: 12,
    textTransform: "uppercase",
    fontWeight: "600",
    color: theme.colors.textSecondary,
  },
  tickerValue: {
    fontSize: 16,
    fontWeight: "700",
    color: theme.colors.text,
  },
  tickerError: {
    fontSize: 12,
    color: theme.colors.error,
    marginBottom: theme.spacing.lg,
  },
  oracleCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginBottom: theme.spacing.lg,
  },
  oracleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  oracleLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: theme.colors.text,
  },
  oracleValue: {
    fontSize: 18,
    fontWeight: "700",
    color: theme.colors.primary,
  },
  oracleDivider: {
    marginVertical: theme.spacing.md,
    height: 1,
    backgroundColor: theme.colors.border,
  },
  oracleFxGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.spacing.md,
  },
  oracleFxItem: {
    width: "45%",
  },
  fxLabel: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    textTransform: "uppercase",
    fontWeight: "600",
  },
  fxValue: {
    fontSize: 16,
    fontWeight: "700",
    color: theme.colors.text,
  },
  oracleTimestamp: {
    marginTop: theme.spacing.md,
    fontSize: 12,
    color: theme.colors.textSecondary,
  },
});

export default DashboardScreen;
