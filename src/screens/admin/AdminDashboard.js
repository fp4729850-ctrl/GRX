import React from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions, Platform } from 'react-native';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { theme } from '../../styles/theme';

// Gold color constants
const GOLD_COLORS = {
  primary: '#D4AF37',
  light: '#F4E4BC',
  dark: '#B8941F',
  accent: '#FFD700',
};

// Dummy data for admin dashboard
const DUMMY_STATS = {
  totalUsers: 1250,
  totalGRXSupply: '1250000.5000',
  totalTransactions: 8750,
  activeInvoices: 45,
  totalVolumeUSD: '94500000.00',
  oracleStatus: 'Active',
  recentActivity: [
    { type: 'mint', amount: '1000 GRX', user: '0x1234...5678', time: '2 mins ago' },
    { type: 'burn', amount: '500 GRX', user: '0xabcd...efgh', time: '15 mins ago' },
    { type: 'invoice', amount: '250 GRX', user: '0x9876...5432', time: '1 hour ago' },
  ],
};

const StatCard = ({ icon, label, value, color = GOLD_COLORS.primary }) => (
  <View style={styles.statCard}>
    <View style={[styles.statIconContainer, { backgroundColor: color + '20' }]}>
      <MaterialIcons name={icon} size={32} color={color} />
    </View>
    <Text style={styles.statValue}>{value}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </View>
);

const AdminDashboard = () => {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.title}>Platform Overview</Text>
        <Text style={styles.subtitle}>Real-time platform statistics and activity</Text>
      </View>

      <View style={styles.statsGrid}>
        <StatCard
          icon="people"
          label="Total Users"
          value={DUMMY_STATS.totalUsers.toLocaleString()}
        />
        <StatCard
          icon="monetization-on"
          label="GRX Supply"
          value={DUMMY_STATS.totalGRXSupply}
        />
        <StatCard
          icon="swap-horiz"
          label="Transactions"
          value={DUMMY_STATS.totalTransactions.toLocaleString()}
        />
        <StatCard
          icon="receipt-long"
          label="Active Invoices"
          value={DUMMY_STATS.activeInvoices}
          color={theme.colors.warning}
        />
        <StatCard
          icon="attach-money"
          label="Total Volume"
          value={`$${parseFloat(DUMMY_STATS.totalVolumeUSD).toLocaleString()}`}
          color={theme.colors.success}
        />
        <StatCard
          icon="insights"
          label="Oracle Status"
          value={DUMMY_STATS.oracleStatus}
          color={theme.colors.success}
        />
      </View>

      <View style={styles.activityCard}>
        <View style={styles.cardHeader}>
          <MaterialIcons name="history" size={24} color={GOLD_COLORS.primary} />
          <Text style={styles.cardTitle}>Recent Activity</Text>
        </View>
        {DUMMY_STATS.recentActivity.map((activity, index) => (
          <View key={index} style={styles.activityItem}>
            <View style={[styles.activityIcon, { backgroundColor: GOLD_COLORS.light }]}>
              <Ionicons
                name={
                  activity.type === 'mint'
                    ? 'add-circle'
                    : activity.type === 'burn'
                    ? 'flame'
                    : 'receipt'
                }
                size={20}
                color={GOLD_COLORS.primary}
              />
            </View>
            <View style={styles.activityContent}>
              <Text style={styles.activityText}>
                <Text style={styles.activityType}>
                  {activity.type === 'mint'
                    ? 'Mint'
                    : activity.type === 'burn'
                    ? 'Burn'
                    : 'Invoice'}{' '}
                </Text>
                {activity.amount} by {activity.user}
              </Text>
              <Text style={styles.activityTime}>{activity.time}</Text>
            </View>
          </View>
        ))}
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
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.lg,
  },
  statCard: {
    width: Dimensions.get('window').width < 768 ? '100%' : '48%',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: GOLD_COLORS.light,
    ...theme.shadows.small,
  },
  statIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  statLabel: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
  activityCard: {
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
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  activityIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.md,
  },
  activityContent: {
    flex: 1,
  },
  activityText: {
    fontSize: 14,
    color: theme.colors.text,
    marginBottom: 4,
  },
  activityType: {
    fontWeight: '600',
    color: GOLD_COLORS.primary,
  },
  activityTime: {
    fontSize: 12,
    color: theme.colors.textSecondary,
  },
});

export default AdminDashboard;

