import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions, Platform } from 'react-native';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { theme } from '../../styles/theme';

// Gold color constants
const GOLD_COLORS = {
  primary: '#D4AF37',
  light: '#F4E4BC',
  dark: '#B8941F',
  accent: '#FFD700',
};

// Dummy oracle data
const DUMMY_ORACLE = {
  current: {
    id: 'SNAP-001',
    goldPriceINRPerGram: 6250.00,
    goldPerGramUSD: 75.50,
    fx: {
      INR: 83.25,
      AED: 3.67,
      RUB: 92.50,
      CNY: 7.25,
    },
    updatedAt: new Date().toISOString(),
    sources: ['LBMA', 'COMEX'],
  },
  historical: [
    { date: '2024-03-15', price: 75.50 },
    { date: '2024-03-14', price: 75.25 },
    { date: '2024-03-13', price: 75.75 },
  ],
};

const AdminOracle = () => {
  const [selectedTab, setSelectedTab] = useState('current');

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.title}>Oracle Management</Text>
        <Text style={styles.subtitle}>Manage oracle snapshots and FX rates</Text>
      </View>

      <View style={styles.tabRow}>
        <TouchableOpacity
          style={[styles.tab, selectedTab === 'current' && styles.tabActive]}
          onPress={() => setSelectedTab('current')}
        >
          <Text style={[styles.tabText, selectedTab === 'current' && styles.tabTextActive]}>
            Current Snapshot
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, selectedTab === 'historical' && styles.tabActive]}
          onPress={() => setSelectedTab('historical')}
        >
          <Text style={[styles.tabText, selectedTab === 'historical' && styles.tabTextActive]}>
            Historical Data
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, selectedTab === 'settings' && styles.tabActive]}
          onPress={() => setSelectedTab('settings')}
        >
          <Text style={[styles.tabText, selectedTab === 'settings' && styles.tabTextActive]}>
            Settings
          </Text>
        </TouchableOpacity>
      </View>

      {selectedTab === 'current' && (
        <View style={styles.snapshotCard}>
          <View style={styles.cardHeader}>
            <MaterialIcons name="insights" size={24} color={GOLD_COLORS.primary} />
            <Text style={styles.cardTitle}>Current Oracle Snapshot</Text>
          </View>
          <View style={styles.snapshotInfo}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Snapshot ID:</Text>
              <Text style={styles.infoValue}>{DUMMY_ORACLE.current.id}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Last Updated:</Text>
              <Text style={styles.infoValue}>
                {new Date(DUMMY_ORACLE.current.updatedAt).toLocaleString()}
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Sources:</Text>
              <Text style={styles.infoValue}>{DUMMY_ORACLE.current.sources.join(', ')}</Text>
            </View>
          </View>

          <View style={styles.priceSection}>
            <View style={styles.priceCard}>
              <Text style={styles.priceLabel}>Gold Price (USD/gram)</Text>
              <Text style={styles.priceValue}>${DUMMY_ORACLE.current.goldPerGramUSD.toFixed(2)}</Text>
            </View>
            <View style={styles.priceCard}>
              <Text style={styles.priceLabel}>Gold Price (INR/gram)</Text>
              <Text style={styles.priceValue}>
                ₹{DUMMY_ORACLE.current.goldPriceINRPerGram.toLocaleString('en-IN', {
                  maximumFractionDigits: 2,
                })}
              </Text>
            </View>
          </View>

          <View style={styles.fxSection}>
            <Text style={styles.sectionTitle}>FX Rates</Text>
            <View style={styles.fxGrid}>
              {Object.entries(DUMMY_ORACLE.current.fx).map(([currency, rate]) => (
                <View key={currency} style={styles.fxItem}>
                  <Text style={styles.fxLabel}>USD → {currency}</Text>
                  <Text style={styles.fxValue}>{rate.toFixed(4)}</Text>
                </View>
              ))}
            </View>
          </View>

          <TouchableOpacity style={styles.refreshButton}>
            <Ionicons name="refresh" size={20} color="#FFFFFF" />
            <Text style={styles.refreshButtonText}>Refresh Snapshot</Text>
          </TouchableOpacity>
        </View>
      )}

      {selectedTab === 'historical' && (
        <View style={styles.historicalCard}>
          <Text style={styles.sectionTitle}>Price History</Text>
          {DUMMY_ORACLE.historical.map((entry, index) => (
            <View key={index} style={styles.historicalItem}>
              <Text style={styles.historicalDate}>{entry.date}</Text>
              <Text style={styles.historicalPrice}>${entry.price.toFixed(2)}/gram</Text>
            </View>
          ))}
        </View>
      )}

      {selectedTab === 'settings' && (
        <View style={styles.settingsCard}>
          <Text style={styles.sectionTitle}>Oracle Configuration</Text>
          <View style={styles.settingItem}>
            <Text style={styles.settingLabel}>Update Interval</Text>
            <Text style={styles.settingValue}>30 minutes</Text>
          </View>
          <View style={styles.settingItem}>
            <Text style={styles.settingLabel}>Data Sources</Text>
            <Text style={styles.settingValue}>LBMA, COMEX</Text>
          </View>
          <View style={styles.settingItem}>
            <Text style={styles.settingLabel}>Snapshot Window</Text>
            <Text style={styles.settingValue}>10 minutes</Text>
          </View>
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  content: {
    padding: Platform.OS === 'web' ? theme.spacing.lg : theme.spacing.md,
  },
  header: {
    marginBottom: theme.spacing.lg,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: GOLD_COLORS.primary,
    marginBottom: theme.spacing.xs,
  },
  subtitle: {
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
  tabRow: {
    flexDirection: 'row',
    marginBottom: theme.spacing.lg,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    padding: 4,
    borderWidth: 1.5,
    borderColor: GOLD_COLORS.light,
  },
  tab: {
    flex: 1,
    paddingVertical: theme.spacing.sm,
    alignItems: 'center',
    borderRadius: theme.borderRadius.sm,
  },
  tabActive: {
    backgroundColor: GOLD_COLORS.light,
  },
  tabText: {
    fontSize: 14,
    color: theme.colors.text,
    fontWeight: '500',
  },
  tabTextActive: {
    color: GOLD_COLORS.dark,
    fontWeight: '700',
  },
  snapshotCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    borderWidth: 1.5,
    borderColor: GOLD_COLORS.light,
    ...theme.shadows.small,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.text,
    marginLeft: theme.spacing.sm,
  },
  snapshotInfo: {
    marginBottom: theme.spacing.md,
    paddingBottom: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.xs,
  },
  infoLabel: {
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text,
  },
  priceSection: {
    flexDirection: Dimensions.get('window').width < 768 ? 'column' : 'row',
    gap: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  priceCard: {
    flex: 1,
    backgroundColor: GOLD_COLORS.light,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: GOLD_COLORS.primary,
  },
  priceLabel: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.xs,
  },
  priceValue: {
    fontSize: 20,
    fontWeight: '700',
    color: GOLD_COLORS.dark,
  },
  fxSection: {
    marginBottom: theme.spacing.md,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  fxGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.md,
  },
  fxItem: {
    width: Dimensions.get('window').width < 768 ? '100%' : '48%',
    backgroundColor: theme.colors.background,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.sm,
    borderWidth: 1,
    borderColor: GOLD_COLORS.light,
  },
  fxLabel: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginBottom: 4,
  },
  fxValue: {
    fontSize: 16,
    fontWeight: '700',
    color: GOLD_COLORS.primary,
  },
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: GOLD_COLORS.primary,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    gap: theme.spacing.xs,
  },
  refreshButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  historicalCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    borderWidth: 1.5,
    borderColor: GOLD_COLORS.light,
    ...theme.shadows.small,
  },
  historicalItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  historicalDate: {
    fontSize: 14,
    color: theme.colors.text,
  },
  historicalPrice: {
    fontSize: 14,
    fontWeight: '600',
    color: GOLD_COLORS.primary,
  },
  settingsCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    borderWidth: 1.5,
    borderColor: GOLD_COLORS.light,
    ...theme.shadows.small,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  settingLabel: {
    fontSize: 14,
    color: theme.colors.text,
    fontWeight: '500',
  },
  settingValue: {
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
});

export default AdminOracle;

