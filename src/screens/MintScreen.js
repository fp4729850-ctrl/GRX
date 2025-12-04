import React, { useState } from "react";
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons, Ionicons } from "@expo/vector-icons";
import { theme } from "../styles/theme";
import { useWallet } from "../context/WalletContext";
import { useGRXBalance } from "../hooks/useGRXBalance";
import { createMintTransaction } from "../services/grxChainService";
import { getMnemonic } from "../services/storageService";

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

  const calculateGRX = (usdAmount) => {
    if (!usdAmount || parseFloat(usdAmount) <= 0) {
      setEstimatedGRX("0");
      return;
    }
    const grx = (parseFloat(usdAmount) / DUMMY_MINT_DATA.goldPricePerGram).toFixed(4);
    setEstimatedGRX(grx);
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

      // Create mint transaction
      const txHash = await createMintTransaction(mnemonic, {
        index,
        country,
        vaultId,
        amount: parseFloat(amount),
      });

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
              setEstimatedGRX("0");
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
              calculateGRX(text);
            }}
            placeholder="0.00"
            keyboardType="decimal-pad"
          />
          <Text style={styles.hint}>
            Min: ${DUMMY_MINT_DATA.minMintAmount} • Max: ${DUMMY_MINT_DATA.maxMintAmount}
          </Text>
        </View>

        {estimatedGRX !== "0" && (
          <View style={styles.resultCard}>
            <View style={styles.resultRow}>
              <Text style={styles.resultLabel}>You will receive:</Text>
              <Text style={styles.resultValue}>{estimatedGRX} GRX</Text>
            </View>
            <View style={styles.resultRow}>
              <Text style={styles.resultLabel}>Fee:</Text>
              <Text style={styles.resultValue}>
                ${(parseFloat(amount) * 0.015).toFixed(2)}
              </Text>
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
});

export default MintScreen;

