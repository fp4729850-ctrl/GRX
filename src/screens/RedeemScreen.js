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
import { ethers } from "ethers";
import { useWallet } from "../context/WalletContext";
import { useGRXBalance } from "../hooks/useGRXBalance";
import { useOracleSnapshot } from "../hooks/useOracleSnapshot";
import { fetchGrxOracleQuote } from "../services/oracleService";
import { fetchOracleSnapshot } from "../services/oracleSnapshotService";
import { burnGrxWithInvoice } from "../services/grxService";
import { saveInvoice, createBackendInvoice } from "../services/invoiceService";
import { redeemCustodialInvoice } from "../services/custodialService";
import ConfirmModal from "../components/ConfirmModal";
import OracleSnapshotCard from "../components/OracleSnapshotCard";
import { theme } from "../styles/theme";
import { ORACLE_SNAPSHOT_CONFIG, GRX_TOKEN_METADATA } from "../utils/constants";

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
  const [successData, setSuccessData] = useState(null);
  const [snapshotForConfirm, setSnapshotForConfirm] = useState(null);
  const [snapshotLoading, setSnapshotLoading] = useState(false);
  const [snapshotError, setSnapshotError] = useState(null);

  // Use oracle snapshot hook (no polling when not in confirm flow)
  const { snapshot: backgroundSnapshot, refresh: refreshSnapshot } =
    useOracleSnapshot(0, false);

  useEffect(() => {
    if (!amount) {
      setQuote(null);
      return;
    }

    setQuoteLoading(true);
    const timer = setTimeout(async () => {
      try {
        const data = await fetchGrxOracleQuote(amount);
        setQuote({
          pricePerToken: data?.pricePerToken ?? 0,
          feeUSD: data?.feeUSD ?? 0,
          totalUSD: data?.totalUSD ?? 0,
        });
      } catch (error) {
        console.error("Oracle quote failed:", error);
        Alert.alert("Oracle Error", "Unable to fetch latest quote. Please retry.");
      } finally {
        setQuoteLoading(false);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [amount]);

  const formattedBalance = useMemo(() => {
    const parsed = parseFloat(grxBalance || "0");
    return Number.isFinite(parsed) ? parsed : 0;
  }, [grxBalance]);

  const validateSnapshotFreshness = (snapshot) => {
    if (!snapshot || !snapshot.timestamp) {
      return { valid: false, error: "Oracle snapshot unavailable" };
    }

    const snapshotTime = new Date(snapshot.timestamp);
    const now = new Date();
    const ageMinutes = (now - snapshotTime) / (1000 * 60);

    if (ageMinutes > ORACLE_SNAPSHOT_CONFIG.allowedWindowMinutes) {
      return {
        valid: false,
        error: `Snapshot too old (${Math.round(ageMinutes)} minutes). Please refresh.`,
      };
    }

    return { valid: true };
  };

  const handleReview = async () => {
    if (!amount || Number(amount) <= 0) {
      Alert.alert("Invalid Amount", "Enter a burn amount greater than zero.");
      return;
    }

    if (Number(amount) > formattedBalance) {
      Alert.alert("Insufficient Balance", "You do not have enough GRX.");
      return;
    }

    // Fetch fresh snapshot before showing confirm modal
    setSnapshotLoading(true);
    setSnapshotError(null);
    setSnapshotForConfirm(null);

    try {
      // Force refresh snapshot by fetching directly
      const freshSnapshot = await fetchOracleSnapshot();

      const snapshot = {
        id: freshSnapshot?.id || freshSnapshot?.snapshotId,
        timestamp: freshSnapshot?.timestamp || freshSnapshot?.updatedAt,
        goldPerGramUSD:
          freshSnapshot?.goldPerGramUSD || freshSnapshot?.goldPriceUSD,
        fx:
          typeof freshSnapshot?.fx === "string"
            ? JSON.parse(freshSnapshot.fx)
            : freshSnapshot?.fx || {},
        signature: freshSnapshot?.signature,
        sources: freshSnapshot?.sources || freshSnapshot?.source
          ? [freshSnapshot.source]
          : [],
      };

      const validation = validateSnapshotFreshness(snapshot);
      if (!validation.valid) {
        setSnapshotError(validation.error);
        Alert.alert("Oracle Snapshot Error", validation.error);
        return;
      }

      setSnapshotForConfirm(snapshot);
      setShowConfirm(true);
    } catch (error) {
      console.error("Failed to fetch oracle snapshot:", error);
      setSnapshotError(error.message || "Failed to fetch oracle snapshot");
      Alert.alert(
        "Oracle Snapshot Error",
        "Unable to fetch oracle snapshot. Please try again."
      );
    } finally {
      setSnapshotLoading(false);
    }
  };

  const handleConfirmBurn = async () => {
    // Validate snapshot one more time before proceeding
    if (!snapshotForConfirm) {
      Alert.alert("Error", "Oracle snapshot is required for redemption.");
      return;
    }

    const validation = validateSnapshotFreshness(snapshotForConfirm);
    if (!validation.valid) {
      Alert.alert("Oracle Snapshot Error", validation.error);
      return;
    }

    setShowConfirm(false);
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
          snapshotId: snapshotForConfirm.id,
        });

        setSuccessData({
          txHash: response?.txHash || "Backend managed",
          invoiceId,
          timestamp,
          burned: amount,
          custodial: true,
          snapshotId: snapshotForConfirm.id,
        });
        setAmount("");
        setSnapshotForConfirm(null);
        return;
      }

      // Non-custodial: on-chain burn with invoice
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

      // POST to backend /api/invoice/create with snapshot data
      try {
        await createBackendInvoice({
          invoiceId,
          txHash: tx.hash,
          snapshotId: snapshotForConfirm.id,
          snapshotSignature: snapshotForConfirm.signature,
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
        snapshotId: snapshotForConfirm.id,
      });

      refreshGrxBalance();
      setSuccessData({
        txHash: tx.hash,
        invoiceId,
        timestamp,
        burned: amount,
        custodial: false,
        snapshotId: snapshotForConfirm.id,
      });
      setAmount("");
      setSnapshotForConfirm(null);
    } catch (error) {
      console.error("Redeem error:", error);
      Alert.alert(
        "Burn Failed",
        error?.message || "Unable to submit burn transaction.",
        [
          {
            text: "Retry",
            onPress: () => {
              // Re-fetch snapshot and show confirm again
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
          <Text style={styles.successEmoji}>✅</Text>
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
          {successData.snapshotId && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Snapshot ID</Text>
              <Text style={styles.detailValue} numberOfLines={1}>
                {successData.snapshotId}
              </Text>
            </View>
          )}

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
        <Text style={styles.snapshotText}>Using snapshot for settlement.</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardLabel}>Available GRX</Text>
        <Text style={styles.cardValue}>
          {grxBalanceLoading ? "…" : `${formattedBalance.toFixed(4)} GRX`}
        </Text>
        <Text style={styles.cardHint}>
          Balance refreshes automatically every three seconds.
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

      <View style={styles.card}>
        <Text style={styles.cardLabel}>Oracle Quote</Text>
        {quoteLoading ? (
          <ActivityIndicator color={theme.colors.primary} />
        ) : quote ? (
          <>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Price / GRX</Text>
              <Text style={styles.detailValue}>
                ${Number(quote.pricePerToken).toFixed(2)}
              </Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Fees</Text>
              <Text style={styles.detailValue}>
                ${Number(quote.feeUSD).toFixed(2)}
              </Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Payout (USD)</Text>
              <Text style={styles.detailValue}>
                ${Number(quote.totalUSD).toFixed(2)}
              </Text>
            </View>
          </>
        ) : (
          <Text style={styles.cardHint}>Enter an amount to fetch latest price.</Text>
        )}
      </View>

      <TouchableOpacity
        style={[
          styles.primaryButton,
          (loading || snapshotLoading) && styles.buttonDisabled,
        ]}
        onPress={handleReview}
        disabled={loading || snapshotLoading}
      >
        {loading || snapshotLoading ? (
          <ActivityIndicator color={theme.colors.secondary} />
        ) : (
          <Text style={styles.primaryButtonText}>Review Burn</Text>
        )}
      </TouchableOpacity>

      <ConfirmModal
        visible={showConfirm}
        onClose={() => {
          setShowConfirm(false);
          setSnapshotForConfirm(null);
          setSnapshotError(null);
        }}
        onConfirm={handleConfirmBurn}
        transactionDetails={transactionDetails}
        loading={loading}
        snapshotCard={
          snapshotForConfirm ? (
            <OracleSnapshotCard
              snapshot={snapshotForConfirm}
              allowedWindowMinutes={
                ORACLE_SNAPSHOT_CONFIG.allowedWindowMinutes
              }
            />
          ) : null
        }
      />
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
    padding: theme.spacing.lg,
    gap: theme.spacing.lg,
  },
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    ...theme.shadows.small,
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
  snapshotText: {
    marginTop: theme.spacing.xs,
    fontSize: 12,
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
    borderWidth: 1,
    borderColor: theme.colors.border,
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
    backgroundColor: theme.colors.primary,
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
    ...theme.shadows.medium,
  },
  successEmoji: {
    fontSize: 48,
    marginBottom: theme.spacing.sm,
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
    color: theme.colors.primary,
    fontSize: 16,
    fontWeight: "600",
  },
});

export default RedeemScreen;


