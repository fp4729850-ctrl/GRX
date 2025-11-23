import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { theme } from '../styles/theme';

const BalanceCard = ({ symbol, balance, usdBalance, icon }) => {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.symbol}>{symbol}</Text>
        {icon && <Text style={styles.icon}>{icon}</Text>}
      </View>
      <Text style={styles.balance}>{balance}</Text>
      <Text style={styles.usdBalance}>${usdBalance} USD</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.lg,
    borderRadius: theme.borderRadius.lg,
    marginBottom: theme.spacing.md,
    ...theme.shadows.medium,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  symbol: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text,
  },
  icon: {
    fontSize: 24,
  },
  balance: {
    fontSize: 32,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  usdBalance: {
    fontSize: 16,
    color: theme.colors.textSecondary,
  },
});

export default BalanceCard;

