import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Dimensions } from 'react-native';
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

// Dummy user data
const DUMMY_USERS = [
  {
    id: '1',
    address: '0x1234567890abcdef1234567890abcdef12345678',
    kycStatus: 'VERIFIED',
    walletType: 'Self-custody',
    registrationDate: '2024-01-15',
    totalTransactions: 45,
    totalVolume: '5000.00',
  },
  {
    id: '2',
    address: '0xabcdef1234567890abcdef1234567890abcdef12',
    kycStatus: 'PENDING',
    walletType: 'Custodial',
    registrationDate: '2024-02-20',
    totalTransactions: 12,
    totalVolume: '1200.00',
  },
  {
    id: '3',
    address: '0x9876543210fedcba9876543210fedcba98765432',
    kycStatus: 'REJECTED',
    walletType: 'Self-custody',
    registrationDate: '2024-01-10',
    totalTransactions: 8,
    totalVolume: '800.00',
  },
];

const getKycStatusColor = (status) => {
  switch (status) {
    case 'VERIFIED':
      return theme.colors.success;
    case 'PENDING':
      return theme.colors.warning;
    case 'REJECTED':
      return theme.colors.error;
    default:
      return theme.colors.textSecondary;
  }
};

const AdminUsers = () => {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredUsers = DUMMY_USERS.filter(
    (user) =>
      user.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.kycStatus.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.title}>User Management</Text>
        <Text style={styles.subtitle}>Manage users, KYC status, and wallet information</Text>
      </View>

      <View style={styles.searchContainer}>
        <Ionicons name="search-outline" size={20} color={theme.colors.textSecondary} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by address or KYC status..."
          placeholderTextColor={theme.colors.textSecondary}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statBox}>
          <Text style={styles.statValue}>{DUMMY_USERS.length}</Text>
          <Text style={styles.statLabel}>Total Users</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statValue}>
            {DUMMY_USERS.filter((u) => u.kycStatus === 'VERIFIED').length}
          </Text>
          <Text style={styles.statLabel}>Verified</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statValue}>
            {DUMMY_USERS.filter((u) => u.kycStatus === 'PENDING').length}
          </Text>
          <Text style={styles.statLabel}>Pending</Text>
        </View>
      </View>

      {filteredUsers.map((user) => (
        <View key={user.id} style={styles.userCard}>
          <View style={styles.userHeader}>
            <View style={styles.userInfo}>
              <Text style={styles.userAddress}>{formatAddress(user.address)}</Text>
              <View style={styles.userMeta}>
                <View style={[styles.statusBadge, { backgroundColor: getKycStatusColor(user.kycStatus) + '20' }]}>
                  <Text style={[styles.statusText, { color: getKycStatusColor(user.kycStatus) }]}>
                    {user.kycStatus}
                  </Text>
                </View>
                <Text style={styles.walletType}>{user.walletType}</Text>
              </View>
            </View>
            <TouchableOpacity style={styles.actionButton}>
              <Ionicons name="chevron-forward" size={20} color={GOLD_COLORS.primary} />
            </TouchableOpacity>
          </View>
          <View style={styles.userDetails}>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Registered:</Text>
              <Text style={styles.detailValue}>{user.registrationDate}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Transactions:</Text>
              <Text style={styles.detailValue}>{user.totalTransactions}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Volume:</Text>
              <Text style={styles.detailValue}>{user.totalVolume} GRX</Text>
            </View>
          </View>
          <View style={styles.actionRow}>
            {user.kycStatus === 'PENDING' && (
              <>
                <TouchableOpacity style={[styles.actionBtn, styles.approveBtn]}>
                  <Ionicons name="checkmark-circle" size={18} color={theme.colors.success} />
                  <Text style={[styles.actionBtnText, { color: theme.colors.success }]}>Approve</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.actionBtn, styles.rejectBtn]}>
                  <Ionicons name="close-circle" size={18} color={theme.colors.error} />
                  <Text style={[styles.actionBtnText, { color: theme.colors.error }]}>Reject</Text>
                </TouchableOpacity>
              </>
            )}
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
    padding:  theme.spacing.lg ,
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
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: theme.spacing.md,
    marginBottom: theme.spacing.lg,
    borderWidth: 1.5,
    borderColor: GOLD_COLORS.light,
  },
  searchIcon: {
    marginRight: theme.spacing.sm,
  },
  searchInput: {
    flex: 1,
    paddingVertical: theme.spacing.md,
    fontSize: 16,
    color: theme.colors.text,
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
  userCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    borderWidth: 1.5,
    borderColor: GOLD_COLORS.light,
    ...theme.shadows.small,
  },
  userHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  userInfo: {
    flex: 1,
  },
  userAddress: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
    fontFamily: 'monospace',
  },
  userMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
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
  walletType: {
    fontSize: 12,
    color: theme.colors.textSecondary,
  },
  actionButton: {
    padding: theme.spacing.xs,
  },
  userDetails: {
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
    fontWeight: '600',
    color: theme.colors.text,
  },
  actionRow: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    marginTop: theme.spacing.sm,
    paddingTop: theme.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1.5,
    gap: theme.spacing.xs,
  },
  approveBtn: {
    borderColor: theme.colors.success,
    backgroundColor: theme.colors.success + '10',
  },
  rejectBtn: {
    borderColor: theme.colors.error,
    backgroundColor: theme.colors.error + '10',
  },
  actionBtnText: {
    fontSize: 14,
    fontWeight: '600',
  },
});

export default AdminUsers;

