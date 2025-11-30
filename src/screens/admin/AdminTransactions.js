import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions, Platform } from 'react-native';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { theme } from '../../styles/theme';
import { formatAddress } from '../../utils/validation';

// Gold color constants
const GOLD_COLORS = {
  primary: '#D4AF37',
  light: '#F4E4BC',
  dark: '#B8941F',
  accent: '#FFD700',
};

// Dummy transaction data
const DUMMY_TRANSACTIONS = [
  {
    id: '1',
    type: 'mint',
    from: null,
    to: '0x1234567890abcdef1234567890abcdef12345678',
    amount: '1000.0000',
    token: 'GRX',
    timestamp: '2024-03-15 10:30:00',
    txHash: '0xabc123...def456',
    status: 'confirmed',
    network: 'Ethereum',
  },
  {
    id: '2',
    type: 'burn',
    from: '0xabcdef1234567890abcdef1234567890abcdef12',
    to: null,
    amount: '500.5000',
    token: 'GRX',
    timestamp: '2024-03-15 09:15:00',
    txHash: '0xdef456...abc123',
    status: 'confirmed',
    network: 'BSC',
  },
  {
    id: '3',
    type: 'send',
    from: '0x9876543210fedcba9876543210fedcba98765432',
    to: '0x1234567890abcdef1234567890abcdef12345678',
    amount: '250.2500',
    token: 'GRX',
    timestamp: '2024-03-15 08:45:00',
    txHash: '0x123abc...456def',
    status: 'confirmed',
    network: 'Ethereum',
  },
];

const getTransactionIcon = (type) => {
  switch (type) {
    case 'mint':
      return 'add-circle';
    case 'burn':
      return 'flame';
    case 'send':
      return 'arrow-up';
    case 'receive':
      return 'arrow-down';
    default:
      return 'swap-horiz';
  }
};

const getTransactionColor = (type) => {
  switch (type) {
    case 'mint':
      return GOLD_COLORS.primary;
    case 'burn':
      return theme.colors.error;
    case 'send':
      return theme.colors.warning;
    case 'receive':
      return theme.colors.success;
    default:
      return theme.colors.textSecondary;
  }
};

const AdminTransactions = () => {
  const [filterType, setFilterType] = useState('all');

  const filteredTransactions = DUMMY_TRANSACTIONS.filter(
    (tx) => filterType === 'all' || tx.type === filterType
  );

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.title}>Transaction Monitoring</Text>
        <Text style={styles.subtitle}>Monitor all platform transactions</Text>
      </View>

      <View style={styles.filterRow}>
        {['all', 'mint', 'burn', 'send', 'receive'].map((type) => (
          <TouchableOpacity
            key={type}
            style={[
              styles.filterButton,
              filterType === type && styles.filterButtonActive,
            ]}
            onPress={() => setFilterType(type)}
          >
            <Text
              style={[
                styles.filterButtonText,
                filterType === type && styles.filterButtonTextActive,
              ]}
            >
              {type.charAt(0).toUpperCase() + type.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.statsCard}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{DUMMY_TRANSACTIONS.length}</Text>
          <Text style={styles.statLabel}>Total Transactions</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>
            {DUMMY_TRANSACTIONS.filter((tx) => tx.status === 'confirmed').length}
          </Text>
          <Text style={styles.statLabel}>Confirmed</Text>
        </View>
      </View>

      {filteredTransactions.map((tx) => (
        <View key={tx.id} style={styles.transactionCard}>
          <View style={styles.transactionHeader}>
            <View style={[styles.transactionIcon, { backgroundColor: getTransactionColor(tx.type) + '20' }]}>
              <Ionicons name={getTransactionIcon(tx.type)} size={24} color={getTransactionColor(tx.type)} />
            </View>
            <View style={styles.transactionInfo}>
              <Text style={styles.transactionType}>
                {tx.type.charAt(0).toUpperCase() + tx.type.slice(1)}
              </Text>
              <Text style={styles.transactionAmount}>
                {tx.type === 'send' ? '-' : '+'} {tx.amount} {tx.token}
              </Text>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: theme.colors.success + '20' }]}>
              <Text style={[styles.statusText, { color: theme.colors.success }]}>
                {tx.status}
              </Text>
            </View>
          </View>
          <View style={styles.transactionDetails}>
            {tx.from && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>From:</Text>
                <Text style={styles.detailValue}>{formatAddress(tx.from)}</Text>
              </View>
            )}
            {tx.to && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>To:</Text>
                <Text style={styles.detailValue}>{formatAddress(tx.to)}</Text>
              </View>
            )}
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Network:</Text>
              <Text style={styles.detailValue}>{tx.network}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Time:</Text>
              <Text style={styles.detailValue}>{tx.timestamp}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Tx Hash:</Text>
              <Text style={[styles.detailValue, styles.txHash]}>{tx.txHash}</Text>
            </View>
          </View>
        </View>
      ))}
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
  filterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.lg,
  },
  filterButton: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.surface,
    borderWidth: 1.5,
    borderColor: GOLD_COLORS.light,
    minHeight: 40,
    justifyContent: 'center',
  },
  filterButton: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.surface,
    borderWidth: 1.5,
    borderColor: GOLD_COLORS.light,
  },
  filterButtonActive: {
    backgroundColor: GOLD_COLORS.light,
    borderColor: GOLD_COLORS.primary,
  },
  filterButtonText: {
    fontSize: 14,
    color: theme.colors.text,
    fontWeight: '500',
  },
  filterButtonTextActive: {
    color: GOLD_COLORS.dark,
    fontWeight: '700',
  },
  statsCard: {
    flexDirection: 'row',
    backgroundColor: GOLD_COLORS.light,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
    borderWidth: 2,
    borderColor: GOLD_COLORS.primary,
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 28,
    fontWeight: '700',
    color: GOLD_COLORS.dark,
    marginBottom: theme.spacing.xs,
  },
  statLabel: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    fontWeight: '600',
  },
  transactionCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    borderWidth: 1.5,
    borderColor: GOLD_COLORS.light,
    ...theme.shadows.small,
  },
  transactionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  transactionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.md,
  },
  transactionInfo: {
    flex: 1,
  },
  transactionType: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 4,
  },
  transactionAmount: {
    fontSize: 18,
    fontWeight: '700',
    color: GOLD_COLORS.primary,
  },
  statusBadge: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  transactionDetails: {
    marginTop: theme.spacing.sm,
    paddingTop: theme.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.xs,
  },
  detailLabel: {
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors.text,
  },
  txHash: {
    fontFamily: 'monospace',
    fontSize: 12,
  },
});

export default AdminTransactions;

