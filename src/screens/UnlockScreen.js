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
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import * as LocalAuthentication from 'expo-local-authentication';
import { getBiometricEnabled } from '../services/storageService';
import { verifyPIN, isPINSet, storePINVerifiedTimestamp } from '../services/pinService';
import { theme } from '../styles/theme';

// Gold color constants
const GOLD_COLORS = {
  primary: '#D4AF37',
  light: '#F4E4BC',
  dark: '#B8941F',
  accent: '#FFD700',
};

const isWeb = Platform.OS === 'web';

const UnlockScreen = ({ onUnlock }) => {
  const [pin, setPin] = useState('');
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const pinInputRef = useRef(null);

  useEffect(() => {
    checkPINExists();
    checkBiometric();
    pinInputRef.current?.focus();
  }, []);

  const checkPINExists = async () => {
    try {
      const pinSet = await isPINSet();
      // If PIN is not set up, directly unlock (no PIN required)
      if (!pinSet) {
        console.log('No PIN set up, unlocking directly');
        onUnlock();
        return;
      }
    } catch (error) {
      console.error('Error checking PIN:', error);
      // If error checking PIN, unlock anyway to avoid blocking user
      onUnlock();
    }
  };

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
        // Store PIN verification timestamp for biometric unlock
        await storePINVerifiedTimestamp();
        onUnlock();
      }
    } catch (error) {
      console.error('Biometric auth error:', error);
    }
  };

  const handlePINSubmit = async () => {
    if (pin.length < 4) {
      Alert.alert('Error', 'Please enter at least 4-digit PIN');
      return;
    }

    try {
      const pinSet = await isPINSet();
      // If PIN is not set up, directly unlock
      if (!pinSet) {
        onUnlock();
        return;
      }
      
      const result = await verifyPIN(pin);
      if (result.success) {
        setPin('');
        onUnlock();
      } else {
        Alert.alert('Error', result.error || 'Invalid PIN');
        setPin('');
        pinInputRef.current?.focus();
      }
    } catch (error) {
      console.error('Error verifying PIN:', error);
      Alert.alert('Error', 'PIN verification failed');
      setPin('');
      pinInputRef.current?.focus();
    }
  };

  const handlePINEnter = (value) => {
    if (value.length <= 6) {
      setPin(value);
      if (value.length >= 4) {
        // Auto-submit after 4 digits (minimum PIN length)
        setTimeout(() => handlePINSubmit(), 100);
      }
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <MaterialIcons name="lock-outline" size={64} color={GOLD_COLORS.primary} />
        </View>
        <Text style={styles.title}>GRX Wallet</Text>
        <Text style={styles.subtitle}>Enter PIN to unlock</Text>

        <View style={styles.pinContainer}>
          {isWeb ? (
            <TextInput
              ref={pinInputRef}
              style={styles.pinInputWeb}
              value={pin}
              onChangeText={handlePINEnter}
              keyboardType="numeric"
              secureTextEntry
              maxLength={10}
              autoFocus
              showSoftInputOnFocus={true}
              placeholder="Enter PIN"
              placeholderTextColor={theme.colors.textSecondary}
            />
          ) : (
            <>
              <TextInput
                ref={pinInputRef}
                style={styles.pinInput}
                value={pin}
                onChangeText={handlePINEnter}
                keyboardType="numeric"
                secureTextEntry
                maxLength={10}
                autoFocus
                showSoftInputOnFocus={false}
              />
              <View style={styles.pinDots}>
                {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((index) => (
                  <View
                    key={index}
                    style={[styles.dot, pin.length > index && styles.dotFilled]}
                  />
                ))}
              </View>
            </>
          )}
        </View>

        {biometricAvailable && (
          <TouchableOpacity
            style={styles.biometricButton}
            onPress={handleBiometricAuth}
          >
            <Ionicons name="finger-print" size={20} color={GOLD_COLORS.dark} />
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
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: GOLD_COLORS.light,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    color: GOLD_COLORS.primary,
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
  pinInputWeb: {
    width: '100%',
    maxWidth: 300,
    height: 50,
    borderWidth: 2,
    borderColor: GOLD_COLORS.primary,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.background,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    fontSize: 18,
    color: theme.colors.text,
    textAlign: 'center',
    letterSpacing: 8,
    outline: 'none',
    WebkitAppearance: 'none',
    MozAppearance: 'textfield',
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
    borderColor: GOLD_COLORS.primary,
    backgroundColor: 'transparent',
  },
  dotFilled: {
    backgroundColor: GOLD_COLORS.primary,
  },
  biometricButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.xl,
    backgroundColor: GOLD_COLORS.light,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1.5,
    borderColor: GOLD_COLORS.primary,
  },
  biometricButtonText: {
    color: GOLD_COLORS.dark,
    fontSize: 16,
    fontWeight: '600',
    marginLeft: theme.spacing.xs,
  },
});

export default UnlockScreen;

