import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { useWallet } from "../context/WalletContext";
import { useGRXBalance } from "../hooks/useGRXBalance";
import { theme } from "../styles/theme";

// Gold color constants
const GOLD_COLORS = {
  primary: "#D4AF37",
  light: "#F4E4BC",
  dark: "#B8941F",
  accent: "#FFD700",
};

// Dummy data for testing
const DUMMY_DATA = {
  grxBalance: "1250.5000",
  swapFee: "0.5%",
  minSwapAmount: "1.0",
  estimatedTime: "2-5 minutes",
};

const OwnershipSwapScreen = ({ navigation }) => {
  const { walletAddress, currentNetwork, isTestnet } = useWallet();
  const {
    balance: grxBalance,
    loading: grxBalanceLoading,
  } = useGRXBalance(walletAddress, currentNetwork, isTestnet);
  
  const [fromAmount, setFromAmount] = useState("");
  const [toAddress, setToAddress] = useState("");
  const [swapType, setSwapType] = useState("transfer"); // transfer or receive

  const displayBalance = grxBalance || DUMMY_DATA.grxBalance;

  const handleSwap = () => {
    if (!fromAmount || parseFloat(fromAmount) <= 0) {
      Alert.alert("Error", "Please enter a valid amount");
      return;
    }
    if (parseFloat(fromAmount) > parseFloat(displayBalance)) {
      Alert.alert("Error", "Insufficient balance");
      return;
    }
    if (!toAddress || toAddress.length < 10) {
      Alert.alert("Error", "Please enter a valid recipient address");
      return;
    }

    Alert.alert(
      "Swap Initiated",
      `Ownership swap of ${fromAmount} GRX to ${toAddress.substring(0, 10)}... will be processed.`,
      [
        {
          text: "OK",
          onPress: () => navigation.goBack(),
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <View style={styles.iconContainer}>
            <Ionicons name="swap-vertical" size={64} color={GOLD_COLORS.primary} />
          </View>
          <Text style={styles.title}>Ownership Swapping</Text>
          <Text style={styles.subtitle}>
            Transfer GRX ownership between wallets
          </Text>
        </View>

        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <MaterialIcons name="info-outline" size={20} color={GOLD_COLORS.primary} />
            <Text style={styles.infoText}>
              Swap Fee: {DUMMY_DATA.swapFee} • Min: {DUMMY_DATA.minSwapAmount} GRX
            </Text>
          </View>
          <View style={styles.infoRow}>
            <MaterialIcons name="schedule" size={20} color={GOLD_COLORS.primary} />
            <Text style={styles.infoText}>
              Estimated Time: {DUMMY_DATA.estimatedTime}
            </Text>
          </View>
        </View>

        <View style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>Available Balance</Text>
          <Text style={styles.balanceAmount}>
            {grxBalanceLoading ? "…" : `${parseFloat(displayBalance).toFixed(4)} GRX`}
          </Text>
        </View>

        <View style={styles.inputCard}>
          <Text style={styles.label}>Amount to Swap</Text>
          <TextInput
            style={styles.input}
            value={fromAmount}
            onChangeText={setFromAmount}
            placeholder="0.0"
            keyboardType="decimal-pad"
          />
          <Text style={styles.hint}>
            Balance: {parseFloat(displayBalance).toFixed(4)} GRX
          </Text>
        </View>

        <View style={styles.inputCard}>
          <Text style={styles.label}>Recipient Address</Text>
          <TextInput
            style={[styles.input, styles.addressInput]}
            value={toAddress}
            onChangeText={setToAddress}
            placeholder="0x..."
            multiline
            numberOfLines={2}
            autoCapitalize="none"
          />
        </View>

        {fromAmount && parseFloat(fromAmount) > 0 && (
          <View style={styles.summaryCard}>
            <Text style={styles.summaryTitle}>Swap Summary</Text>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Amount:</Text>
              <Text style={styles.summaryValue}>{fromAmount} GRX</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Fee ({DUMMY_DATA.swapFee}):</Text>
              <Text style={styles.summaryValue}>
                {(parseFloat(fromAmount) * 0.005).toFixed(4)} GRX
              </Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Total:</Text>
              <Text style={styles.summaryValue}>
                {(parseFloat(fromAmount) * 1.005).toFixed(4)} GRX
              </Text>
            </View>
          </View>
        )}

        <TouchableOpacity
          style={[
            styles.swapButton,
            (!fromAmount || !toAddress || parseFloat(fromAmount) <= 0) && styles.buttonDisabled,
          ]}
          onPress={handleSwap}
          disabled={!fromAmount || !toAddress || parseFloat(fromAmount) <= 0}
        >
          <Ionicons name="swap-vertical" size={24} color="#FFFFFF" />
          <Text style={styles.swapButtonText}> Initiate Swap</Text>
        </TouchableOpacity>

        <View style={styles.noteCard}>
          <Ionicons name="information-circle-outline" size={20} color={theme.colors.textSecondary} />
          <Text style={styles.noteText}>
            Ownership swapping transfers GRX tokens between wallets. This is a demo interface for testing.
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
  },
  content: {
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
  balanceCard: {
    backgroundColor: GOLD_COLORS.light,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    alignItems: "center",
    marginBottom: theme.spacing.lg,
    borderWidth: 2,
    borderColor: GOLD_COLORS.primary,
  },
  balanceLabel: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.xs,
    fontWeight: "600",
  },
  balanceAmount: {
    fontSize: 32,
    fontWeight: "700",
    color: GOLD_COLORS.dark,
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
  addressInput: {
    fontSize: 14,
    fontFamily: "monospace",
    minHeight: 60,
  },
  hint: {
    fontSize: 12,
    color: theme.colors.textSecondary,
  },
  summaryCard: {
    backgroundColor: GOLD_COLORS.light,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.md,
    borderWidth: 2,
    borderColor: GOLD_COLORS.primary,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: GOLD_COLORS.dark,
    marginBottom: theme.spacing.md,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: theme.spacing.sm,
  },
  summaryLabel: {
    fontSize: 16,
    color: theme.colors.text,
    fontWeight: "500",
  },
  summaryValue: {
    fontSize: 16,
    color: GOLD_COLORS.dark,
    fontWeight: "700",
  },
  swapButton: {
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
  swapButtonText: {
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
});

export default OwnershipSwapScreen;

