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
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { validateMnemonicPhrase } from '../services/walletService';
import {
  storeMnemonic,
  storeWalletAddress,
  getPINHash,
} from '../services/storageService';
import { importBackendWallet } from '../services/backendWalletService';
import { getCosmosAddress } from '../services/grxChainService';
import { useWallet } from '../context/WalletContext';
import { theme } from '../styles/theme';

// Gold color constants
const GOLD_COLORS = {
  primary: '#D4AF37',
  light: '#F4E4BC',
  dark: '#B8941F',
  accent: '#FFD700',
};

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
      // Derive Cosmos address from mnemonic
      const cosmosAddress = await getCosmosAddress(trimmedMnemonic);

      // Store securely
      await storeMnemonic(trimmedMnemonic);
      await storeWalletAddress(cosmosAddress);

      // Best-effort: register imported wallet with backend if available
      try {
        await importBackendWallet({
          address: cosmosAddress,
          network: 'GRX',
          isTestnet: false,
        });
      } catch (backendError) {
        console.warn('Backend wallet registration failed (import):', backendError?.message);
      }

      // Initialize wallet context
      initializeWallet(cosmosAddress);

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
      <View style={styles.iconHeader}>
        <View style={styles.iconContainer}>
          <MaterialIcons name="download" size={48} color={GOLD_COLORS.primary} />
        </View>
      </View>
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
        <View style={styles.warningHeader}>
          <Ionicons name="shield-checkmark-outline" size={20} color="#856404" />
          <Text style={styles.warningTitle}> Security Notice</Text>
        </View>
        <Text style={styles.warningText}>
          Never share your recovery phrase with anyone. This app stores your
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
  input: {
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1.5,
    borderColor: GOLD_COLORS.light,
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

export default ImportWalletScreen;

