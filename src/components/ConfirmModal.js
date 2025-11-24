import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import * as LocalAuthentication from 'expo-local-authentication';
import { getPINHash } from '../services/storageService';
import { theme } from '../styles/theme';

const isWeb = Platform.OS === 'web';

const ConfirmModal = ({
  visible,
  onClose,
  onConfirm,
  transactionDetails,
  loading,
  snapshotCard,
  children,
}) => {
  const [pin, setPin] = useState('');
  const [verifying, setVerifying] = useState(false);

  const handleBiometricAuth = async () => {
    if (isWeb) {
      Alert.alert('Info', 'Biometric authentication is not available on web. Please use PIN.');
      return;
    }
    
    try {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();

      if (!hasHardware || !isEnrolled) {
        Alert.alert('Biometric not available', 'Please use PIN instead');
        return;
      }

      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Confirm Transaction',
        cancelLabel: 'Cancel',
      });

      if (result.success) {
        onConfirm();
      }
    } catch (error) {
      console.error('Biometric auth error:', error);
      Alert.alert('Error', 'Biometric authentication failed');
    }
  };

  const handlePINConfirm = async () => {
    if (!pin) {
      Alert.alert('Error', 'Please enter your PIN');
      return;
    }

    setVerifying(true);
    try {
      const storedPINHash = await getPINHash();
      // Simple PIN verification (in production, use proper hashing)
      if (storedPINHash && storedPINHash === pin) {
        setPin('');
        onConfirm();
      } else {
        Alert.alert('Error', 'Invalid PIN');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to verify PIN');
    } finally {
      setVerifying(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <Text style={styles.title}>Confirm Transaction</Text>

          <View style={styles.detailsContainer}>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>To:</Text>
              <Text style={styles.detailValue} numberOfLines={1}>
                {transactionDetails?.to}
              </Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Amount:</Text>
              <Text style={styles.detailValue}>
                {transactionDetails?.amount} {transactionDetails?.symbol}
              </Text>
            </View>
            {transactionDetails?.mode && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Execution:</Text>
                <Text style={styles.detailValue}>
                  {transactionDetails.mode}
                </Text>
              </View>
            )}
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Gas Limit:</Text>
              <Text style={styles.detailValue}>
                {transactionDetails?.gasLimit || 'Auto'}
              </Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Network Fee:</Text>
              <Text style={styles.detailValue}>
                {transactionDetails?.fee || 'Calculating...'}
              </Text>
            </View>
          </View>

          {snapshotCard && (
            <View style={styles.snapshotContainer}>{snapshotCard}</View>
          )}

          {children && <View style={styles.childrenContainer}>{children}</View>}

          <View style={styles.authContainer}>
            <TouchableOpacity
              style={styles.biometricButton}
              onPress={handleBiometricAuth}
            >
              <Text style={styles.biometricButtonText}>
                Use Biometric Authentication
              </Text>
            </TouchableOpacity>

            <Text style={styles.orText}>OR</Text>

            <TextInput
              style={styles.pinInput}
              value={pin}
              onChangeText={setPin}
              placeholder="Enter PIN"
              secureTextEntry
              keyboardType="numeric"
              maxLength={6}
            />

            <TouchableOpacity
              style={[styles.confirmButton, verifying && styles.buttonDisabled]}
              onPress={handlePINConfirm}
              disabled={verifying || loading}
            >
              {verifying || loading ? (
                <ActivityIndicator color={theme.colors.secondary} />
              ) : (
                <Text style={styles.confirmButtonText}>Confirm</Text>
              )}
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.lg,
  },
  modal: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    width: '100%',
    maxWidth: 400,
    ...theme.shadows.large,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: theme.spacing.lg,
    textAlign: 'center',
  },
  detailsContainer: {
    backgroundColor: theme.colors.background,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing.lg,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.sm,
  },
  detailLabel: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    fontWeight: '600',
  },
  detailValue: {
    fontSize: 14,
    color: theme.colors.text,
    fontWeight: '500',
    flex: 1,
    textAlign: 'right',
  },
  authContainer: {
    marginBottom: theme.spacing.md,
  },
  biometricButton: {
    backgroundColor: theme.colors.primaryLight,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  biometricButtonText: {
    color: theme.colors.secondary,
    fontSize: 16,
    fontWeight: '600',
  },
  orText: {
    textAlign: 'center',
    color: theme.colors.textSecondary,
    marginVertical: theme.spacing.sm,
  },
  pinInput: {
    backgroundColor: theme.colors.background,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    fontSize: 18,
    textAlign: 'center',
    marginBottom: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  confirmButton: {
    backgroundColor: theme.colors.primary,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  confirmButtonText: {
    color: theme.colors.secondary,
    fontSize: 18,
    fontWeight: '600',
  },
  cancelButton: {
    paddingVertical: theme.spacing.sm,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: theme.colors.textSecondary,
    fontSize: 16,
  },
  snapshotContainer: {
    marginBottom: theme.spacing.md,
  },
  childrenContainer: {
    marginBottom: theme.spacing.md,
  },
});

export default ConfirmModal;

