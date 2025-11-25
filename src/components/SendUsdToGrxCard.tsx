import React, { useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, TextInput, Platform } from 'react-native';
import { theme } from '../styles/theme';
import { ORACLE_SNAPSHOT_CONFIG } from '../utils/constants';
import { computeGrxFromUsd, ComputeGrxFromUsdResult } from '../pricing/computeGrxFromUsd';
import { GrxPricingSnapshot } from '../hooks/useGrxPricing';

const COUNTRIES_TO_FX = ['INR', 'AED', 'RUB', 'CNY'] as const;

const resolveFxKey = (country?: string | null) => {
  if (!country) {
    return null;
  }
  const upper = country.toUpperCase();
  if (upper === 'AE') return 'USD_AED';
  if (upper === 'IN') return 'USD_INR';
  if (upper === 'RU') return 'USD_RUB';
  if (upper === 'CN') return 'USD_CNY';
  return null;
};

const formatNumber = (value: number, fractionDigits = 2) =>
  new Intl.NumberFormat('en-US', {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  }).format(value);

const allowedWindowMinutes = ORACLE_SNAPSHOT_CONFIG.allowedWindowMinutes || 10;

export interface SendUsdToGrxCardProps {
  pricing: GrxPricingSnapshot | null;
  userCountry?: string | null;
  feePct?: number;
  precision?: number;
  value: string;
  onChangeValue: (next: string) => void;
  onQuoteChange: (quote: ComputeGrxFromUsdResult | null) => void;
  snapshotValid: boolean;
}

const SendUsdToGrxCard: React.FC<SendUsdToGrxCardProps> = ({
  pricing,
  userCountry,
  feePct = 0.01,
  precision = 6,
  value,
  onChangeValue,
  onQuoteChange,
  snapshotValid,
}) => {
  const fxKey = resolveFxKey(userCountry);

  const quote = useMemo(() => {
    if (!pricing || !value?.length) {
      return null;
    }

    const desiredUsd = Number(value);
    if (!Number.isFinite(desiredUsd) || desiredUsd <= 0) {
      return null;
    }

    try {
      return computeGrxFromUsd({
        desiredUsd,
        goldPerGramUSD: pricing.goldPerGramUSD,
        feePct,
        precision,
        fxRate: fxKey ? Number(pricing.fx?.[fxKey] ?? null) : null,
      });
    } catch {
      return null;
    }
  }, [pricing, value, feePct, precision, fxKey]);

  useEffect(() => {
    onQuoteChange(quote);
  }, [quote, onQuoteChange]);

  const snapshotAgeLabel = useMemo(() => {
    if (!pricing?.lastUpdated) {
      return 'Unknown';
    }
    try {
      return new Date(pricing.lastUpdated).toLocaleString();
    } catch {
      return pricing.lastUpdated;
    }
  }, [pricing]);

  const snapshotWarning =
    pricing && snapshotValid === false
      ? `Snapshot older than ${allowedWindowMinutes} minutes.`
      : null;

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <Text style={styles.cardTitle}>Send by USD amount</Text>
        <View style={styles.snapshotBadge}>
          <Text style={styles.snapshotBadgeText}>Using signed snapshot</Text>
        </View>
      </View>

      <Text style={styles.inputLabel}>Desired USD payout</Text>
      <TextInput
        value={value}
        keyboardType={Platform.OS === 'web' ? 'numeric' : 'decimal-pad'}
        placeholder="0.00"
        style={styles.input}
        onChangeText={onChangeValue}
      />

      {snapshotWarning ? (
        <Text style={styles.warningText}>{snapshotWarning}</Text>
      ) : null}

      {quote ? (
        <View style={styles.metrics}>
          <View style={styles.metricRow}>
            <Text style={styles.metricLabel}>GRX required</Text>
            <Text style={styles.metricValue}>
              {formatNumber(quote.finalGrams, precision)}
            </Text>
          </View>
          <View style={styles.metricRow}>
            <Text style={styles.metricLabel}>Amount (wei)</Text>
            <Text style={styles.metricValueMono}>{quote.amountWei}</Text>
          </View>
          <View style={styles.metricRow}>
            <Text style={styles.metricLabel}>USD value</Text>
            <Text style={styles.metricValue}>${formatNumber(quote.usdValue)}</Text>
          </View>
          {quote.localFiatValue !== null && (
            <View style={styles.metricRow}>
              <Text style={styles.metricLabel}>
                Local ({fxKey?.replace('USD_', '')})
              </Text>
              <Text style={styles.metricValue}>
                {formatNumber(quote.localFiatValue)}
              </Text>
            </View>
          )}
        </View>
      ) : (
        <Text style={styles.helperText}>
          Enter a USD amount to preview the GRX required (includes fees).
        </Text>
      )}

      <View style={styles.snapshotMeta}>
        <Text style={styles.snapshotMetaLabel}>Snapshot ID</Text>
        <Text style={styles.snapshotMetaValue}>{pricing?.id || 'Unknown'}</Text>
      </View>
      <View style={styles.snapshotMeta}>
        <Text style={styles.snapshotMetaLabel}>Timestamp</Text>
        <Text style={styles.snapshotMetaValue}>{snapshotAgeLabel}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
    ...theme.shadows.small,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.text,
  },
  snapshotBadge: {
    backgroundColor: theme.colors.primaryLight,
    borderRadius: theme.borderRadius.sm,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 4,
  },
  snapshotBadgeText: {
    color: theme.colors.primary,
    fontSize: 12,
    fontWeight: '600',
  },
  inputLabel: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.xs,
  },
  input: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    fontSize: 18,
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  helperText: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.md,
  },
  warningText: {
    color: theme.colors.warning,
    marginBottom: theme.spacing.sm,
    fontSize: 12,
  },
  metrics: {
    gap: theme.spacing.xs,
    marginBottom: theme.spacing.md,
  },
  metricRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  metricLabel: {
    fontSize: 13,
    color: theme.colors.textSecondary,
  },
  metricValue: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
  },
  metricValueMono: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    fontFamily: Platform.OS === 'web' ? 'monospace' : undefined,
    maxWidth: 220,
  },
  snapshotMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: theme.spacing.xs,
  },
  snapshotMetaLabel: {
    fontSize: 12,
    color: theme.colors.textSecondary,
  },
  snapshotMetaValue: {
    fontSize: 12,
    color: theme.colors.text,
    fontWeight: '500',
  },
});

export default SendUsdToGrxCard;


