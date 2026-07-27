import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import { theme } from "../styles/theme";
import { claimMatrixService } from "../services/claimMatrixService";

// Gold color constants
const GOLD_COLORS = {
  primary: "#D4AF37",
  light: "#F4E4BC",
  dark: "#B8941F",
  accent: "#FFD700",
  faded: "#F9F2DD",
};

const COUNTRIES = ["India", "Russia", "UAE"];

const VaultScreen = ({ navigation }) => {
  const [matrixData, setMatrixData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchMatrix();
  }, []);

  const fetchMatrix = async () => {
    try {
      setLoading(true);
      const data = await claimMatrixService.getMatrix();
      setMatrixData(data);
    } catch (err) {
      setError("Failed to fetch matrix data");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Helper to get amount from matrixData
  const getAmount = (owner, vault) => {
    const record = matrixData.find(m => m.ownerVault === owner && m.reserveVault === vault);
    return record ? parseFloat(record.amount) : 0;
  };

  const getRowTotal = (owner) => {
    return COUNTRIES.reduce((sum, vault) => sum + getAmount(owner, vault), 0);
  };

  const getColTotal = (vault) => {
    return COUNTRIES.reduce((sum, owner) => sum + getAmount(owner, vault), 0);
  };

  const formatNumber = (num) => {
    return num.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 4 });
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={GOLD_COLORS.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <Text style={styles.title}>Vault</Text>
        </View>

        {/* Ownership Matrix Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <MaterialIcons name="grid-on" size={24} color={GOLD_COLORS.dark} />
            <Text style={styles.cardTitle}>Ownership Matrix</Text>
          </View>
          <Text style={styles.cardSubtitle}>
            Rows = GRX owner · Columns = vault location · Highlighted diagonal = domestic holdings.
            Note: Transfers prioritize foreign holdings and repatriation to reduce cross-border exposure.
          </Text>

          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.table}>
              {/* Header Row */}
              <View style={styles.tableRow}>
                <View style={[styles.tableCell, styles.headerCell, styles.topLeftCell]}>
                  <Text style={styles.headerText}>Owner \ Vault →</Text>
                </View>
                {COUNTRIES.map(c => (
                  <View key={`h-${c}`} style={[styles.tableCell, styles.headerCell]}>
                    <Text style={styles.headerTextBold}>{c}</Text>
                  </View>
                ))}
                <View style={[styles.tableCell, styles.headerCell]}>
                  <Text style={styles.headerTextBold}>Total</Text>
                </View>
              </View>

              {/* Data Rows */}
              {COUNTRIES.map(owner => (
                <View key={`row-${owner}`} style={styles.tableRow}>
                  <View style={[styles.tableCell, styles.headerCell]}>
                    <Text style={styles.headerTextBold}>{owner}</Text>
                  </View>
                  {COUNTRIES.map(vault => {
                    const amount = getAmount(owner, vault);
                    const isDomestic = owner === vault;
                    return (
                      <View 
                        key={`cell-${owner}-${vault}`} 
                        style={[
                          styles.tableCell, 
                          isDomestic && styles.domesticCell,
                          amount > 0 && !isDomestic && styles.activeForeignCell
                        ]}
                      >
                        <Text style={[styles.cellText, isDomestic && styles.domesticText, amount === 0 && styles.emptyText]}>
                          {amount === 0 ? "—" : formatNumber(amount)}
                        </Text>
                      </View>
                    );
                  })}
                  <View style={[styles.tableCell, styles.totalCell]}>
                    <Text style={styles.totalText}>{formatNumber(getRowTotal(owner))}</Text>
                  </View>
                </View>
              ))}

              {/* Footer Row */}
              <View style={styles.tableRow}>
                <View style={[styles.tableCell, styles.headerCell]}>
                  <Text style={styles.headerTextBold}>Vault Total</Text>
                </View>
                {COUNTRIES.map(vault => (
                  <View key={`f-${vault}`} style={[styles.tableCell, styles.totalCell]}>
                    <Text style={styles.totalText}>{formatNumber(getColTotal(vault))}</Text>
                  </View>
                ))}
                <View style={[styles.tableCell, styles.totalCell]}>
                  <Text style={styles.totalText}>
                    {formatNumber(COUNTRIES.reduce((sum, v) => sum + getColTotal(v), 0))}
                  </Text>
                </View>
              </View>
            </View>
          </ScrollView>
        </View>

        {/* Per-Vault Breakdown */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <MaterialIcons name="inventory" size={24} color={GOLD_COLORS.dark} />
            <Text style={styles.cardTitle}>Per-Vault Breakdown</Text>
          </View>
          
          {COUNTRIES.map(vault => {
            const vaultTotal = getColTotal(vault);

            return (
              <View key={`breakdown-${vault}`} style={styles.breakdownCard}>
                <View style={styles.breakdownHeader}>
                  <Text style={styles.breakdownTitle}>{vault} Vault</Text>
                  <Text style={styles.breakdownTotal}>{formatNumber(vaultTotal)} GRX</Text>
                </View>
                <View style={styles.divider} />
                
                {vaultTotal === 0 ? (
                  <Text style={styles.emptyVaultText}>No GRX stored in this vault yet.</Text>
                ) : (
                  COUNTRIES.map(owner => {
                    const amount = getAmount(owner, vault);
                    if (amount === 0) return null;
                    
                    const isDomestic = owner === vault;
                    const percentage = ((amount / vaultTotal) * 100).toFixed(0);
                    
                    return (
                      <View key={`bd-row-${owner}-${vault}`} style={styles.breakdownRow}>
                        <View style={styles.breakdownRowHeader}>
                          <Text style={styles.breakdownOwner}>
                            {owner} {isDomestic ? <Text style={styles.domesticLabel}>(domestic)</Text> : null}
                          </Text>
                          <Text style={styles.breakdownAmount}>{percentage}%</Text>
                        </View>
                        <Text style={styles.breakdownSubAmount}>{formatNumber(amount)} GRX</Text>
                        <View style={styles.progressBarBg}>
                          <View style={[styles.progressBarFill, { width: `${percentage}%`, backgroundColor: isDomestic ? GOLD_COLORS.primary : GOLD_COLORS.dark }]} />
                        </View>
                      </View>
                    );
                  })
                )}
              </View>
            );
          })}
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
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  content: {
    padding: theme.spacing.lg,
  },
  header: {
    marginBottom: theme.spacing.lg,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: GOLD_COLORS.dark,
  },
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.xl,
    ...theme.shadows.medium,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: theme.spacing.sm,
    gap: theme.spacing.sm,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: theme.colors.text,
  },
  cardSubtitle: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.lg,
    lineHeight: 18,
  },
  table: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: theme.borderRadius.sm,
    overflow: 'hidden',
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  tableCell: {
    width: 100,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.sm,
    justifyContent: "center",
    alignItems: "center",
    borderRightWidth: 1,
    borderRightColor: "#E5E7EB",
  },
  topLeftCell: {
    alignItems: "flex-start",
  },
  headerCell: {
    backgroundColor: "#F9FAFB",
  },
  domesticCell: {
    backgroundColor: GOLD_COLORS.faded,
  },
  activeForeignCell: {
    backgroundColor: "#F3F4F6",
  },
  totalCell: {
    backgroundColor: GOLD_COLORS.faded,
  },
  headerText: {
    fontSize: 11,
    color: theme.colors.textSecondary,
  },
  headerTextBold: {
    fontSize: 13,
    fontWeight: "600",
    color: theme.colors.text,
  },
  cellText: {
    fontSize: 13,
    color: theme.colors.text,
  },
  emptyText: {
    color: theme.colors.textSecondary,
  },
  domesticText: {
    color: GOLD_COLORS.dark,
    fontWeight: "600",
  },
  totalText: {
    fontSize: 13,
    fontWeight: "700",
    color: GOLD_COLORS.dark,
  },
  breakdownCard: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    backgroundColor: "#FAFAFA",
  },
  breakdownHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  breakdownTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: theme.colors.text,
  },
  breakdownTotal: {
    fontSize: 14,
    fontWeight: "700",
    color: theme.colors.textSecondary,
  },
  divider: {
    height: 1,
    backgroundColor: "#E5E7EB",
    marginVertical: theme.spacing.md,
  },
  breakdownRow: {
    marginBottom: theme.spacing.md,
  },
  breakdownRowHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  breakdownOwner: {
    fontSize: 14,
    fontWeight: "600",
    color: theme.colors.text,
  },
  domesticLabel: {
    fontSize: 12,
    fontWeight: "400",
    color: GOLD_COLORS.dark,
  },
  breakdownAmount: {
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
  breakdownSubAmount: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginBottom: 8,
  },
  progressBarBg: {
    height: 6,
    backgroundColor: "#E5E7EB",
    borderRadius: 3,
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    borderRadius: 3,
  },
  emptyVaultText: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: theme.spacing.md,
  },
});

export default VaultScreen;


