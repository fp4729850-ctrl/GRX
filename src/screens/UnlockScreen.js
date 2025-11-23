import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import * as LocalAuthentication from 'expo-local-authentication';
import { getPINHash, getBiometricEnabled } from '../services/storageService';
import { theme } from '../styles/theme';

const isWeb = Platform.OS === 'web';

const UnlockScreen = ({ onUnlock }) => {
  const [pin, setPin] = useState('');
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const pinInputRef = useRef(null);

  useEffect(() => {
    checkBiometric();
    pinInputRef.current?.focus();
  }, []);

  const checkBiometric = async () => {
    if (isWeb) return; // Biometric not available on web
    
    try {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      const biometricEnabled = await getBiometricEnabled();

      if (hasHardware && isEnrolled && biometricEnabled) {
        setBiometricAvailable(true);
        handleBiometricAuth();
      }
    } catch (error) {
      console.error('Error checking biometric:', error);
    }
  };

  const handleBiometricAuth = async () => {
    if (isWeb) {
      Alert.alert('Info', 'Biometric authentication is not available on web. Please use PIN.');
      return;
    }
    
    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Unlock GRX Wallet',
        cancelLabel: 'Use PIN',
      });

      if (result.success) {
        onUnlock();
      }
    } catch (error) {
      console.error('Biometric auth error:', error);
    }
  };

  const handlePINSubmit = async () => {
    if (pin.length !== 6) {
      Alert.alert('Error', 'Please enter 6-digit PIN');
      return;
    }

    try {
      const storedPIN = await getPINHash();
      if (pin === storedPIN) {
        setPin('');
        onUnlock();
      } else {
        Alert.alert('Error', 'Invalid PIN');
        setPin('');
        pinInputRef.current?.focus();
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to verify PIN');
    }
  };

  const handlePINEnter = (value) => {
    if (value.length <= 6) {
      setPin(value);
      if (value.length === 6) {
        handlePINSubmit();
      }
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.content}>
        <Text style={styles.title}>GRX Wallet</Text>
        <Text style={styles.subtitle}>Enter PIN to unlock</Text>

        <View style={styles.pinContainer}>
          <TextInput
            ref={pinInputRef}
            style={styles.pinInput}
            value={pin}
            onChangeText={handlePINEnter}
            keyboardType="numeric"
            secureTextEntry
            maxLength={6}
            autoFocus
            showSoftInputOnFocus={false}
          />
          <View style={styles.pinDots}>
            {[0, 1, 2, 3, 4, 5].map((index) => (
              <View
                key={index}
                style={[styles.dot, pin.length > index && styles.dotFilled]}
              />
            ))}
          </View>
        </View>

        {biometricAvailable && (
          <TouchableOpacity
            style={styles.biometricButton}
            onPress={handleBiometricAuth}
          >
            <Text style={styles.biometricButtonText}>
              Use Biometric Authentication
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  content: {
    flex: 1,
    padding: theme.spacing.lg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    color: theme.colors.primary,
    marginBottom: theme.spacing.sm,
  },
  subtitle: {
    fontSize: 18,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.xl,
  },
  pinContainer: {
    width: '100%',
    alignItems: 'center',
    marginBottom: theme.spacing.xl,
  },
  pinInput: {
    position: 'absolute',
    width: '100%',
    height: 60,
    opacity: 0,
  },
  pinDots: {
    flexDirection: 'row',
    gap: theme.spacing.md,
  },
  dot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: theme.colors.primary,
    backgroundColor: 'transparent',
  },
  dotFilled: {
    backgroundColor: theme.colors.primary,
  },
  biometricButton: {
    marginTop: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.xl,
  },
  biometricButtonText: {
    color: theme.colors.primary,
    fontSize: 16,
    fontWeight: '600',
  },
});

export default UnlockScreen;

