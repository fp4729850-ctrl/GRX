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
  TextInput,
  Modal,
} from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import * as LocalAuthentication from 'expo-local-authentication';
import { useWallet } from '../context/WalletContext';
import { isAdminAddress } from '../utils/adminUtils';

// Gold color constants
const GOLD_COLORS = {
  primary: '#D4AF37',
  light: '#F4E4BC',
  dark: '#B8941F',
  accent: '#FFD700',
};
import {
  getMnemonic,
  getBiometricEnabled,
  setBiometricEnabled,
  clearAllData,
} from '../services/storageService';
import { isPINSet, setPIN, verifyPIN } from '../services/pinService';
import { theme } from '../styles/theme';

const isWeb = Platform.OS === 'web';

const SettingsScreen = ({ navigation }) => {
  const {
    walletAddress,
    isTestnet,
    currentNetwork,
    updateNetwork,
    clearWallet,
    custodialMode,
    updateCustodialMode,
  } = useWallet();
  const isAdmin = isAdminAddress(walletAddress);
  const [biometricEnabled, setBiometricEnabledState] = useState(false);
  const [loading, setLoading] = useState(false);
  const [pinSet, setPinSet] = useState(false);
  const [showPINModal, setShowPINModal] = useState(false);
  const [showVerifyPINModal, setShowVerifyPINModal] = useState(false);
  const [newPIN, setNewPIN] = useState('');
  const [currentPIN, setCurrentPIN] = useState('');
  const [isChangingPIN, setIsChangingPIN] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    const enabled = await getBiometricEnabled();
    setBiometricEnabledState(enabled);
    const pinExists = await isPINSet();
    setPinSet(pinExists);
  };

  const handleSetupPIN = async () => {
    setIsChangingPIN(pinSet);
    setNewPIN('');
    setCurrentPIN('');
    setShowPINModal(true);
  };

  const handleNewPINSubmit = async () => {
    if (!newPIN || newPIN.length < 4) {
      Alert.alert('Error', 'PIN must be at least 4 digits');
      return;
    }

    if (isChangingPIN) {
      // Need to verify current PIN first
      setShowPINModal(false);
      setShowVerifyPINModal(true);
    } else {
      // Setting PIN for first time
      const setResult = await setPIN(newPIN);
      if (setResult.success) {
        Alert.alert('Success', 'PIN setup successfully');
        setPinSet(true);
        setShowPINModal(false);
        setNewPIN('');
      } else {
        Alert.alert('Error', setResult.error || 'Failed to setup PIN');
      }
    }
  };

  const handleVerifyCurrentPIN = async () => {
    if (!currentPIN || currentPIN.length < 4) {
      Alert.alert('Error', 'Please enter your current PIN');
      return;
    }

    const result = await verifyPIN(currentPIN);
    if (!result.success) {
      Alert.alert('Error', result.error || 'Invalid PIN');
      setCurrentPIN('');
      return;
    }

    // Old PIN verified, set new PIN
    const setResult = await setPIN(newPIN);
    if (setResult.success) {
      Alert.alert('Success', 'PIN updated successfully');
      setPinSet(true);
      setShowVerifyPINModal(false);
      setNewPIN('');
      setCurrentPIN('');
    } else {
      Alert.alert('Error', setResult.error || 'Failed to update PIN');
    }
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
              // Show PIN modal for verification
              setShowVerifyPINModal(true);
              setCurrentPIN('');
              return;
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
        <View style={styles.sectionHeader}>
          <MaterialIcons name="settings-ethernet" size={20} color={GOLD_COLORS.primary} />
          <Text style={styles.sectionTitle}>Network</Text>
        </View>
        <View style={styles.settingRow}>
          <View style={styles.settingLabelRow}>
            <Ionicons name="globe-outline" size={18} color={theme.colors.text} />
            <Text style={styles.settingLabel}> Testnet Mode</Text>
          </View>
          <Switch
            value={isTestnet}
            onValueChange={handleToggleTestnet}
            trackColor={{ false: '#ccc', true: GOLD_COLORS.primary }}
          />
        </View>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <MaterialIcons name="account-balance-wallet" size={20} color={GOLD_COLORS.primary} />
          <Text style={styles.sectionTitle}>Wallet Mode</Text>
        </View>
        <View style={styles.settingRow}>
          <View style={styles.settingColumn}>
            <View style={styles.settingLabelRow}>
              <MaterialIcons name="admin-panel-settings" size={18} color={theme.colors.text} />
              <Text style={styles.settingLabel}> Use Custodial Wallet</Text>
            </View>
            <Text style={styles.settingDescription}>
              {custodialMode
                ? 'Transactions handled by backend administrators.'
                : 'Send directly on-chain from your device.'}
            </Text>
          </View>
          <Switch
            value={custodialMode}
            onValueChange={handleToggleCustodial}
            trackColor={{ false: '#ccc', true: GOLD_COLORS.primary }}
          />
        </View>
      </View>

      {isAdmin && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <MaterialIcons name="admin-panel-settings" size={20} color={GOLD_COLORS.primary} />
            <Text style={styles.sectionTitle}>Administration</Text>
          </View>
          <TouchableOpacity
            style={styles.settingRow}
            onPress={() => navigation.navigate('AdminPanel')}
          >
            <View style={styles.settingLabelRow}>
              <MaterialIcons name="dashboard" size={18} color={GOLD_COLORS.primary} />
              <Text style={[styles.settingLabel, { color: GOLD_COLORS.primary, fontWeight: '600' }]}>
                {' '}Admin Panel
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={GOLD_COLORS.primary} />
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <MaterialIcons name="security" size={20} color={GOLD_COLORS.primary} />
          <Text style={styles.sectionTitle}>Security</Text>
        </View>
        <TouchableOpacity
          style={styles.settingRow}
          onPress={handleSetupPIN}
        >
          <View style={styles.settingColumn}>
            <View style={styles.settingLabelRow}>
              <MaterialIcons name="lock" size={18} color={theme.colors.text} />
              <Text style={styles.settingLabel}>
                {pinSet ? ' Change PIN' : ' Setup PIN'}
              </Text>
            </View>
            <Text style={styles.settingDescription}>
              {pinSet
                ? 'Change your PIN for transaction confirmations'
                : 'Set up PIN for transaction confirmations and app security'}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={theme.colors.textSecondary} />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.settingRow}
          onPress={handleExportMnemonic}
        >
          <View style={styles.settingLabelRow}>
            <MaterialIcons name="vpn-key" size={18} color={theme.colors.text} />
            <Text style={styles.settingLabel}> Export Recovery Phrase</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={theme.colors.textSecondary} />
        </TouchableOpacity>
        {!isWeb && (
          <View style={styles.settingRow}>
            <View style={styles.settingLabelRow}>
              <Ionicons name="finger-print-outline" size={18} color={theme.colors.text} />
              <Text style={styles.settingLabel}> Biometric Authentication</Text>
            </View>
            <Switch
              value={biometricEnabled}
              onValueChange={handleToggleBiometric}
              trackColor={{ false: '#ccc', true: GOLD_COLORS.primary }}
            />
          </View>
        )}
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <MaterialIcons name="warning" size={20} color={theme.colors.error} />
          <Text style={[styles.sectionTitle, styles.dangerText]}>Danger Zone</Text>
        </View>
        <TouchableOpacity
          style={[styles.settingRow, styles.dangerRow]}
          onPress={handleClearData}
          disabled={loading}
        >
          <View style={styles.settingLabelRow}>
            <MaterialIcons name="delete-forever" size={18} color={theme.colors.error} />
            <Text style={[styles.settingLabel, styles.dangerText]}>
              {' '}Clear All Data
            </Text>
          </View>
          {loading ? (
            <ActivityIndicator color={theme.colors.error} />
          ) : (
            <Ionicons name="chevron-forward" size={20} color={theme.colors.error} />
          )}
        </TouchableOpacity>
      </View>

      {/* PIN Setup/Change Modal */}
      <Modal
        visible={showPINModal}
        transparent
        animationType="fade"
        onRequestClose={() => {
          setShowPINModal(false);
          setNewPIN('');
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>
              {isChangingPIN ? 'Change PIN' : 'Setup PIN'}
            </Text>
            <Text style={styles.modalSubtitle}>
              Enter a PIN (minimum 4 digits)
            </Text>
            <TextInput
              style={styles.modalInput}
              value={newPIN}
              onChangeText={setNewPIN}
              placeholder="Enter new PIN"
              keyboardType="numeric"
              secureTextEntry
              autoFocus
              maxLength={10}
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonCancel]}
                onPress={() => {
                  setShowPINModal(false);
                  setNewPIN('');
                }}
              >
                <Text style={styles.modalButtonCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.modalButton,
                  styles.modalButtonConfirm,
                  (!newPIN || newPIN.length < 4) && styles.modalButtonDisabled,
                ]}
                onPress={handleNewPINSubmit}
                disabled={!newPIN || newPIN.length < 4}
              >
                <Text style={styles.modalButtonConfirmText}>Continue</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* PIN Verification Modal */}
      <Modal
        visible={showVerifyPINModal}
        transparent
        animationType="fade"
        onRequestClose={() => {
          setShowVerifyPINModal(false);
          setCurrentPIN('');
          if (isChangingPIN) {
            setShowPINModal(true);
          }
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>
              {isChangingPIN ? 'Verify Current PIN' : 'Enter PIN'}
            </Text>
            <Text style={styles.modalSubtitle}>
              {isChangingPIN
                ? 'Enter your current PIN to continue'
                : 'Enter your PIN to export recovery phrase'}
            </Text>
            <TextInput
              style={styles.modalInput}
              value={currentPIN}
              onChangeText={setCurrentPIN}
              placeholder="Enter PIN"
              keyboardType="numeric"
              secureTextEntry
              autoFocus
              maxLength={10}
              onSubmitEditing={
                isChangingPIN
                  ? handleVerifyCurrentPIN
                  : async () => {
                      const result = await verifyPIN(currentPIN);
                      if (!result.success) {
                        Alert.alert('Error', result.error || 'Invalid PIN');
                        setCurrentPIN('');
                        return;
                      }
                      setShowVerifyPINModal(false);
                      setCurrentPIN('');
                      showMnemonic();
                    }
              }
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonCancel]}
                onPress={() => {
                  setShowVerifyPINModal(false);
                  setCurrentPIN('');
                  if (isChangingPIN) {
                    setShowPINModal(true);
                  }
                }}
              >
                <Text style={styles.modalButtonCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.modalButton,
                  styles.modalButtonConfirm,
                  (!currentPIN || currentPIN.length < 4) && styles.modalButtonDisabled,
                ]}
                onPress={
                  isChangingPIN
                    ? handleVerifyCurrentPIN
                    : async () => {
                        const result = await verifyPIN(currentPIN);
                        if (!result.success) {
                          Alert.alert('Error', result.error || 'Invalid PIN');
                          setCurrentPIN('');
                          return;
                        }
                        setShowVerifyPINModal(false);
                        setCurrentPIN('');
                        showMnemonic();
                      }
                }
                disabled={!currentPIN || currentPIN.length < 4}
              >
                <Text style={styles.modalButtonConfirmText}>
                  {isChangingPIN ? 'Verify' : 'OK'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
    borderWidth: 1.5,
    borderColor: GOLD_COLORS.light,
    ...theme.shadows.small,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginLeft: theme.spacing.xs,
  },
  settingLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
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
  dangerRow: {
    borderBottomWidth: 0,
  },
  dangerText: {
    color: theme.colors.error,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modal: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.xl,
    width: '85%',
    maxWidth: 400,
    borderWidth: 2,
    borderColor: GOLD_COLORS.primary,
    ...theme.shadows.large,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.lg,
    textAlign: 'center',
  },
  modalInput: {
    backgroundColor: theme.colors.background,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text,
    borderWidth: 2,
    borderColor: GOLD_COLORS.light,
    marginBottom: theme.spacing.lg,
    textAlign: 'center',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: theme.spacing.md,
  },
  modalButton: {
    flex: 1,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
  },
  modalButtonCancel: {
    backgroundColor: theme.colors.surfaceAlt,
    borderWidth: 1.5,
    borderColor: theme.colors.border,
  },
  modalButtonCancelText: {
    color: theme.colors.text,
    fontSize: 16,
    fontWeight: '600',
  },
  modalButtonConfirm: {
    backgroundColor: GOLD_COLORS.primary,
  },
  modalButtonConfirmText: {
    color: theme.colors.secondary,
    fontSize: 16,
    fontWeight: '600',
  },
  modalButtonDisabled: {
    opacity: 0.5,
  },
});

export default SettingsScreen;

