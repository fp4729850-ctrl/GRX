import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { theme } from '../styles/theme';

const OracleSnapshotCard = ({ snapshot, allowedWindowMinutes = 10 }) => {
  if (!snapshot) {
    return null;
  }

  const snapshotTime = new Date(snapshot.timestamp);
  const now = new Date();
  const ageMinutes = (now - snapshotTime) / (1000 * 60);
  const isStale = ageMinutes > allowedWindowMinutes;

  const formatTimestamp = (timestamp) => {
    try {
      const date = new Date(timestamp);
      return date.toLocaleString();
    } catch {
      return 'Unknown';
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.badge}>Using signed snapshot for settlement</Text>
        {isStale && (
          <View style={styles.warningBadge}>
            <Text style={styles.warningText}>⚠️ Snapshot too old</Text>
          </View>
        )}
      </View>

      <View style={styles.content}>
        <View style={styles.priceRow}>
          <Text style={styles.label}>Gold Price (USD/g)</Text>
          <Text style={styles.value}>
            ${Number(snapshot.goldPerGramUSD || 0).toFixed(2)}
          </Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.fxSection}>
          <Text style={styles.fxTitle}>FX Rates (USD →)</Text>
          <View style={styles.fxGrid}>
            {['INR', 'AED', 'RUB', 'CNY'].map((currency) => (
              <View key={currency} style={styles.fxItem}>
                <Text style={styles.fxLabel}>{currency}</Text>
                <Text style={styles.fxValue}>
                  {snapshot.fx?.[currency]
                    ? Number(snapshot.fx[currency]).toFixed(4)
                    : '--'}
                </Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.metaRow}>
          <Text style={styles.metaLabel}>Snapshot ID</Text>
          <Text style={styles.metaValue} numberOfLines={1}>
            {snapshot.id || 'N/A'}
          </Text>
        </View>

        <View style={styles.metaRow}>
          <Text style={styles.metaLabel}>Timestamp</Text>
          <Text style={styles.metaValue}>{formatTimestamp(snapshot.timestamp)}</Text>
        </View>

        {snapshot.sources && snapshot.sources.length > 0 && (
          <View style={styles.metaRow}>
            <Text style={styles.metaLabel}>Sources</Text>
            <Text style={styles.metaValue}>{snapshot.sources.join(', ')}</Text>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    marginVertical: theme.spacing.sm,
    ...theme.shadows.small,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  badge: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.primary,
    backgroundColor: theme.colors.primaryLight,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 4,
    borderRadius: theme.borderRadius.sm,
  },
  warningBadge: {
    backgroundColor: theme.colors.warning,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 4,
    borderRadius: theme.borderRadius.sm,
  },
  warningText: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.text,
  },
  content: {
    gap: theme.spacing.sm,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.textSecondary,
  },
  value: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.text,
  },
  divider: {
    height: 1,
    backgroundColor: theme.colors.border,
    marginVertical: theme.spacing.xs,
  },
  fxSection: {
    gap: theme.spacing.xs,
  },
  fxTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.xs,
  },
  fxGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  fxItem: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: theme.colors.background,
    padding: theme.spacing.sm,
    borderRadius: theme.borderRadius.sm,
  },
  fxLabel: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginBottom: 4,
  },
  fxValue: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: theme.spacing.xs,
  },
  metaLabel: {
    fontSize: 12,
    color: theme.colors.textSecondary,
  },
  metaValue: {
    fontSize: 12,
    color: theme.colors.text,
    fontWeight: '500',
    flex: 1,
    textAlign: 'right',
  },
});

export default OracleSnapshotCard;

