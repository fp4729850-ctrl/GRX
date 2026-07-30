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
  Image,
  Linking,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { useWallet } from "../context/WalletContext";
import { useGRXBalance } from "../hooks/useGRXBalance";
import BalanceCard from "../components/BalanceCard";
import { formatAddress } from "../utils/validation";
import { theme } from "../styles/theme";
import { fetchMetalPrices } from "../services/metalPriceService";
import { fetchOracleSnapshot } from "../services/oracleSnapshotService";
import { fetchCombinedTransactionHistory } from "../services/transactionHistoryService";
import { getWalletMappings } from "../services/storageService";

// Gold color constants
const GOLD_COLORS = {
  primary: "#D4AF37",
  light: "#F4E4BC",
  dark: "#B8941F",
  accent: "#FFD700",
};

// Dummy data for testing when APIs fail
const DUMMY_DATA = {
  metalTicker: {
    goldPerGramUSD: 75.50, // Example gold price per gram in USD
  },
  oracleSnapshot: {
    id: "SNAP-DUMMY-001",
    goldPriceINRPerGram: 6250.00,
    fx: {
      INR: 83.25,
      AED: 3.67,
      RUB: 92.50,
      CNY: 7.25,
    },
    updatedAt: new Date().toISOString(),
  },
  grxBalance: "1250.5000",
  ethBalance: "2.5",
  usdtBalance: "5000.00",
  ethBalanceUSD: "6250.00",
  usdtBalanceUSD: "5000.00",
};

const DashboardScreen = ({ navigation }) => {
  const {
    walletAddress,
    grxBalance,
    loading,
    refreshBalances,
    custodialMode,
  } = useWallet();
  const {
    balance: grxBalanceFromHook,
    loading: grxBalanceLoading,
    error: grxBalanceError,
  } = useGRXBalance(walletAddress);
  // Use dummy data if balance is not available
  const displayGrxBalance = grxBalanceFromHook || grxBalance || DUMMY_DATA.grxBalance;
  const formattedGrxBalance = parseFloat(displayGrxBalance || "0").toFixed(4);
  const [metalTicker, setMetalTicker] = useState(null);
  const [metalError, setMetalError] = useState(null);
  const [oracleSnapshot, setOracleSnapshot] = useState(null);
  const [oracleError, setOracleError] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [transactionsLoading, setTransactionsLoading] = useState(false);
  const [walletCountry, setWalletCountry] = useState(null);
  const scrollX = useRef(new Animated.Value(0)).current;
  
  // Get screen width for responsive design
  const screenWidth = Dimensions.get("window").width;
  const isLargeScreen = screenWidth >= 768; // Tablet/Desktop breakpoint

  useEffect(() => {
    // Initial load with delay to avoid rate limiting
    // DISABLED: loadTransactionHistory() - causes too many API calls
    const initialLoad = setTimeout(() => {
      refreshBalances();
      loadMetalPrices();
      loadOracleSnapshot();
      // loadTransactionHistory(); // Disabled to prevent rate limiting
    }, 2000);
    
    return () => clearTimeout(initialLoad);
  }, []);

  useEffect(() => {
    if (walletAddress) {
      getWalletMappings().then(mappings => {
        if (mappings && mappings.length > 0) {
          const mapping = mappings.find(m => m.address === walletAddress);
          if (mapping) {
            setWalletCountry(mapping.country);
          } else {
            setWalletCountry(null);
          }
        }
      }).catch(err => console.log('Error fetching mappings', err));
    }
  }, [walletAddress]);

  // DISABLED: Automatic transaction history loading causes too many API calls
  // useEffect(() => {
  //   // Reload transactions when network or wallet changes (with debounce)
  //   if (walletAddress) {
  //     // Clear any pending load
  //     if (transactionHistoryTimeoutRef.current) {
  //       clearTimeout(transactionHistoryTimeoutRef.current);
  //     }
  //     // Debounce by 2 seconds to avoid rapid calls
  //     transactionHistoryTimeoutRef.current = setTimeout(() => {
  //       if (!isTransactionLoadingRef.current) {
  //         loadTransactionHistory();
  //       }
  //     }, 2000);
  //   }
  //   return () => {
  //     if (transactionHistoryTimeoutRef.current) {
  //       clearTimeout(transactionHistoryTimeoutRef.current);
  //     }
  //   };
  // }, [walletAddress, currentNetwork, isTestnet]);

  useEffect(() => {
    const currentTicker = metalTicker || DUMMY_DATA.metalTicker;
    if (currentTicker?.goldPerGramUSD) {
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
      if (data && data.goldPerGramUSD) {
        setMetalTicker(data);
        setMetalError(null);
      } else {
        // Use dummy data if API returns empty or invalid data
        console.log("Using dummy metal price data");
        setMetalTicker(DUMMY_DATA.metalTicker);
        setMetalError(null);
      }
    } catch (error) {
      console.warn("Metal price fetch failed, using dummy data:", error?.message);
      // Use dummy data on error
      setMetalTicker(DUMMY_DATA.metalTicker);
      setMetalError(null); // Don't show error, just use dummy data
    }
  };

  const loadOracleSnapshot = async () => {
    try {
      const snapshot = await fetchOracleSnapshot();
      if (snapshot && snapshot.goldPriceINRPerGram) {
        setOracleSnapshot(snapshot);
        setOracleError(null);
      } else {
        // Use dummy data if API returns empty or invalid data
        console.log("Using dummy oracle snapshot data");
        setOracleSnapshot(DUMMY_DATA.oracleSnapshot);
        setOracleError(null);
      }
    } catch (error) {
      console.warn("Oracle snapshot fetch failed, using dummy data:", error?.message);
      // Use dummy data on error
      setOracleSnapshot(DUMMY_DATA.oracleSnapshot);
      setOracleError(null); // Don't show error, just use dummy data
    }
  };

  const loadTransactionHistory = async () => {
    if (!walletAddress) {
      setTransactions([]);
      return;
    }

    // Prevent multiple simultaneous calls
    if (transactionsLoading) {
      console.log('Transaction history already loading, skipping...');
      return;
    }

    setTransactionsLoading(true);
    try {
      const txHistory = await fetchCombinedTransactionHistory(
        walletAddress,
        currentNetwork,
        isTestnet
      );
      setTransactions(txHistory);
    } catch (error) {
      console.warn("Failed to load transaction history:", error.message);
      setTransactions([]);
    } finally {
      setTransactionsLoading(false);
    }
  };

  const handleRefresh = async () => {
    // Add delays between calls to avoid rate limiting
    await refreshBalances();
    await new Promise(resolve => setTimeout(resolve, 500));
    await loadMetalPrices();
  };

  const handleCopyAddress = () => {
    Clipboard.setString(walletAddress);
    Alert.alert("Copied", "Wallet address copied to clipboard");
  };

  // Close dropdown when scrolling
  const handleScroll = () => {
    // No network dropdown anymore
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
        onScrollBeginDrag={handleScroll}
        scrollEventThrottle={16}
      >
        <View style={styles.content}>
        {/* Mobile Logo - Above Top Bar */}
        <View style={styles.mobileLogoContainer}>
          <Image
            source={require("./assets/mobile_logo.png")}
            style={styles.mobileLogo}
            resizeMode="cover"
          />
        </View>

        {/* Top Bar */}
        <View style={styles.topBar}>
          {isLargeScreen && (
            <View style={styles.logoContainer}>
              <Image
                source={require("./assets/logo.png")}
                style={styles.topBarLogo}
                resizeMode="cover"
              />
            </View>
          )}
          <View style={{ flex: 1 }} />
          <TouchableOpacity
            style={styles.profileButton}
            onPress={() => navigation.navigate("Settings")}
          >
            <Ionicons name="person-circle-outline" size={24} color={GOLD_COLORS.primary} />
          </TouchableOpacity>
        </View>

        {/* Wallet Address */}
        <View style={styles.addressContainer}>
          <Text style={styles.addressLabel}>Wallet Address</Text>
          <View style={styles.addressRow}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text style={styles.addressText}>
                {formatAddress(walletAddress)}
              </Text>
              {walletCountry && (
                <View style={{ flexDirection: 'row', alignItems: 'center', marginLeft: 8, backgroundColor: '#E8F5E9', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 12, borderWidth: 1, borderColor: '#4CAF50' }}>
                  <Ionicons name="checkmark-circle" size={14} color="#4CAF50" />
                  <Text style={{ fontSize: 12, fontWeight: 'bold', color: '#4CAF50', marginLeft: 4 }}>
                    {walletCountry}
                  </Text>
                </View>
              )}
            </View>
            <TouchableOpacity
              style={styles.copyButton}
              onPress={handleCopyAddress}
            >
              <Ionicons name="copy-outline" size={16} color={GOLD_COLORS.primary} style={{ marginRight: 4 }} />
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

        {((metalTicker || DUMMY_DATA.metalTicker)?.goldPerGramUSD) && (
          <View style={styles.tickerContainer}>
            <Animated.View
              style={[
                styles.tickerScrollContent,
                { transform: [{ translateX: scrollX }] },
              ]}
            >
              {[0, 1, 2].map((i) => {
                const currentTicker = metalTicker || DUMMY_DATA.metalTicker;
                return (
                  <View style={styles.tickerChip} key={`ticker-${i}`}>
                    <View style={styles.tickerLabelRow}>
                      <MaterialIcons name="monetization-on" size={18} color={GOLD_COLORS.primary} />
                      <Text style={styles.tickerLabel}> Gold (24K)</Text>
                    </View>
                    <Text style={styles.tickerValue}>
                      ${Number(currentTicker.goldPerGramUSD).toFixed(2)} / gram
                    </Text>
                  </View>
                );
              })}
            </Animated.View>
          </View>
        )}

        {(oracleSnapshot || DUMMY_DATA.oracleSnapshot) && (
          <View style={styles.oracleCard}>
            <View style={styles.sectionHeaderRow}>
              <MaterialIcons name="insights" size={20} color={GOLD_COLORS.primary} />
              <Text style={styles.sectionOverline}>Oracle Snapshot</Text>
            </View>
            <View style={styles.oracleRow}>
              <View style={styles.oracleLabelRow}>
                <MaterialIcons name="monetization-on" size={20} color={GOLD_COLORS.primary} />
                <Text style={styles.oracleLabel}>Gold</Text>
              </View>
              <Text style={styles.oracleValue}>
                ₹
                {Number((oracleSnapshot || DUMMY_DATA.oracleSnapshot).goldPriceINRPerGram ?? 0).toLocaleString(
                  "en-IN",
                  { maximumFractionDigits: 2 }
                )}{" "}
                / gram
              </Text>
            </View>
            <View style={styles.oracleDivider} />
            <View style={styles.oracleFxGrid}>
              {["INR", "AED", "RUB", "CNY"].map((currency) => {
                const snapshot = oracleSnapshot || DUMMY_DATA.oracleSnapshot;
                return (
                  <View key={currency} style={styles.oracleFxItem}>
                    <Text style={styles.fxLabel}>USD → {currency}</Text>
                    <Text style={styles.fxValue}>
                      {snapshot.fx?.[currency]?.toFixed(4) ?? "--"}
                    </Text>
                  </View>
                );
              })}
            </View>
            <Text style={styles.oracleTimestamp}>
              Last updated:{" "}
              {(oracleSnapshot || DUMMY_DATA.oracleSnapshot).updatedAt
                ? new Date((oracleSnapshot || DUMMY_DATA.oracleSnapshot).updatedAt).toLocaleString()
                : "—"}
            </Text>
          </View>
        )}

        {/* Coin Icon */}
        <View style={styles.coinContainer}>
          <View style={styles.badgeRow}>
            <Text style={styles.sectionOverline}>Portfolio Snapshot</Text>
            <View style={styles.networkPill}>
              <Text style={styles.networkPillText}>
                GRX Chain
              </Text>
            </View>
          </View>
          <Image
            source={require("./assets/grxcoin.png")}
            style={styles.coinImage}
            resizeMode="contain"
          />
        </View>

        <View style={styles.sectionHeaderRow}>
          <MaterialIcons name="token" size={20} color={GOLD_COLORS.primary} />
          <Text style={styles.sectionOverline}>GRX Tokens</Text>
        </View>
        <View style={styles.mintBalanceCard}>
          <View style={styles.mintHeader}>
            <Text style={styles.mintTitle}>YOUR GRX BALANCE</Text>
            <View style={styles.iconContainer}>
              <MaterialIcons name="monetization-on" size={28} color={GOLD_COLORS.primary} />
            </View>
          </View>
          <Text style={styles.mintAmount}>
            {grxBalanceLoading ? "…" : `${formattedGrxBalance} GRX`}
          </Text>
          <Text style={styles.mintSubText}>
            {grxBalanceError
              ? "Using demo data • " + grxBalanceError
              : "Auto-refreshes every 3s or when app resumes"}
          </Text>
          <View style={styles.cardActionRow}>
            <TouchableOpacity
              style={styles.cardActionButton}
              onPress={() => navigation.navigate("Send")}
            >
              <Ionicons name="arrow-up-outline" size={20} color="#FFFFFF" />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.cardActionButton}
              onPress={() => navigation.navigate("Receive")}
            >
              <Ionicons name="arrow-down-outline" size={20} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.ownershipBalanceCard}>
          <View style={styles.mintHeader}>
            <Text style={styles.ownershipTitle}>OWNERSHIP GRX BALANCE</Text>
            <View style={styles.iconContainer}>
              <MaterialIcons name="account-balance" size={28} color={GOLD_COLORS.primary} />
            </View>
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
              <Ionicons name="arrow-up-outline" size={20} color="#FFFFFF" />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.cardActionButton}
              onPress={() => navigation.navigate("Receive")}
            >
              <Ionicons name="arrow-down-outline" size={20} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.totalBalance}>
          <Text style={styles.totalLabel}>Total Balance</Text>
          <Text style={styles.totalAmount}>
            {formattedGrxBalance} GRX
          </Text>
        </View>

        {/* Action Cards */}
        <View style={styles.sectionHeaderRow}>
          <MaterialIcons name="flash-on" size={20} color={GOLD_COLORS.primary} />
          <Text style={styles.sectionOverline}>Quick Actions</Text>
        </View>
        <View style={styles.actionGrid}>
          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => navigation.navigate("Mint")}
          >
            <View style={styles.actionIconContainer}>
              <MaterialIcons name="monetization-on" size={32} color={GOLD_COLORS.primary} />
            </View>
            <Text style={styles.actionTitle}>Mint</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => navigation.navigate("Vault")}
          >
            <View style={styles.actionIconContainer}>
              <MaterialIcons name="account-balance" size={32} color={GOLD_COLORS.primary} />
            </View>
            <Text style={styles.actionTitle}>View Ownership</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => navigation.navigate("Send")}
          >
            <View style={styles.actionIconContainer}>
              <Ionicons name="swap-horizontal" size={32} color={GOLD_COLORS.primary} />
            </View>
            <Text style={styles.actionTitle}>Send / Receive</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => navigation.navigate("Redeem")}
          >
            <View style={styles.actionIconContainer}>
              <MaterialIcons name="receipt-long" size={32} color={GOLD_COLORS.primary} />
            </View>
            <Text style={styles.actionTitle}>Redeem</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => navigation.navigate("Invoices")}
          >
            <View style={styles.actionIconContainer}>
              <MaterialIcons name="description" size={32} color={GOLD_COLORS.primary} />
            </View>
            <Text style={styles.actionTitle}>Invoices</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => navigation.navigate("Vault")}
          >
            <View style={styles.actionIconContainer}>
              <Ionicons name="swap-vertical" size={32} color={GOLD_COLORS.primary} />
            </View>
            <Text style={styles.actionTitle}>Ownership Swapping</Text>
          </TouchableOpacity>
        </View>

        {/* Recent Transactions */}
        <View style={styles.transactionsContainer}>
          <View style={styles.sectionHeaderRow}>
            <MaterialIcons name="history" size={20} color={GOLD_COLORS.primary} />
            <Text style={styles.sectionTitle}>Recent Transactions</Text>
            <TouchableOpacity onPress={loadTransactionHistory} style={styles.refreshButton}>
              <Ionicons name="refresh" size={18} color={GOLD_COLORS.primary} />
            </TouchableOpacity>
          </View>
          {transactionsLoading ? (
            <View style={styles.emptyStateContainer}>
              <Text style={styles.emptyText}>Loading transactions...</Text>
            </View>
          ) : transactions.length > 0 ? (
            transactions.slice(0, 10).map((tx) => {
              const isSend = tx.type === "send";
              const isReceive = tx.type === "receive";
              const isBurn = tx.type === "burn";
              const isMint = tx.type === "mint";
              
              const getTransactionIcon = () => {
                if (isBurn) return "flame";
                if (isMint) return "add-circle";
                if (isSend) return "arrow-up";
                return "arrow-down";
              };

              const getTransactionColor = () => {
                if (isBurn) return theme.colors.error;
                if (isMint) return GOLD_COLORS.primary;
                if (isSend) return theme.colors.warning;
                return theme.colors.success;
              };

              // TODO: Add GRX chain explorer URL when available
              const explorerUrl = tx.txHash ? null : null;

              return (
                <TouchableOpacity
                  key={tx.id}
                  style={styles.transactionItem}
                  onPress={() => {
                    if (explorerUrl) {
                      Linking.openURL(explorerUrl);
                    } else if (tx.invoiceId) {
                      navigation.navigate("InvoiceDetail", {
                        invoiceId: tx.invoiceId,
                      });
                    }
                  }}
                >
                  <View style={[styles.transactionIcon, { backgroundColor: getTransactionColor() + "20" }]}>
                    <Ionicons
                      name={getTransactionIcon()}
                      size={20}
                      color={getTransactionColor()}
                    />
                  </View>
                  <View style={styles.transactionContent}>
                    <View style={styles.transactionRow}>
                      <Text style={styles.transactionType}>
                        {isBurn
                          ? "Burn"
                          : isMint
                          ? "Mint"
                          : isSend
                          ? "Send"
                          : "Receive"}
                      </Text>
                      <Text style={[styles.transactionAmount, { color: getTransactionColor() }]}>
                        {isSend ? "-" : "+"} {parseFloat(tx.amount || 0).toFixed(4)} {tx.token}
                      </Text>
                    </View>
                    <View style={styles.transactionRow}>
                      <Text style={styles.transactionMeta}>
                        {tx.source === "onchain"
                          ? "On-chain"
                          : tx.source === "custodial"
                          ? "Custodial"
                          : tx.source === "burn"
                          ? "Redeem"
                          : "Mint"}
                        {tx.to && isSend && ` • To: ${formatAddress(tx.to)}`}
                        {tx.from && isReceive && ` • From: ${formatAddress(tx.from)}`}
                      </Text>
                      <Text style={styles.transactionTime}>
                        {tx.timestamp
                          ? new Date(tx.timestamp).toLocaleDateString()
                          : "—"}
                      </Text>
                    </View>
                    {tx.status && (
                      <View style={styles.transactionStatusRow}>
                        <View
                          style={[
                            styles.statusDot,
                            {
                              backgroundColor:
                                tx.status === "confirmed"
                                  ? theme.colors.success
                                  : tx.status === "failed"
                                  ? theme.colors.error
                                  : theme.colors.warning,
                            },
                          ]}
                        />
                        <Text style={styles.transactionStatus}>
                          {tx.status.charAt(0).toUpperCase() + tx.status.slice(1)}
                        </Text>
                      </View>
                    )}
                  </View>
                  {explorerUrl && (
                    <Ionicons
                      name="open-outline"
                      size={18}
                      color={GOLD_COLORS.primary}
                      style={styles.transactionLinkIcon}
                    />
                  )}
                </TouchableOpacity>
              );
            })
          ) : (
            <View style={styles.emptyStateContainer}>
              <MaterialIcons name="inbox" size={48} color={theme.colors.textSecondary} />
              <Text style={styles.emptyText}>No transactions yet</Text>
            </View>
          )}
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
    overflow: "visible",
  },
  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: theme.spacing.md,
    zIndex: 1000,
    height: 80,
    elevation: 1000,
    position: "relative",
  },
  networkSelector: {
    position: "relative",
    zIndex: 1000,
    elevation: 1000,
  },
  networkButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: theme.colors.surface,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1.5,
    borderColor: GOLD_COLORS.light,
    ...theme.shadows.small,
  },
  networkLabel: {
    fontSize: 16,
    fontWeight: "600",
    marginRight: 8,
    color: theme.colors.text,
  },
  dropdownIcon: {
    fontSize: 12,
    color: theme.colors.text,
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
    zIndex: 1001,
    elevation: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    overflow: "visible",
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
    borderWidth: 1.5,
    borderColor: GOLD_COLORS.light,
    ...theme.shadows.small,
  },
  mobileLogoContainer: {
    alignItems: "center",
    justifyContent: "center",
    marginBottom: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
  },
  mobileLogo: {
    width: 200,
    height: 120,
    maxWidth: "80%",
  },
  logoContainer: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 999,
    pointerEvents: "none",
  },
  topBarLogo: {
    width: "30%",
    height: 100,
  },
  addressContainer: {
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing.md,
    borderWidth: 1,
    borderColor: GOLD_COLORS.light,
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
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    backgroundColor: GOLD_COLORS.light,
    borderRadius: theme.borderRadius.sm,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  copyButtonText: {
    color: GOLD_COLORS.dark,
    fontSize: 14,
    fontWeight: "600",
  },
  coinContainer: {
    alignItems: "center",
    marginBottom: theme.spacing.lg,
  },
  coinImage: {
    width: 200,
    height: 200,
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
    backgroundColor: GOLD_COLORS.light,
    padding: theme.spacing.lg,
    borderRadius: theme.borderRadius.lg,
    alignItems: "center",
    marginBottom: theme.spacing.lg,
    borderWidth: 2,
    borderColor: GOLD_COLORS.primary,
    ...theme.shadows.medium,
  },
  totalLabel: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  totalAmount: {
    fontSize: 36,
    fontWeight: "bold",
    color: GOLD_COLORS.primary,
    marginTop: theme.spacing.sm,
    marginBottom: theme.spacing.xs,
  },
  totalSubText: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.md,
  },
  totalBreakdown: {
    marginTop: theme.spacing.sm,
    paddingTop: theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: GOLD_COLORS.primary,
    width: "100%",
    alignItems: "center",
    gap: theme.spacing.xs,
  },
  totalBreakdownText: {
    fontSize: 13,
    color: theme.colors.textSecondary,
  },
  mintBalanceCard: {
    backgroundColor: theme.colors.surfaceAlt,
    padding: theme.spacing.lg,
    borderRadius: theme.borderRadius.lg,
    marginBottom: theme.spacing.md,
    borderWidth: 2,
    borderColor: GOLD_COLORS.light,
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
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: GOLD_COLORS.light,
    justifyContent: "center",
    alignItems: "center",
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
    borderWidth: 2,
    borderColor: GOLD_COLORS.light,
    ...theme.shadows.medium,
    position: "relative",
    minHeight: 140,
  },
  ownershipTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: theme.colors.text,
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
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: GOLD_COLORS.primary,
    justifyContent: "center",
    alignItems: "center",
    ...theme.shadows.small,
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
    borderWidth: 1.5,
    borderColor: GOLD_COLORS.light,
    ...theme.shadows.small,
  },
  actionIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: GOLD_COLORS.light,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: theme.spacing.sm,
  },
  actionTitle: {
    fontSize: 14,
    fontWeight: "600",
    textAlign: "center",
    color: theme.colors.text,
  },
  transactionsContainer: {
    backgroundColor: theme.colors.surfaceAlt,
    padding: theme.spacing.lg,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1.5,
    borderColor: GOLD_COLORS.light,
    ...theme.shadows.small,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: theme.colors.text,
    marginLeft: 8,
  },
  emptyStateContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: theme.spacing.xl,
  },
  emptyText: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    textAlign: "center",
    marginTop: theme.spacing.md,
  },
  sectionOverline: {
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 1,
    textTransform: "uppercase",
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.sm,
    marginLeft: 8,
  },
  sectionHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
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
    backgroundColor: GOLD_COLORS.light,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1.5,
    borderColor: GOLD_COLORS.primary,
  },
  tickerLabelRow: {
    flexDirection: "row",
    alignItems: "center",
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
    color: GOLD_COLORS.dark,
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
    borderWidth: 1.5,
    borderColor: GOLD_COLORS.light,
    marginBottom: theme.spacing.lg,
    ...theme.shadows.small,
  },
  oracleLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
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
    color: GOLD_COLORS.primary,
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
  refreshButton: {
    padding: theme.spacing.xs,
    marginLeft: "auto",
  },
  transactionItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: GOLD_COLORS.light,
  },
  transactionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginRight: theme.spacing.md,
  },
  transactionContent: {
    flex: 1,
  },
  transactionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: theme.spacing.xs,
  },
  transactionType: {
    fontSize: 14,
    fontWeight: "600",
    color: theme.colors.text,
  },
  transactionAmount: {
    fontSize: 14,
    fontWeight: "700",
  },
  transactionMeta: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    flex: 1,
  },
  transactionTime: {
    fontSize: 12,
    color: theme.colors.textSecondary,
  },
  transactionStatusRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: theme.spacing.xs,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: theme.spacing.xs,
  },
  transactionStatus: {
    fontSize: 11,
    color: theme.colors.textSecondary,
    textTransform: "capitalize",
  },
  transactionLinkIcon: {
    marginLeft: theme.spacing.sm,
  },
});

export default DashboardScreen;
