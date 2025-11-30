import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Clipboard,
  Alert,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import QRCode from 'react-native-qrcode-svg';
import { useWallet } from '../context/WalletContext';
import { theme } from '../styles/theme';

// Gold color constants
const GOLD_COLORS = {
  primary: '#D4AF37',
  light: '#F4E4BC',
  dark: '#B8941F',
  accent: '#FFD700',
};

const ReceiveScreen = () => {
  const { walletAddress } = useWallet();

  const handleCopyAddress = () => {
    Clipboard.setString(walletAddress);
    Alert.alert('Copied', 'Wallet address copied to clipboard');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.title}>Receive</Text>
        <Text style={styles.description}>
          Share this address to receive {walletAddress ? 'tokens' : ''}
        </Text>

        {walletAddress && (
          <>
            <View style={styles.qrContainer}>
              <QRCode
                value={walletAddress}
                size={250}
                backgroundColor={theme.colors.surface}
                color={theme.colors.text}
              />
            </View>

            <View style={styles.addressContainer}>
              <View style={styles.addressHeader}>
                <MaterialIcons name="account-balance-wallet" size={20} color={GOLD_COLORS.primary} />
                <Text style={styles.addressLabel}>Your Wallet Address</Text>
              </View>
              <Text style={styles.addressText} selectable>
                {walletAddress}
              </Text>
            </View>

            <TouchableOpacity
              style={styles.copyButton}
              onPress={handleCopyAddress}
            >
              <Ionicons name="copy-outline" size={20} color="#FFFFFF" />
              <Text style={styles.copyButtonText}> Copy Address</Text>
            </TouchableOpacity>

            <View style={styles.warningBox}>
              <View style={styles.warningHeader}>
                <Ionicons name="warning-outline" size={20} color="#856404" />
                <Text style={styles.warningTitle}> Important Notice</Text>
              </View>
              <Text style={styles.warningText}>
                Only send {walletAddress ? 'tokens' : ''} to this address.
                Sending other assets may result in permanent loss.
              </Text>
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: theme.spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  description: {
    fontSize: 16,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginBottom: theme.spacing.xl,
  },
  qrContainer: {
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.lg,
    borderRadius: theme.borderRadius.lg,
    marginBottom: theme.spacing.xl,
    borderWidth: 2,
    borderColor: GOLD_COLORS.primary,
    ...theme.shadows.medium,
  },
  addressContainer: {
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    width: '100%',
    marginBottom: theme.spacing.md,
    borderWidth: 1.5,
    borderColor: GOLD_COLORS.light,
    ...theme.shadows.small,
  },
  addressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.xs,
  },
  addressLabel: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginLeft: theme.spacing.xs,
    fontWeight: '600',
  },
  addressText: {
    fontSize: 14,
    color: theme.colors.text,
    fontWeight: '500',
    textAlign: 'center',
  },
  copyButton: {
    backgroundColor: GOLD_COLORS.primary,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.xl,
    borderRadius: theme.borderRadius.lg,
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.lg,
    ...theme.shadows.medium,
  },
  copyButtonText: {
    color: theme.colors.secondary,
    fontSize: 18,
    fontWeight: '600',
  },
  warningBox: {
    backgroundColor: '#FFF3CD',
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    width: '100%',
    borderWidth: 1.5,
    borderColor: GOLD_COLORS.primary,
  },
  warningHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.xs,
    justifyContent: 'center',
  },
  warningTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#856404',
  },
  warningText: {
    fontSize: 14,
    color: '#856404',
    lineHeight: 20,
    textAlign: 'center',
  },
});

export default ReceiveScreen;

