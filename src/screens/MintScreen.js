import React, { useState, useEffect, useRef } from "react";
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert, ActivityIndicator, AppState } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons, Ionicons } from "@expo/vector-icons";
import { theme } from "../styles/theme";
import { useWallet } from "../context/WalletContext";
import { useGRXBalance } from "../hooks/useGRXBalance";
import { createMintTransaction } from "../services/grxChainService";
import { getMnemonic } from "../services/storageService";
import { getMintTransactions, saveMintTransaction } from "../services/mintTransactionService";
import { Linking } from "react-native";

// Gold color constants
const GOLD_COLORS = {
  primary: "#D4AF37",
  light: "#F4E4BC",
  dark: "#B8941F",
  accent: "#FFD700",
};

// Dummy data for minting
const DUMMY_MINT_DATA = {
  goldPricePerGram: 75.50,
  currentRate: "1 GRX = $75.50 USD",
  minMintAmount: "0.1",
  maxMintAmount: "10000",
  estimatedFee: "1.5%",
};

const MintScreen = () => {
  const { walletAddress, refreshBalances } = useWallet();
  const {
    balance: grxBalance,
    loading: balanceLoading,
    refresh: refreshBalance,
  } = useGRXBalance(walletAddress);
  const [amount, setAmount] = useState("");
  const [index, setIndex] = useState("");
  const [country, setCountry] = useState("");
  const [vaultId, setVaultId] = useState("");
  const [estimatedGRX, setEstimatedGRX] = useState("0");
  const [isMinting, setIsMinting] = useState(false);
  const [mintError, setMintError] = useState(null);
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(true);
  const [mintTransactions, setMintTransactions] = useState([]);
  const refreshIntervalRef = useRef(null);
  const appState = useRef(AppState.currentState);

  // Load mint transactions on mount
  useEffect(() => {
    loadMintTransactions();
  }, []);

  const loadMintTransactions = async () => {
    try {
      const transactions = await getMintTransactions();
      setMintTransactions(transactions);
    } catch (error) {
      console.error('Failed to load mint transactions:', error);
    }
  };

  // Auto-refresh balance every 5 seconds when screen is active
  useEffect(() => {
    if (!walletAddress || !autoRefreshEnabled) {
      return;
    }

    // Initial refresh
    refreshBalance();

    // Set up interval for auto-refresh
    refreshIntervalRef.current = setInterval(() => {
      refreshBalance();
      refreshBalances(); // Also refresh wallet context balance
    }, 5000); // Refresh every 5 seconds

    // Handle app state changes (pause when app goes to background)
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (
        appState.current.match(/inactive|background/) &&
        nextAppState === 'active'
      ) {
        // App came to foreground, refresh immediately
        refreshBalance();
        refreshBalances();
      }
      appState.current = nextAppState;
    });

    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
      subscription?.remove();
    };
  }, [walletAddress, autoRefreshEnabled, refreshBalance, refreshBalances]);

  const [estimatedGold, setEstimatedGold] = useState({ grams: "0.0000", kg: "0.0000", oz: "0.00" });

  const calculateGold = (grxAmount) => {
    if (!grxAmount || parseFloat(grxAmount) <= 0) {
      setEstimatedGold({ grams: "0.0000", kg: "0.0000", oz: "0.00" });
      return;
    }
    const grams = parseFloat(grxAmount);
    const kg = grams / 1000;
    const oz = grams / 31.1034768;

    setEstimatedGold({
      grams: grams.toFixed(4),
      kg: kg.toFixed(4),
      oz: oz.toFixed(2)
    });
  };

  const handleMint = async () => {
    if (!walletAddress) {
      Alert.alert("Error", "Wallet not initialized");
      return;
    }

    if (!amount || parseFloat(amount) <= 0) {
      Alert.alert("Error", "Please enter a valid amount");
      return;
    }

    if (!index || !country || !vaultId) {
      Alert.alert("Error", "Please fill in all required fields (Index, Country, Vault ID)");
      return;
    }

    setIsMinting(true);
    setMintError(null);

    try {
      // Get mnemonic from storage
      const mnemonic = await getMnemonic();
      if (!mnemonic) {
        throw new Error("Mnemonic not found. Please import or create a wallet.");
      }

      // Convert GRX amount to base units (multiply by 1,000,000 for 6 decimals)
      // User enters 1 GRX = 1,000,000 base units
      const amountInBaseUnits = Math.floor(
        parseFloat(amount) * Math.pow(10, 6) // 6 decimals = 1,000,000
      );

      // Create mint transaction
      const txHash = await createMintTransaction(mnemonic, {
        index,
        country,
        vaultId,
        amount: amountInBaseUnits, // Pass base units, not GRX
      });

      const mintTransaction = {
        id: `MINT-${Date.now()}`,
        txHash,
        amount,
        index,
        country,
        vaultId,
        goldGrams: estimatedGold.grams,
        goldKg: estimatedGold.kg,
        goldOz: estimatedGold.oz,
        timestamp: new Date().toISOString(),
        network: "GRX",
        isTestnet: false,
      };

      await saveMintTransaction(mintTransaction);
      await loadMintTransactions(); // Reload transactions list

      Alert.alert(
        "Success",
        `Mint transaction submitted!\nTransaction Hash: ${txHash}`,
        [
          {
            text: "OK",
            onPress: async () => {
              // Wait 4 seconds then refresh balance
              setTimeout(async () => {
                await refreshBalances();
                await refreshBalance();
              }, 4000);
              // Reset form
              setAmount("");
              setIndex("");
              setCountry("");
              setVaultId("");
              setEstimatedGold({ grams: "0.0000", kg: "0.0000", oz: "0.00" });
            },
          },
        ]
      );
    } catch (error) {
      console.error("Minting error:", error);
      setMintError(error.message || "Failed to mint GRX");
      Alert.alert("Minting Failed", error.message || "Failed to mint GRX. Please try again.");
    } finally {
      setIsMinting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator
        keyboardShouldPersistTaps="handled"
        nestedScrollEnabled={true}
      >
        <View style={styles.iconContainer}>
          <MaterialIcons name="monetization-on" size={80} color={GOLD_COLORS.primary} />
        </View>
        <Text style={styles.title}>Mint GRX</Text>
        <Text style={styles.subtitle}>
          Convert USD to GRX tokens backed by physical gold
        </Text>

        {/* Wallet Balance Card */}
        <View style={styles.balanceCard}>
          <View style={styles.balanceHeader}>
            <MaterialIcons name="account-balance-wallet" size={24} color={GOLD_COLORS.primary} />
            <Text style={styles.balanceLabel}>Your GRX Balance</Text>
          </View>
          <Text style={styles.balanceAmount}>
            {balanceLoading ? "..." : `${parseFloat(grxBalance || "0").toFixed(6)} GRX`}
          </Text>
          <View style={styles.balanceActions}>
            <TouchableOpacity
              style={styles.refreshBalanceButton}
              onPress={refreshBalance}
              disabled={balanceLoading}
            >
              <Ionicons 
                name="refresh" 
                size={16} 
                color={GOLD_COLORS.primary} 
                style={balanceLoading && { opacity: 0.5 }}
              />
              <Text style={styles.refreshBalanceText}>Refresh</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.autoRefreshButton,
                autoRefreshEnabled && styles.autoRefreshButtonActive
              ]}
              onPress={() => setAutoRefreshEnabled(!autoRefreshEnabled)}
            >
              <Ionicons 
                name={autoRefreshEnabled ? "sync" : "sync-outline"} 
                size={16} 
                color={autoRefreshEnabled ? "#FFFFFF" : GOLD_COLORS.primary}
              />
              <Text style={[
                styles.autoRefreshText,
                autoRefreshEnabled && styles.autoRefreshTextActive
              ]}>
                {autoRefreshEnabled ? "Auto" : "Off"}
              </Text>
            </TouchableOpacity>
          </View>
          {autoRefreshEnabled && (
            <Text style={styles.autoRefreshHint}>
              Auto-refreshing every 5 seconds
            </Text>
          )}
        </View>

        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <MaterialIcons name="info-outline" size={20} color={GOLD_COLORS.primary} />
            <Text style={styles.infoText}>Current Rate: {DUMMY_MINT_DATA.currentRate}</Text>
          </View>
          <View style={styles.infoRow}>
            <MaterialIcons name="trending-up" size={20} color={GOLD_COLORS.primary} />
            <Text style={styles.infoText}>Minting Fee: {DUMMY_MINT_DATA.estimatedFee}</Text>
          </View>
        </View>

        <View style={styles.inputCard}>
          <Text style={styles.label}>Vault Index *</Text>
          <TextInput
            style={styles.input}
            value={index}
            onChangeText={setIndex}
            placeholder="Enter vault index"
            autoCapitalize="none"
          />
        </View>

        <View style={styles.inputCard}>
          <Text style={styles.label}>Country *</Text>
          <TextInput
            style={styles.input}
            value={country}
            onChangeText={setCountry}
            placeholder="Enter country code (e.g., US, IN)"
            autoCapitalize="characters"
            maxLength={3}
          />
        </View>

        <View style={styles.inputCard}>
          <Text style={styles.label}>Vault ID *</Text>
          <TextInput
            style={styles.input}
            value={vaultId}
            onChangeText={setVaultId}
            placeholder="Enter vault ID"
            autoCapitalize="none"
          />
        </View>

        <View style={styles.inputCard}>
          <Text style={styles.label}>Amount (GRX) *</Text>
          <TextInput
            style={styles.input}
            value={amount}
            onChangeText={(text) => {
              setAmount(text);
              calculateGold(text);
            }}
            placeholder="0.00"
            keyboardType="decimal-pad"
          />
        </View>

        {amount && parseFloat(amount) > 0 && (
          <View style={styles.resultCard}>
            <View style={styles.resultRow}>
              <Text style={styles.resultLabel}>Gold (grams):</Text>
              <Text style={styles.resultValue}>{estimatedGold.grams} g</Text>
            </View>
            <View style={styles.resultRow}>
              <Text style={styles.resultLabel}>Gold (kg):</Text>
              <Text style={styles.resultValue}>{estimatedGold.kg} kg</Text>
            </View>
            <View style={styles.resultRow}>
              <Text style={styles.resultLabel}>Gold (troy oz):</Text>
              <Text style={styles.resultValue}>{estimatedGold.oz} oz</Text>
            </View>
          </View>
        )}

        {mintError && (
          <View style={styles.errorCard}>
            <Ionicons name="alert-circle" size={20} color={theme.colors.error} />
            <Text style={styles.errorText}>{mintError}</Text>
          </View>
        )}

        <TouchableOpacity
          style={[
            styles.mintButton,
            ((!amount || parseFloat(amount) <= 0) || !index || !country || !vaultId || isMinting) && styles.buttonDisabled
          ]}
          disabled={(!amount || parseFloat(amount) <= 0) || !index || !country || !vaultId || isMinting}
          onPress={handleMint}
        >
          {isMinting ? (
            <>
              <ActivityIndicator size="small" color="#FFFFFF" style={{ marginRight: 8 }} />
              <Text style={styles.mintButtonText}>Minting...</Text>
            </>
          ) : (
            <>
              <MaterialIcons name="add-circle-outline" size={24} color="#FFFFFF" />
              <Text style={styles.mintButtonText}> Mint GRX</Text>
            </>
          )}
        </TouchableOpacity>

        <View style={styles.noteCard}>
          <Ionicons name="information-circle-outline" size={20} color={theme.colors.textSecondary} />
          <Text style={styles.noteText}>
            Minting creates a sovereign vault on the GRX chain. Ensure all fields are correct before submitting.
          </Text>
        </View>

        {/* Mint Transactions History */}
        {mintTransactions.length > 0 && (
          <View style={styles.transactionsSection}>
            <View style={styles.sectionHeader}>
              <MaterialIcons name="history" size={24} color={GOLD_COLORS.primary} />
              <Text style={styles.sectionTitle}>Mint History</Text>
            </View>
            {mintTransactions.map((transaction, index) => (
              <View key={transaction.id || index} style={styles.transactionCard}>
                <View style={styles.transactionHeader}>
                  <View style={styles.transactionInfo}>
                    <Text style={styles.transactionId}>{transaction.id}</Text>
                    <Text style={styles.transactionDate}>
                      {new Date(transaction.timestamp).toLocaleString()}
                    </Text>
                  </View>
                  <View style={styles.transactionAmount}>
                    <Text style={styles.transactionAmountText}>
                      {transaction.amount} GRX
                    </Text>
                  </View>
                </View>
                <View style={styles.transactionDetails}>
                  <View style={styles.transactionRow}>
                    <Text style={styles.transactionLabel}>Vault Index:</Text>
                    <Text style={styles.transactionValue}>{transaction.index}</Text>
                  </View>
                  <View style={styles.transactionRow}>
                    <Text style={styles.transactionLabel}>Country:</Text>
                    <Text style={styles.transactionValue}>{transaction.country}</Text>
                  </View>
                  <View style={styles.transactionRow}>
                    <Text style={styles.transactionLabel}>Vault ID:</Text>
                    <Text style={styles.transactionValue}>{transaction.vaultId}</Text>
                  </View>
                  <View style={styles.transactionRow}>
                    <Text style={styles.transactionLabel}>Gold Weight:</Text>
                    <Text style={styles.transactionValue}>{transaction.goldGrams} g ({transaction.goldOz} oz)</Text>
                  </View>
                </View>
                {transaction.txHash && (
                  <TouchableOpacity
                    style={styles.explorerButton}
                    onPress={() => {
                      const explorerUrl = `http://127.0.0.1:5500/frontend/explorer.html?tx=${transaction.txHash}`;
                      Linking.openURL(explorerUrl);
                    }}
                  >
                    <Ionicons name="open-outline" size={16} color={GOLD_COLORS.primary} />
                    <Text style={styles.explorerText}>View on Explorer</Text>
                  </TouchableOpacity>
                )}
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.background,
    height: '100%',
  },
  scrollView: {
    flex: 1,
    height: '100%',
  },
  content: {
    height: '100vh',
    overflowY: 'auto',
    padding: theme.spacing.lg,
    paddingBottom: theme.spacing.xl * 2,
    flexGrow: 1,
  },
  balanceCard: {
    backgroundColor: GOLD_COLORS.light,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
    borderWidth: 2,
    borderColor: GOLD_COLORS.primary,
    alignItems: "center",
  },
  balanceHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: theme.spacing.sm,
    gap: theme.spacing.xs,
  },
  balanceLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: theme.colors.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  balanceAmount: {
    fontSize: 32,
    fontWeight: "700",
    color: GOLD_COLORS.dark,
    marginBottom: theme.spacing.sm,
  },
  balanceActions: {
    flexDirection: "row",
    gap: theme.spacing.sm,
    alignItems: "center",
  },
  refreshBalanceButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.xs,
    paddingVertical: theme.spacing.xs,
    paddingHorizontal: theme.spacing.sm,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.sm,
    borderWidth: 1,
    borderColor: GOLD_COLORS.primary,
  },
  refreshBalanceText: {
    fontSize: 12,
    fontWeight: "600",
    color: GOLD_COLORS.primary,
  },
  autoRefreshButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.xs,
    paddingVertical: theme.spacing.xs,
    paddingHorizontal: theme.spacing.sm,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.sm,
    borderWidth: 1,
    borderColor: GOLD_COLORS.primary,
  },
  autoRefreshButtonActive: {
    backgroundColor: GOLD_COLORS.primary,
    borderColor: GOLD_COLORS.dark,
  },
  autoRefreshText: {
    fontSize: 12,
    fontWeight: "600",
    color: GOLD_COLORS.primary,
  },
  autoRefreshTextActive: {
    color: "#FFFFFF",
  },
  autoRefreshHint: {
    fontSize: 10,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.xs,
    fontStyle: "italic",
  },
  iconContainer: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: GOLD_COLORS.light,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: theme.spacing.lg,
    alignSelf: "center",
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: GOLD_COLORS.primary,
    marginBottom: theme.spacing.sm,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    color: theme.colors.textSecondary,
    textAlign: "center",
    marginBottom: theme.spacing.lg,
  },
  infoCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.lg,
    borderWidth: 1.5,
    borderColor: GOLD_COLORS.light,
    gap: theme.spacing.sm,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.sm,
  },
  infoText: {
    fontSize: 14,
    color: theme.colors.text,
    fontWeight: "500",
  },
  inputCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.md,
    borderWidth: 1.5,
    borderColor: GOLD_COLORS.light,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  input: {
    backgroundColor: theme.colors.background,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    fontSize: 18,
    fontWeight: "600",
    color: theme.colors.text,
    borderWidth: 1.5,
    borderColor: GOLD_COLORS.light,
    marginBottom: theme.spacing.xs,
  },
  hint: {
    fontSize: 12,
    color: theme.colors.textSecondary,
  },
  resultCard: {
    backgroundColor: GOLD_COLORS.light,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.md,
    borderWidth: 2,
    borderColor: GOLD_COLORS.primary,
  },
  resultRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: theme.spacing.sm,
  },
  resultLabel: {
    fontSize: 16,
    color: theme.colors.text,
    fontWeight: "500",
  },
  resultValue: {
    fontSize: 18,
    color: GOLD_COLORS.dark,
    fontWeight: "700",
  },
  mintButton: {
    backgroundColor: GOLD_COLORS.primary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    marginBottom: theme.spacing.md,
    ...theme.shadows.medium,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  mintButtonText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "600",
  },
  noteCard: {
    flexDirection: "row",
    backgroundColor: theme.colors.surfaceAlt,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: GOLD_COLORS.light,
    gap: theme.spacing.sm,
  },
  noteText: {
    flex: 1,
    fontSize: 12,
    color: theme.colors.textSecondary,
    lineHeight: 18,
  },
  errorCard: {
    flexDirection: "row",
    backgroundColor: theme.colors.surfaceAlt,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.error,
    gap: theme.spacing.sm,
    alignItems: "center",
  },
  errorText: {
    flex: 1,
    fontSize: 14,
    color: theme.colors.error,
    fontWeight: "500",
  },
  transactionsSection: {
    marginTop: theme.spacing.xl,
    paddingTop: theme.spacing.lg,
    borderTopWidth: 2,
    borderTopColor: GOLD_COLORS.light,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: GOLD_COLORS.primary,
  },
  transactionCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    borderWidth: 1.5,
    borderColor: GOLD_COLORS.light,
    ...theme.shadows.small,
  },
  transactionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: theme.spacing.sm,
    paddingBottom: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: GOLD_COLORS.light,
  },
  transactionInfo: {
    flex: 1,
  },
  transactionId: {
    fontSize: 14,
    fontWeight: "600",
    color: theme.colors.text,
    marginBottom: theme.spacing.xs / 2,
  },
  transactionDate: {
    fontSize: 12,
    color: theme.colors.textSecondary,
  },
  transactionAmount: {
    alignItems: "flex-end",
  },
  transactionAmountText: {
    fontSize: 18,
    fontWeight: "700",
    color: GOLD_COLORS.primary,
  },
  transactionDetails: {
    marginTop: theme.spacing.sm,
    gap: theme.spacing.xs,
  },
  transactionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: theme.spacing.xs / 2,
  },
  transactionLabel: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    fontWeight: "600",
  },
  transactionValue: {
    fontSize: 12,
    color: theme.colors.text,
    fontWeight: "500",
  },
  explorerButton: {
    marginTop: theme.spacing.sm,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    backgroundColor: GOLD_COLORS.light,
    paddingVertical: theme.spacing.xs,
    paddingHorizontal: theme.spacing.sm,
    borderRadius: theme.borderRadius.sm,
    alignSelf: "flex-end",
  },
  explorerText: {
    color: GOLD_COLORS.dark,
    fontWeight: "600",
    fontSize: 12,
    marginLeft: theme.spacing.xs / 2,
  },
});

export default MintScreen;

