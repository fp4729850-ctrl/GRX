import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { ethers } from "ethers";
import { useWallet } from "../context/WalletContext";

// Gold color constants
const GOLD_COLORS = {
  primary: "#D4AF37",
  light: "#F4E4BC",
  dark: "#B8941F",
  accent: "#FFD700",
};
import { useGRXBalance } from "../hooks/useGRXBalance";
import { fetchGrxOracleQuote } from "../services/oracleService";
import { burnGrxWithInvoice } from "../services/grxService";
import { burnGRX } from "../services/grxChainService";
import { getMnemonic } from "../services/storageService";
import { saveInvoice, createBackendInvoice } from "../services/invoiceService";
import { redeemCustodialInvoice } from "../services/custodialService";
import { generateInvoiceId } from "../utils/generateInvoiceId";
import { verifyPIN, isPINSet } from "../services/pinService";
import ConfirmModal from "../components/ConfirmModal";
import { theme } from "../styles/theme";
import { GRX_TOKEN_METADATA } from "../utils/constants";

// Dummy data for testing when APIs fail
const DUMMY_QUOTE = {
  pricePerToken: 75.50,
  feeUSD: 1.13,
  totalUSD: 7548.87,
};

const RedeemScreen = ({ navigation }) => {
  const {
    walletAddress,
    privateKey,
    currentNetwork,
    isTestnet,
    custodialMode,
  } = useWallet();
  const {
    balance: grxBalance,
    loading: grxBalanceLoading,
    refresh: refreshGrxBalance,
  } = useGRXBalance(walletAddress, currentNetwork, isTestnet);

  const [amount, setAmount] = useState("");
  const [quote, setQuote] = useState(null);
  const [quoteLoading, setQuoteLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showPINPrompt, setShowPINPrompt] = useState(false);
  const [pinInput, setPinInput] = useState("");
  const [successData, setSuccessData] = useState(null);

  useEffect(() => {
    if (!amount) {
      setQuote(null);
      return;
    }

    setQuoteLoading(true);
    const timer = setTimeout(async () => {
      try {
        const data = await fetchGrxOracleQuote(amount);
        if (data && data.pricePerToken) {
          setQuote({
            pricePerToken: data.pricePerToken,
            feeUSD: data.feeUSD ?? 0,
            totalUSD: data.totalUSD ?? 0,
          });
        } else {
          // Use dummy quote data
          console.log("Using dummy quote data");
          const amountNum = parseFloat(amount) || 0;
          setQuote({
            pricePerToken: DUMMY_QUOTE.pricePerToken,
            feeUSD: (amountNum * DUMMY_QUOTE.pricePerToken * 0.015).toFixed(2),
            totalUSD: (amountNum * DUMMY_QUOTE.pricePerToken * 0.985).toFixed(2),
          });
        }
      } catch (error) {
        console.warn("Oracle quote failed, using dummy data:", error);
        // Use dummy quote data on error
        const amountNum = parseFloat(amount) || 0;
        setQuote({
          pricePerToken: DUMMY_QUOTE.pricePerToken,
          feeUSD: (amountNum * DUMMY_QUOTE.pricePerToken * 0.015).toFixed(2),
          totalUSD: (amountNum * DUMMY_QUOTE.pricePerToken * 0.985).toFixed(2),
        });
      } finally {
        setQuoteLoading(false);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [amount]);

  // Dummy balance for testing
  const DUMMY_BALANCE = "1250.5000";
  
  const formattedBalance = useMemo(() => {
    const balance = grxBalance || DUMMY_BALANCE;
    const parsed = parseFloat(balance || "0");
    return Number.isFinite(parsed) ? parsed : parseFloat(DUMMY_BALANCE);
  }, [grxBalance]);

  const handleReview = async () => {
    console.log("handleReview called, amount:", amount);
    
    if (!amount || Number(amount) <= 0) {
      Alert.alert("Invalid Amount", "Enter a burn amount greater than zero.");
      return;
    }

    if (Number(amount) > formattedBalance) {
      Alert.alert("Insufficient Balance", "You do not have enough GRX.");
      return;
    }

    // Show confirm modal directly without snapshot
    setShowConfirm(true);
  };

  const handleConfirmBurn = async () => {
    // Check if PIN is set and verify before proceeding
    const pinSet = await isPINSet();
    if (pinSet) {
      // Show PIN prompt
      setShowConfirm(false);
      setShowPINPrompt(true);
      setPinInput("");
    } else {
      // No PIN set, proceed directly
      executeBurn();
    }
  };

  const handlePINSubmit = async () => {
    if (!pinInput || pinInput.length < 4) {
      Alert.alert('Error', 'Please enter at least 4-digit PIN');
      return;
    }

    const result = await verifyPIN(pinInput);
    if (!result.success) {
      Alert.alert('Error', result.error || 'Invalid PIN');
      setPinInput("");
      return;
    }

    // PIN verified, proceed with burn
    setShowPINPrompt(false);
    setPinInput("");
    executeBurn();
  };

  const executeBurn = async () => {
    // Ensure modals are closed
    setShowConfirm(false);
    setShowPINPrompt(false);
    setLoading(true);
    try {
      if (custodialMode) {
        const response = await redeemCustodialInvoice({
          address: walletAddress,
          amount,
          network: currentNetwork,
          isTestnet,
        });

        const invoiceId =
          response?.invoiceId || response?.reference || Date.now().toString();
        const timestamp = response?.timestamp || new Date().toISOString();

        await saveInvoice({
          id: invoiceId,
          txHash: response?.txHash || response?.reference || "custodial",
          amount,
          timestamp,
          network: currentNetwork,
          isTestnet,
          totalUSD: quote?.totalUSD ?? null,
          feeUSD: quote?.feeUSD ?? null,
          pricePerToken: quote?.pricePerToken ?? null,
          status: response?.status || "queued",
        });

        setSuccessData({
          txHash: response?.txHash || "Backend managed",
          invoiceId,
          timestamp,
          burned: amount,
          custodial: true,
        });
        setAmount("");
        return;
      }

      // Check if using GRX Cosmos chain (address starts with "grx")
      const isGRXCosmosChain = walletAddress && walletAddress.toLowerCase().startsWith('grx');

      if (isGRXCosmosChain) {
        // GRX Cosmos chain burn (following guide pattern)
        const mnemonic = await getMnemonic();
        if (!mnemonic) {
          throw new Error('Wallet mnemonic not found. Please unlock your wallet.');
        }

        const timestamp = new Date().toISOString();
        
        // Convert GRX to base units (1 GRX = 1,000,000 base units for 6 decimals)
        // Following guide: Math.floor(parseFloat(amountToBurn) * 1000000)
        const amountInBaseUnits = Math.floor(parseFloat(amount) * 1000000);
        const amountWei = amountInBaseUnits.toString();

        // Generate invoice ID for Cosmos burn
        // For Cosmos burns, use empty string as recipient (not ethers.ZeroAddress)
        const invoiceId = generateInvoiceId(walletAddress, "", amountWei);

        console.log('Burning GRX:', amount, 'GRX =', amountInBaseUnits, 'base units');
        
        // Burn on GRX Cosmos chain
        // burnGRX will convert GRX to base units internally (1 GRX = 1,000,000 base units)
        const txHash = await burnGRX(mnemonic, amount);
        
        console.log('Burn transaction submitted, hash:', txHash);

        // POST to backend /api/invoice/create
        try {
          await createBackendInvoice({
            invoiceId,
            txHash,
            amountWei,
            timestamp,
            sender: walletAddress,
          });
        } catch (backendError) {
          console.error("Backend invoice creation failed:", backendError);
          // Continue even if backend fails - local save will still work
        }

        // Save invoice locally
        await saveInvoice({
          id: invoiceId,
          txHash,
          amount,
          timestamp,
          network: 'GRX',
          isTestnet: false,
          totalUSD: quote?.totalUSD ?? null,
          feeUSD: quote?.feeUSD ?? null,
          pricePerToken: quote?.pricePerToken ?? null,
          status: "confirmed",
        });

        refreshGrxBalance();
        setSuccessData({
          txHash,
          invoiceId,
          timestamp,
          burned: amount,
          custodial: false,
        });
        setAmount("");
      } else {
        // Ethereum/BSC chain burn with invoice
        const amountWei = ethers.parseUnits(
          amount,
          GRX_TOKEN_METADATA.decimals
        );
        const timestamp = new Date().toISOString();

        const { tx, invoiceId, receipt, amountWei: returnedAmountWei } =
          await burnGrxWithInvoice({
            privateKey,
            amount,
            networkKey: currentNetwork,
            isTestnet,
            senderAddress: walletAddress,
          });

        // POST to backend /api/invoice/create
        try {
          await createBackendInvoice({
            invoiceId,
            txHash: tx.hash,
            amountWei: returnedAmountWei || amountWei.toString(),
            timestamp,
            sender: walletAddress,
          });
        } catch (backendError) {
          console.error("Backend invoice creation failed:", backendError);
          // Continue even if backend fails - local save will still work
        }

        // Save invoice locally
        await saveInvoice({
          id: invoiceId,
          txHash: tx.hash,
          amount,
          timestamp,
          network: currentNetwork,
          isTestnet,
          totalUSD: quote?.totalUSD ?? null,
          feeUSD: quote?.feeUSD ?? null,
          pricePerToken: quote?.pricePerToken ?? null,
          status: "confirmed",
        });

        refreshGrxBalance();
        setSuccessData({
          txHash: tx.hash,
          invoiceId,
          timestamp,
          burned: amount,
          custodial: false,
        });
        setAmount("");
      }
    } catch (error) {
      console.error("Redeem error:", error);
      Alert.alert(
        "Burn Failed",
        error?.message || "Unable to submit burn transaction.",
        [
          {
            text: "Retry",
            onPress: () => {
              handleReview();
            },
          },
          { text: "Cancel", style: "cancel" },
        ]
      );
    } finally {
      setLoading(false);
    }
  };

  const handleResetFlow = () => {
    setSuccessData(null);
  };

  const transactionDetails = {
    to: custodialMode ? "Custodial Redeem Request" : "GRX burnWithInvoice",
    amount,
    symbol: "GRX",
    gasLimit: custodialMode ? "Backend managed" : "Auto",
    fee: quote
      ? `$${Number(quote.totalUSD).toFixed(2)} (incl. $${Number(
          quote.feeUSD
        ).toFixed(2)} fee)`
      : "Fetching…",
    mode: custodialMode ? "Custodial (admin burn)" : "On-chain burn",
  };

  if (successData) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <ScrollView
          style={styles.container}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator
          keyboardShouldPersistTaps="handled"
        >
        <View style={styles.successCard}>
          <View style={styles.successIconContainer}>
            <MaterialIcons name="check-circle" size={64} color={GOLD_COLORS.primary} />
          </View>
          <Text style={styles.successTitle}>
            {successData.custodial ? "Custodial Request Submitted" : "Burn Complete"}
          </Text>
          <Text style={styles.successSubtitle}>
            {successData.custodial
              ? `${successData.burned} GRX queued for custodial redemption.`
              : `${successData.burned} GRX burned successfully.`}
          </Text>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Invoice ID</Text>
            <Text style={styles.detailValue} numberOfLines={1}>
              {successData.invoiceId}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Tx Hash</Text>
            <Text style={styles.detailValue} numberOfLines={1}>
              {successData.txHash}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Timestamp</Text>
            <Text style={styles.detailValue}>{successData.timestamp}</Text>
          </View>

          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => navigation.navigate("Invoices")}
          >
            <Text style={styles.primaryButtonText}>View Invoices</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.secondaryButton} onPress={handleResetFlow}>
            <Text style={styles.secondaryButtonText}>New Redeem</Text>
          </TouchableOpacity>
        </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator
        keyboardShouldPersistTaps="handled"
      >
      <View
        style={[
          styles.modeBanner,
          custodialMode ? styles.custodialBanner : styles.onchainBanner,
        ]}
      >
        <Text style={styles.modeBannerText}>
          {custodialMode
            ? "Custodial wallet enabled · GRX operators will execute admin burnWithInvoice."
            : "You will submit an on-chain burnWithInvoice transaction from this device."}
        </Text>
      </View>

      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <MaterialIcons name="monetization-on" size={24} color={GOLD_COLORS.primary} />
          <Text style={styles.cardLabel}>Available GRX</Text>
        </View>
        <Text style={styles.cardValue}>
          {grxBalanceLoading ? "…" : `${formattedBalance.toFixed(4)} GRX`}
        </Text>
        <Text style={styles.cardHint}>
          {grxBalance ? "Balance refreshes automatically every three seconds." : "Using demo data for testing."}
        </Text>
      </View>

      <View style={styles.form}>
        <Text style={styles.label}>Amount to Redeem</Text>
        <TextInput
          style={styles.input}
          value={amount}
          onChangeText={setAmount}
          placeholder="0.0"
          keyboardType="decimal-pad"
        />
      </View>

      <TouchableOpacity
        style={[
          styles.primaryButton,
          loading && styles.buttonDisabled,
        ]}
        onPress={() => {
          console.log("Review Burn button pressed");
          handleReview();
        }}
        disabled={loading}
        activeOpacity={0.7}
      >
        {loading ? (
          <ActivityIndicator color={theme.colors.secondary} />
        ) : (
          <Text style={styles.primaryButtonText}>Review Burn</Text>
        )}
      </TouchableOpacity>

      <ConfirmModal
        visible={showConfirm}
        onClose={() => {
          setShowConfirm(false);
        }}
        onConfirm={handleConfirmBurn}
        transactionDetails={transactionDetails}
        loading={loading}
      />

      {/* PIN Verification Modal */}
      {showPINPrompt && (
        <View style={styles.pinModalOverlay}>
          <View style={styles.pinModal}>
            <Text style={styles.pinModalTitle}>Enter PIN</Text>
            <Text style={styles.pinModalSubtitle}>Enter your PIN to confirm this transaction</Text>
            <TextInput
              style={styles.pinModalInput}
              value={pinInput}
              onChangeText={setPinInput}
              placeholder="Enter PIN"
              keyboardType="numeric"
              secureTextEntry
              autoFocus
              maxLength={10}
            />
            <View style={styles.pinModalButtons}>
              <TouchableOpacity
                style={[styles.pinModalButton, styles.pinModalButtonCancel]}
                onPress={() => {
                  setShowPINPrompt(false);
                  setPinInput("");
                  setShowConfirm(true);
                }}
              >
                <Text style={styles.pinModalButtonCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.pinModalButton,
                  styles.pinModalButtonConfirm,
                  (!pinInput || pinInput.length < 4) && styles.buttonDisabled,
                ]}
                onPress={handlePINSubmit}
                disabled={!pinInput || pinInput.length < 4}
              >
                <Text style={styles.pinModalButtonConfirmText}>Confirm</Text>
              </TouchableOpacity>
            </View>
          </View>
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
  },
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  content: {
    height:"100vh",
    overflow:"auto",
    padding: theme.spacing.lg,
    paddingBottom: theme.spacing.xl * 2,
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
    fontSize: 14,
    fontWeight: "600",
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.xs,
  },
  cardValue: {
    fontSize: 32,
    fontWeight: "bold",
    color: theme.colors.text,
  },
  cardHint: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.xs,
  },
  modeBanner: {
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
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
    color: theme.colors.textSecondary,
  },
  form: {
    gap: theme.spacing.sm,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    color: theme.colors.text,
  },
  input: {
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    fontSize: 16,
    borderWidth: 1.5,
    borderColor: GOLD_COLORS.light,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: theme.spacing.sm,
  },
  detailLabel: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    fontWeight: "600",
  },
  detailValue: {
    fontSize: 14,
    color: theme.colors.text,
    fontWeight: "500",
    flex: 1,
    textAlign: "right",
  },
  primaryButton: {
    backgroundColor: GOLD_COLORS.primary,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    alignItems: "center",
    ...theme.shadows.medium,
  },
  primaryButtonText: {
    color: theme.colors.secondary,
    fontSize: 18,
    fontWeight: "600",
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  successCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    alignItems: "center",
    borderWidth: 2,
    borderColor: GOLD_COLORS.primary,
    ...theme.shadows.medium,
  },
  successIconContainer: {
    marginBottom: theme.spacing.md,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: theme.colors.text,
  },
  successSubtitle: {
    fontSize: 16,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.lg,
  },
  secondaryButton: {
    paddingVertical: theme.spacing.sm,
    alignItems: "center",
    marginTop: theme.spacing.md,
  },
  secondaryButtonText: {
    color: GOLD_COLORS.primary,
    fontSize: 16,
    fontWeight: "600",
  },
  pinModalOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10000,
  },
  pinModal: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.xl,
    width: "85%",
    maxWidth: 400,
    borderWidth: 2,
    borderColor: GOLD_COLORS.primary,
    ...theme.shadows.large,
  },
  pinModalTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
    textAlign: "center",
  },
  pinModalSubtitle: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.lg,
    textAlign: "center",
  },
  pinModalInput: {
    backgroundColor: theme.colors.background,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    fontSize: 18,
    fontWeight: "600",
    color: theme.colors.text,
    borderWidth: 2,
    borderColor: GOLD_COLORS.light,
    marginBottom: theme.spacing.lg,
    textAlign: "center",
  },
  pinModalButtons: {
    flexDirection: "row",
    gap: theme.spacing.md,
  },
  pinModalButton: {
    flex: 1,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    alignItems: "center",
  },
  pinModalButtonCancel: {
    backgroundColor: theme.colors.surfaceAlt,
    borderWidth: 1.5,
    borderColor: theme.colors.border,
  },
  pinModalButtonCancelText: {
    color: theme.colors.text,
    fontSize: 16,
    fontWeight: "600",
  },
  pinModalButtonConfirm: {
    backgroundColor: GOLD_COLORS.primary,
  },
  pinModalButtonConfirmText: {
    color: theme.colors.secondary,
    fontSize: 16,
    fontWeight: "600",
  },
});

export default RedeemScreen;


