import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Switch, TouchableOpacity, Platform } from 'react-native';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { theme } from '../../styles/theme';

// Gold color constants
const GOLD_COLORS = {
  primary: '#D4AF37',
  light: '#F4E4BC',
  dark: '#B8941F',
  accent: '#FFD700',
};

const AdminSystem = () => {
  const [featureFlags, setFeatureFlags] = useState({
    mintingEnabled: true,
    burningEnabled: true,
    custodialMode: true,
    oracleUpdates: true,
  });

  const toggleFeature = (key) => {
    setFeatureFlags((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.title}>System Controls</Text>
        <Text style={styles.subtitle}>Platform configuration and system management</Text>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <MaterialIcons name="flag" size={24} color={GOLD_COLORS.primary} />
          <Text style={styles.sectionTitle}>Feature Flags</Text>
        </View>
        <View style={styles.featureItem}>
          <View style={styles.featureInfo}>
            <Text style={styles.featureLabel}>Minting Enabled</Text>
            <Text style={styles.featureDescription}>Allow users to mint new GRX tokens</Text>
          </View>
          <Switch
            value={featureFlags.mintingEnabled}
            onValueChange={() => toggleFeature('mintingEnabled')}
            trackColor={{ false: '#ccc', true: GOLD_COLORS.primary }}
          />
        </View>
        <View style={styles.featureItem}>
          <View style={styles.featureInfo}>
            <Text style={styles.featureLabel}>Burning Enabled</Text>
            <Text style={styles.featureDescription}>Allow users to burn GRX tokens</Text>
          </View>
          <Switch
            value={featureFlags.burningEnabled}
            onValueChange={() => toggleFeature('burningEnabled')}
            trackColor={{ false: '#ccc', true: GOLD_COLORS.primary }}
          />
        </View>
        <View style={styles.featureItem}>
          <View style={styles.featureInfo}>
            <Text style={styles.featureLabel}>Custodial Mode</Text>
            <Text style={styles.featureDescription}>Enable custodial wallet functionality</Text>
          </View>
          <Switch
            value={featureFlags.custodialMode}
            onValueChange={() => toggleFeature('custodialMode')}
            trackColor={{ false: '#ccc', true: GOLD_COLORS.primary }}
          />
        </View>
        <View style={styles.featureItem}>
          <View style={styles.featureInfo}>
            <Text style={styles.featureLabel}>Oracle Updates</Text>
            <Text style={styles.featureDescription}>Enable automatic oracle price updates</Text>
          </View>
          <Switch
            value={featureFlags.oracleUpdates}
            onValueChange={() => toggleFeature('oracleUpdates')}
            trackColor={{ false: '#ccc', true: GOLD_COLORS.primary }}
          />
        </View>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <MaterialIcons name="settings-ethernet" size={24} color={GOLD_COLORS.primary} />
          <Text style={styles.sectionTitle}>Network Configuration</Text>
        </View>
        <View style={styles.configItem}>
          <Text style={styles.configLabel}>Default Network</Text>
          <Text style={styles.configValue}>Ethereum</Text>
        </View>
        <View style={styles.configItem}>
          <Text style={styles.configLabel}>Testnet Enabled</Text>
          <Text style={styles.configValue}>Yes</Text>
        </View>
        <View style={styles.configItem}>
          <Text style={styles.configLabel}>RPC Endpoint</Text>
          <Text style={styles.configValue}>Infura</Text>
        </View>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <MaterialIcons name="history" size={24} color={GOLD_COLORS.primary} />
          <Text style={styles.sectionTitle}>System Logs</Text>
        </View>
        <View style={styles.logItem}>
          <View style={styles.logHeader}>
            <Text style={styles.logLevel}>INFO</Text>
            <Text style={styles.logTime}>2024-03-15 10:30:00</Text>
          </View>
          <Text style={styles.logMessage}>Oracle snapshot updated successfully</Text>
        </View>
        <View style={styles.logItem}>
          <View style={styles.logHeader}>
            <Text style={[styles.logLevel, { color: theme.colors.warning }]}>WARN</Text>
            <Text style={styles.logTime}>2024-03-15 09:15:00</Text>
          </View>
          <Text style={styles.logMessage}>Rate limit warning for API endpoint</Text>
        </View>
        <View style={styles.logItem}>
          <View style={styles.logHeader}>
            <Text style={[styles.logLevel, { color: theme.colors.error }]}>ERROR</Text>
            <Text style={styles.logTime}>2024-03-15 08:00:00</Text>
          </View>
          <Text style={styles.logMessage}>Failed to fetch user balance</Text>
        </View>
        <TouchableOpacity style={styles.viewAllButton}>
          <Text style={styles.viewAllButtonText}>View All Logs</Text>
          <Ionicons name="chevron-forward" size={20} color={GOLD_COLORS.primary} />
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <MaterialIcons name="security" size={24} color={theme.colors.error} />
          <Text style={[styles.sectionTitle, { color: theme.colors.error }]}>Danger Zone</Text>
        </View>
        <TouchableOpacity style={styles.dangerButton}>
          <MaterialIcons name="refresh" size={20} color={theme.colors.error} />
          <Text style={styles.dangerButtonText}>Reset Platform</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.dangerButton}>
          <MaterialIcons name="delete-forever" size={20} color={theme.colors.error} />
          <Text style={styles.dangerButtonText}>Clear All Data</Text>
        </TouchableOpacity>
      </View>
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
  section: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
    borderWidth: 1.5,
    borderColor: GOLD_COLORS.light,
    ...theme.shadows.small,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.text,
    marginLeft: theme.spacing.sm,
  },
  featureItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  featureInfo: {
    flex: 1,
    marginRight: theme.spacing.md,
  },
  featureLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 4,
  },
  featureDescription: {
    fontSize: 12,
    color: theme.colors.textSecondary,
  },
  configItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  configLabel: {
    fontSize: 14,
    color: theme.colors.text,
    fontWeight: '500',
  },
  configValue: {
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
  logItem: {
    paddingVertical: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  logHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  logLevel: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.colors.success,
  },
  logTime: {
    fontSize: 12,
    color: theme.colors.textSecondary,
  },
  logMessage: {
    fontSize: 14,
    color: theme.colors.text,
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderWidth: 1.5,
    borderColor: GOLD_COLORS.primary,
    borderRadius: theme.borderRadius.md,
    gap: theme.spacing.xs,
  },
  viewAllButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: GOLD_COLORS.primary,
  },
  dangerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    backgroundColor: theme.colors.error + '10',
    borderRadius: theme.borderRadius.md,
    borderWidth: 1.5,
    borderColor: theme.colors.error,
    gap: theme.spacing.xs,
  },
  dangerButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.error,
  },
});

export default AdminSystem;

