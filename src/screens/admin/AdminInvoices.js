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

// Dummy invoice data
const DUMMY_INVOICES = [
  {
    id: 'INV-001',
    amount: '1000.5000',
    status: 'SETTLED',
    userAddress: '0x1234567890abcdef1234567890abcdef12345678',
    timestamp: '2024-03-15 10:00:00',
    settlementAmount: '75500.00',
    settlementCurrency: 'USD',
    txHash: '0xabc123...def456',
    network: 'Ethereum',
  },
  {
    id: 'INV-002',
    amount: '500.2500',
    status: 'AWAITING_REDEEM',
    userAddress: '0xabcdef1234567890abcdef1234567890abcdef12',
    timestamp: '2024-03-14 15:30:00',
    settlementAmount: null,
    settlementCurrency: null,
    txHash: null,
    network: 'BSC',
  },
  {
    id: 'INV-003',
    amount: '250.7500',
    status: 'BURN_PENDING',
    userAddress: '0x9876543210fedcba9876543210fedcba98765432',
    timestamp: '2024-03-14 12:00:00',
    settlementAmount: null,
    settlementCurrency: null,
    txHash: null,
    network: 'Ethereum',
  },
];

const getStatusColor = (status) => {
  switch (status) {
    case 'SETTLED':
      return theme.colors.success;
    case 'AWAITING_REDEEM':
      return theme.colors.warning;
    case 'BURN_PENDING':
      return theme.colors.primaryDark;
    default:
      return theme.colors.textSecondary;
  }
};

const AdminInvoices = () => {
  const [filterStatus, setFilterStatus] = useState('all');

  const filteredInvoices = DUMMY_INVOICES.filter(
    (inv) => filterStatus === 'all' || inv.status === filterStatus
  );

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.title}>Invoice Management</Text>
        <Text style={styles.subtitle}>Manage all platform invoices and settlements</Text>
      </View>

      <View style={styles.filterRow}>
        {['all', 'SETTLED', 'AWAITING_REDEEM', 'BURN_PENDING'].map((status) => (
          <TouchableOpacity
            key={status}
            style={[
              styles.filterButton,
              filterStatus === status && styles.filterButtonActive,
            ]}
            onPress={() => setFilterStatus(status)}
          >
            <Text
              style={[
                styles.filterButtonText,
                filterStatus === status && styles.filterButtonTextActive,
              ]}
            >
              {status === 'all' ? 'All' : status.replace('_', ' ')}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statBox}>
          <Text style={styles.statValue}>{DUMMY_INVOICES.length}</Text>
          <Text style={styles.statLabel}>Total Invoices</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statValue}>
            {DUMMY_INVOICES.filter((inv) => inv.status === 'SETTLED').length}
          </Text>
          <Text style={styles.statLabel}>Settled</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statValue}>
            {DUMMY_INVOICES.filter((inv) => inv.status === 'AWAITING_REDEEM').length}
          </Text>
          <Text style={styles.statLabel}>Pending</Text>
        </View>
      </View>

      {filteredInvoices.map((invoice) => (
        <View key={invoice.id} style={styles.invoiceCard}>
          <View style={styles.invoiceHeader}>
            <View style={styles.invoiceInfo}>
              <Text style={styles.invoiceId}>{invoice.id}</Text>
              <View style={[styles.statusBadge, { backgroundColor: getStatusColor(invoice.status) + '20' }]}>
                <Text style={[styles.statusText, { color: getStatusColor(invoice.status) }]}>
                  {invoice.status.replace('_', ' ')}
                </Text>
              </View>
            </View>
            <Text style={styles.invoiceAmount}>{invoice.amount} GRX</Text>
          </View>
          <View style={styles.invoiceDetails}>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>User:</Text>
              <Text style={styles.detailValue}>{formatAddress(invoice.userAddress)}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Network:</Text>
              <Text style={styles.detailValue}>{invoice.network}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Date:</Text>
              <Text style={styles.detailValue}>{invoice.timestamp}</Text>
            </View>
            {invoice.settlementAmount && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Settlement:</Text>
                <Text style={styles.detailValue}>
                  {invoice.settlementAmount} {invoice.settlementCurrency}
                </Text>
              </View>
            )}
            {invoice.txHash && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Tx Hash:</Text>
                <Text style={[styles.detailValue, styles.txHash]}>{invoice.txHash}</Text>
              </View>
            )}
          </View>
          {invoice.status === 'AWAITING_REDEEM' && (
            <TouchableOpacity style={styles.actionButton}>
              <MaterialIcons name="receipt-long" size={18} color={GOLD_COLORS.primary} />
              <Text style={styles.actionButtonText}>Process Settlement</Text>
            </TouchableOpacity>
          )}
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
  statsRow: {
    flexDirection: Dimensions.get('window').width < 768 ? 'column' : 'row',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.lg,
    gap: Dimensions.get('window').width < 768 ? theme.spacing.sm : 0,
  },
  statBox: {
    flex: 1,
    backgroundColor: GOLD_COLORS.light,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    alignItems: 'center',
    marginHorizontal: Dimensions.get('window').width < 768 ? 0 : theme.spacing.xs,
    marginBottom: Dimensions.get('window').width < 768 ? theme.spacing.sm : 0,
    borderWidth: 1.5,
    borderColor: GOLD_COLORS.primary,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: GOLD_COLORS.dark,
    marginBottom: theme.spacing.xs,
  },
  statLabel: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    fontWeight: '600',
  },
  invoiceCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    borderWidth: 1.5,
    borderColor: GOLD_COLORS.light,
    ...theme.shadows.small,
  },
  invoiceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  invoiceInfo: {
    flex: 1,
  },
  invoiceId: {
    fontSize: 16,
    fontWeight: '700',
    color: GOLD_COLORS.primary,
    marginBottom: theme.spacing.xs,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  invoiceAmount: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.colors.text,
  },
  invoiceDetails: {
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
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: theme.spacing.sm,
    paddingVertical: theme.spacing.sm,
    backgroundColor: GOLD_COLORS.light,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1.5,
    borderColor: GOLD_COLORS.primary,
    gap: theme.spacing.xs,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: GOLD_COLORS.dark,
  },
});

export default AdminInvoices;

