import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Switch,
  ActivityIndicator,
  Clipboard,
  Platform,
} from 'react-native';
import * as LocalAuthentication from 'expo-local-authentication';
import { useWallet } from '../context/WalletContext';
import {
  getMnemonic,
  getPINHash,
  getBiometricEnabled,
  setBiometricEnabled,
  clearAllData,
} from '../services/storageService';
import { theme } from '../styles/theme';

const isWeb = Platform.OS === 'web';

const SettingsScreen = ({ navigation }) => {
  const {
    isTestnet,
    currentNetwork,
    updateNetwork,
    clearWallet,
    custodialMode,
    updateCustodialMode,
  } = useWallet();
  const [biometricEnabled, setBiometricEnabledState] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    const enabled = await getBiometricEnabled();
    setBiometricEnabledState(enabled);
  };

  const handleExportMnemonic = async () => {
    Alert.alert(
      'Security Warning',
      'Exporting your recovery phrase will display it on screen. Make sure no one can see your screen. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Continue',
          style: 'destructive',
          onPress: async () => {
            // Verify PIN or biometric first
            try {
              if (!isWeb) {
                const hasHardware = await LocalAuthentication.hasHardwareAsync();
                const isEnrolled = await LocalAuthentication.isEnrolledAsync();

                if (hasHardware && isEnrolled) {
                  const result = await LocalAuthentication.authenticateAsync({
                    promptMessage: 'Verify to export recovery phrase',
                  });
                  if (!result.success) return;
                  showMnemonic();
                  return;
                }
              }
              
              // Fallback to PIN (or use PIN on web)
              Alert.prompt('Enter PIN', 'Enter your PIN to continue', [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'OK',
                  onPress: async (pin) => {
                    const storedPIN = await getPINHash();
                    if (pin !== storedPIN) {
                      Alert.alert('Error', 'Invalid PIN');
                      return;
                    }
                    showMnemonic();
                  },
                },
              ]);
            } catch (error) {
              Alert.alert('Error', 'Authentication failed');
            }
          },
        },
      ]
    );
  };

  const showMnemonic = async () => {
    const mnemonic = await getMnemonic();
    if (mnemonic) {
      Alert.alert('Your Recovery Phrase', mnemonic, [
        { text: 'OK' },
        {
          text: 'Copy',
          onPress: () => {
            Clipboard.setString(mnemonic);
            Alert.alert('Copied', 'Recovery phrase copied to clipboard');
          },
        },
      ]);
    }
  };

  const handleToggleBiometric = async (value) => {
    if (isWeb && value) {
      Alert.alert(
        'Not Available',
        'Biometric authentication is not available on web platform.'
      );
      return;
    }
    
    try {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();

      if (value && (!hasHardware || !isEnrolled)) {
        Alert.alert(
          'Biometric Not Available',
          'Biometric authentication is not available on this device.'
        );
        return;
      }

      await setBiometricEnabled(value);
      setBiometricEnabledState(value);
    } catch (error) {
      Alert.alert('Error', 'Failed to update biometric settings');
    }
  };

  const handleToggleTestnet = async (value) => {
    await updateNetwork(currentNetwork, value);
  };

  const handleToggleCustodial = async (value) => {
    if (value) {
      Alert.alert(
        'Enable Custodial Mode',
        'Your transactions will be routed through the GRX backend. Admins will execute burn actions on your behalf.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Enable',
            onPress: async () => {
              await updateCustodialMode(true);
            },
          },
        ]
      );
    } else {
      await updateCustodialMode(false);
    }
  };

  const handleClearData = () => {
    Alert.alert(
      'Clear All Data',
      'This will delete all wallet data including your recovery phrase. This action cannot be undone. Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            setLoading(true);
            try {
              await clearAllData();
              clearWallet();
              Alert.alert('Success', 'All data cleared', [
                {
                  text: 'OK',
                  onPress: () => {
                    navigation.reset({
                      index: 0,
                      routes: [{ name: 'Welcome' }],
                    });
                  },
                },
              ]);
            } catch (error) {
              Alert.alert('Error', 'Failed to clear data');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Network</Text>
        <View style={styles.settingRow}>
          <Text style={styles.settingLabel}>Testnet Mode</Text>
          <Switch
            value={isTestnet}
            onValueChange={handleToggleTestnet}
            trackColor={{ false: '#ccc', true: theme.colors.primary }}
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Wallet Mode</Text>
        <View style={styles.settingRow}>
          <View style={styles.settingColumn}>
            <Text style={styles.settingLabel}>Use Custodial Wallet</Text>
            <Text style={styles.settingDescription}>
              {custodialMode
                ? 'Transactions handled by backend administrators.'
                : 'Send directly on-chain from your device.'}
            </Text>
          </View>
          <Switch
            value={custodialMode}
            onValueChange={handleToggleCustodial}
            trackColor={{ false: '#ccc', true: theme.colors.primary }}
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Security</Text>
        <TouchableOpacity
          style={styles.settingRow}
          onPress={handleExportMnemonic}
        >
          <Text style={styles.settingLabel}>Export Recovery Phrase</Text>
          <Text style={styles.settingValue}>→</Text>
        </TouchableOpacity>
        {!isWeb && (
          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>Biometric Authentication</Text>
            <Switch
              value={biometricEnabled}
              onValueChange={handleToggleBiometric}
              trackColor={{ false: '#ccc', true: theme.colors.primary }}
            />
          </View>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Danger Zone</Text>
        <TouchableOpacity
          style={[styles.settingRow, styles.dangerRow]}
          onPress={handleClearData}
          disabled={loading}
        >
          <Text style={[styles.settingLabel, styles.dangerText]}>
            Clear All Data
          </Text>
          {loading ? (
            <ActivityIndicator color={theme.colors.error} />
          ) : (
            <Text style={[styles.settingValue, styles.dangerText]}>→</Text>
          )}
        </TouchableOpacity>
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
  section: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing.lg,
    padding: theme.spacing.md,
    ...theme.shadows.small,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  settingLabel: {
    fontSize: 16,
    color: theme.colors.text,
  },
  settingColumn: {
    flex: 1,
    marginRight: theme.spacing.sm,
  },
  settingDescription: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginTop: 4,
  },
  settingValue: {
    fontSize: 18,
    color: theme.colors.textSecondary,
  },
  dangerRow: {
    borderBottomWidth: 0,
  },
  dangerText: {
    color: theme.colors.error,
  },
});

export default SettingsScreen;

