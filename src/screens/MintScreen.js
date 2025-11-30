import React, { useState } from "react";
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity } from "react-native";
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

// Dummy data for minting
const DUMMY_MINT_DATA = {
  goldPricePerGram: 75.50,
  currentRate: "1 GRX = $75.50 USD",
  minMintAmount: "0.1",
  maxMintAmount: "10000",
  estimatedFee: "1.5%",
};

const MintScreen = () => {
  const [amount, setAmount] = useState("");
  const [estimatedGRX, setEstimatedGRX] = useState("0");

  const calculateGRX = (usdAmount) => {
    if (!usdAmount || parseFloat(usdAmount) <= 0) {
      setEstimatedGRX("0");
      return;
    }
    const grx = (parseFloat(usdAmount) / DUMMY_MINT_DATA.goldPricePerGram).toFixed(4);
    setEstimatedGRX(grx);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.iconContainer}>
          <MaterialIcons name="monetization-on" size={80} color={GOLD_COLORS.primary} />
        </View>
        <Text style={styles.title}>Mint GRX</Text>
        <Text style={styles.subtitle}>
          Convert USD to GRX tokens backed by physical gold
        </Text>

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
          <Text style={styles.label}>Enter USD Amount</Text>
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

        <TouchableOpacity
          style={[styles.mintButton, (!amount || parseFloat(amount) <= 0) && styles.buttonDisabled]}
          disabled={!amount || parseFloat(amount) <= 0}
        >
          <MaterialIcons name="add-circle-outline" size={24} color="#FFFFFF" />
          <Text style={styles.mintButtonText}> Mint GRX</Text>
        </TouchableOpacity>

        <View style={styles.noteCard}>
          <Ionicons name="information-circle-outline" size={20} color={theme.colors.textSecondary} />
          <Text style={styles.noteText}>
            Minting functionality will be available soon. This is a demo interface for testing.
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
});

export default MintScreen;

