import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Clipboard,
  Alert,
} from 'react-native';
import { useWallet } from '../context/WalletContext';
import BalanceCard from '../components/BalanceCard';
import NetworkToggle from '../components/NetworkToggle';
import { formatAddress } from '../utils/validation';
import { theme } from '../styles/theme';

const DashboardScreen = ({ navigation }) => {
  const {
    walletAddress,
    currentNetwork,
    isTestnet,
    ethBalance,
    usdtBalance,
    ethBalanceUSD,
    usdtBalanceUSD,
    loading,
    refreshBalances,
    refreshPrices,
    updateNetwork,
  } = useWallet();

  useEffect(() => {
    refreshBalances();
    refreshPrices();
  }, []);

  const handleRefresh = async () => {
    await refreshBalances();
    await refreshPrices();
  };

  const handleCopyAddress = () => {
    Clipboard.setString(walletAddress);
    Alert.alert('Copied', 'Wallet address copied to clipboard');
  };

  const handleNetworkToggle = async (network, testnet) => {
    updateNetwork(network, testnet);
  };

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={loading} onRefresh={handleRefresh} />
      }
    >
      <View style={styles.content}>
        {/* Wallet Address */}
        <View style={styles.addressContainer}>
          <Text style={styles.addressLabel}>Wallet Address</Text>
          <View style={styles.addressRow}>
            <Text style={styles.addressText}>
              {formatAddress(walletAddress)}
            </Text>
            <TouchableOpacity
              style={styles.copyButton}
              onPress={handleCopyAddress}
            >
              <Text style={styles.copyButtonText}>Copy</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Network Toggle */}
        <NetworkToggle
          currentNetwork={currentNetwork}
          isTestnet={isTestnet}
          onToggle={handleNetworkToggle}
        />

        {/* Balance Cards */}
        <BalanceCard
          symbol={currentNetwork === 'ETHEREUM' ? 'ETH' : 'BNB'}
          balance={ethBalance}
          usdBalance={ethBalanceUSD}
          icon="💰"
        />
        <BalanceCard
          symbol="USDT"
          balance={usdtBalance}
          usdBalance={usdtBalanceUSD}
          icon="💵"
        />

        {/* Action Buttons */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => navigation.navigate('Send')}
          >
            <Text style={styles.primaryButtonText}>Send</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => navigation.navigate('Receive')}
          >
            <Text style={styles.secondaryButtonText}>Receive</Text>
          </TouchableOpacity>
        </View>

        {/* Recent Transactions Placeholder */}
        <View style={styles.transactionsContainer}>
          <Text style={styles.sectionTitle}>Recent Transactions</Text>
          <Text style={styles.emptyText}>No transactions yet</Text>
        </View>
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
    padding: theme.spacing.lg,
  },
  addressContainer: {
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing.md,
    ...theme.shadows.small,
  },
  addressLabel: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.xs,
  },
  addressRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  addressText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
    flex: 1,
  },
  copyButton: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
  },
  copyButtonText: {
    color: theme.colors.primary,
    fontSize: 14,
    fontWeight: '600',
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: theme.spacing.md,
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.lg,
  },
  primaryButton: {
    flex: 1,
    backgroundColor: theme.colors.primary,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    alignItems: 'center',
    ...theme.shadows.medium,
  },
  primaryButtonText: {
    color: theme.colors.secondary,
    fontSize: 18,
    fontWeight: '600',
  },
  secondaryButton: {
    flex: 1,
    backgroundColor: theme.colors.secondary,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: theme.colors.primary,
    ...theme.shadows.small,
  },
  secondaryButtonText: {
    color: theme.colors.primary,
    fontSize: 18,
    fontWeight: '600',
  },
  transactionsContainer: {
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    ...theme.shadows.small,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  emptyText: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    paddingVertical: theme.spacing.lg,
  },
});

export default DashboardScreen;

