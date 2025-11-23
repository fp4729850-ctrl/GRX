import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { validateMnemonicPhrase, deriveWalletFromMnemonic } from '../services/walletService';
import {
  storeMnemonic,
  storePrivateKey,
  storeWalletAddress,
  getPINHash,
} from '../services/storageService';
import { useWallet } from '../context/WalletContext';
import { theme } from '../styles/theme';

const ImportWalletScreen = ({ navigation }) => {
  const { initializeWallet } = useWallet();
  const [mnemonic, setMnemonic] = useState('');
  const [loading, setLoading] = useState(false);

  const handleImport = async () => {
    const trimmedMnemonic = mnemonic.trim();

    if (!trimmedMnemonic) {
      Alert.alert('Error', 'Please enter your recovery phrase');
      return;
    }

    if (!validateMnemonicPhrase(trimmedMnemonic)) {
      Alert.alert(
        'Invalid Phrase',
        'The recovery phrase you entered is invalid. Please check and try again.'
      );
      return;
    }

    setLoading(true);
    try {
      // Derive wallet from mnemonic
      const wallet = await deriveWalletFromMnemonic(trimmedMnemonic);

      // Store securely
      await storeMnemonic(trimmedMnemonic);
      await storePrivateKey(wallet.privateKey);
      await storeWalletAddress(wallet.address);

      // Initialize wallet context
      initializeWallet(wallet.address, wallet.privateKey);

      // Check if PIN exists, if not, set it up
      const pinHash = await getPINHash();
      if (!pinHash) {
        navigation.navigate('PINSetup', {
          onComplete: () => {
            navigation.reset({
              index: 0,
              routes: [{ name: 'MainTabs' }],
            });
          },
        });
      } else {
        navigation.reset({
          index: 0,
          routes: [{ name: 'MainTabs' }],
        });
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to import wallet. Please try again.');
      console.error('Error importing wallet:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Import Wallet</Text>
      <Text style={styles.description}>
        Enter your 12-word recovery phrase to restore your wallet. Make sure to
        enter the words in the correct order.
      </Text>

      <TextInput
        style={styles.input}
        value={mnemonic}
        onChangeText={setMnemonic}
        placeholder="Enter your 12-word recovery phrase"
        multiline
        numberOfLines={4}
        autoCapitalize="none"
        autoCorrect={false}
        textAlignVertical="top"
      />

      <View style={styles.warningBox}>
        <Text style={styles.warningText}>
          ⚠️ Never share your recovery phrase with anyone. This app stores your
          data locally and never uploads it to any server.
        </Text>
      </View>

      <TouchableOpacity
        style={[styles.button, loading && styles.buttonDisabled]}
        onPress={handleImport}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color={theme.colors.secondary} />
        ) : (
          <Text style={styles.buttonText}>Import Wallet</Text>
        )}
      </TouchableOpacity>
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
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    color: theme.colors.textSecondary,
    lineHeight: 24,
    marginBottom: theme.spacing.lg,
    textAlign: 'center',
  },
  input: {
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    fontSize: 16,
    color: theme.colors.text,
    minHeight: 120,
    marginBottom: theme.spacing.md,
  },
  warningBox: {
    backgroundColor: '#FFF3CD',
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing.lg,
    borderWidth: 1,
    borderColor: '#FFC107',
  },
  warningText: {
    fontSize: 14,
    color: '#856404',
    lineHeight: 20,
  },
  button: {
    backgroundColor: theme.colors.primary,
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

export default ImportWalletScreen;

