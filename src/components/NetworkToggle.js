import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { theme } from '../styles/theme';

const NetworkToggle = ({ currentNetwork, isTestnet, onToggle }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>Network</Text>
      <View style={styles.toggleContainer}>
        <TouchableOpacity
          style={[
            styles.toggleButton,
            currentNetwork === 'ETHEREUM' && styles.toggleButtonActive,
          ]}
          onPress={() => onToggle('ETHEREUM', isTestnet)}
        >
          <Text
            style={[
              styles.toggleText,
              currentNetwork === 'ETHEREUM' && styles.toggleTextActive,
            ]}
          >
            Ethereum
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.toggleButton,
            currentNetwork === 'BSC' && styles.toggleButtonActive,
          ]}
          onPress={() => onToggle('BSC', isTestnet)}
        >
          <Text
            style={[
              styles.toggleText,
              currentNetwork === 'BSC' && styles.toggleTextActive,
            ]}
          >
            BNB Chain
          </Text>
        </TouchableOpacity>
      </View>
      <TouchableOpacity
        style={styles.testnetToggle}
        onPress={() => onToggle(currentNetwork, !isTestnet)}
      >
        <Text style={styles.testnetText}>
          {isTestnet ? 'Testnet Mode' : 'Mainnet Mode'}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing.md,
    ...theme.shadows.small,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  toggleContainer: {
    flexDirection: 'row',
    backgroundColor: theme.colors.background,
    borderRadius: theme.borderRadius.md,
    padding: 2,
    marginBottom: theme.spacing.sm,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: theme.spacing.sm,
    alignItems: 'center',
    borderRadius: theme.borderRadius.sm,
  },
  toggleButtonActive: {
    backgroundColor: theme.colors.primary,
  },
  toggleText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.textSecondary,
  },
  toggleTextActive: {
    color: theme.colors.secondary,
  },
  testnetToggle: {
    alignItems: 'center',
    paddingVertical: theme.spacing.xs,
  },
  testnetText: {
    fontSize: 12,
    color: theme.colors.primary,
    fontWeight: '500',
  },
});

export default NetworkToggle;

