import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { generateMnemonic } from '../services/walletService';
import { theme } from '../styles/theme';

// Gold color constants
const GOLD_COLORS = {
  primary: '#D4AF37',
  light: '#F4E4BC',
  dark: '#B8941F',
  accent: '#FFD700',
};

const CreateWalletScreen = ({ navigation }) => {
  const [loading, setLoading] = useState(false);

  const handleCreateWallet = async () => {
    setLoading(true);
    try {
      const mnemonic = generateMnemonic();
      navigation.navigate('MnemonicDisplay', { mnemonic });
    } catch (error) {
      Alert.alert('Error', 'Failed to generate wallet. Please try again.');
      console.error('Error generating wallet:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.iconHeader}>
          <View style={styles.iconContainer}>
            <MaterialIcons name="account-balance-wallet" size={48} color={GOLD_COLORS.primary} />
          </View>
        </View>
        <Text style={styles.title}>Create New Wallet</Text>
        <Text style={styles.description}>
          We'll generate a secure 12-word recovery phrase for you. Make sure to
          write it down and keep it safe. You'll need it to restore your wallet.
        </Text>

        <View style={styles.warningBox}>
          <View style={styles.warningHeader}>
            <MaterialIcons name="security" size={20} color="#856404" />
            <Text style={styles.warningTitle}> Security Notice</Text>
          </View>
          <Text style={styles.warningText}>
            Never share your recovery phrase with anyone. Anyone with access
            to it can control your wallet.
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleCreateWallet}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={theme.colors.secondary} />
          ) : (
            <Text style={styles.buttonText}>Generate Recovery Phrase</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    padding: theme.spacing.lg,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    color: theme.colors.textSecondary,
    lineHeight: 24,
    marginBottom: theme.spacing.lg,
    textAlign: 'center',
  },
  iconHeader: {
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: GOLD_COLORS.light,
    justifyContent: 'center',
    alignItems: 'center',
  },
  warningBox: {
    backgroundColor: '#FFF3CD',
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing.xl,
    borderWidth: 1.5,
    borderColor: GOLD_COLORS.primary,
  },
  warningHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.xs,
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
  },
  button: {
    backgroundColor: GOLD_COLORS.primary,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    borderRadius: theme.borderRadius.lg,
    alignItems: 'center',
    ...theme.shadows.medium,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: theme.colors.secondary,
    fontSize: 18,
    fontWeight: '600',
  },
});

export default CreateWalletScreen;

