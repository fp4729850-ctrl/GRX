import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { storePINHash } from '../services/storageService';
import { theme } from '../styles/theme';

// Gold color constants
const GOLD_COLORS = {
  primary: '#D4AF37',
  light: '#F4E4BC',
  dark: '#B8941F',
  accent: '#FFD700',
};

const PINSetupScreen = ({ navigation, route }) => {
  const { onComplete } = route.params || {};
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [step, setStep] = useState(1); // 1: Enter PIN, 2: Confirm PIN
  const pinInputRef = useRef(null);
  const confirmPinInputRef = useRef(null);

  const handlePINEnter = (value) => {
    if (value.length <= 6) {
      setPin(value);
      if (value.length === 6 && step === 1) {
        // Move to confirm step
        setTimeout(() => {
          setStep(2);
          confirmPinInputRef.current?.focus();
        }, 100);
      }
    }
  };

  const handleConfirmPINEnter = (value) => {
    if (value.length <= 6) {
      setConfirmPin(value);
      if (value.length === 6) {
        handleSubmit();
      }
    }
  };

  const handleSubmit = async () => {
    if (pin.length !== 6) {
      Alert.alert('Error', 'PIN must be 6 digits');
      return;
    }

    if (pin !== confirmPin) {
      Alert.alert('Error', 'PINs do not match. Please try again.');
      setPin('');
      setConfirmPin('');
      setStep(1);
      pinInputRef.current?.focus();
      return;
    }

    try {
      // Store PIN (in production, hash it properly)
      await storePINHash(pin);
      
      if (onComplete) {
        onComplete();
      } else {
        navigation.goBack();
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to save PIN');
      console.error('Error saving PIN:', error);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <MaterialIcons name="lock" size={64} color={GOLD_COLORS.primary} />
        </View>
        <Text style={styles.title}>
          {step === 1 ? 'Create PIN' : 'Confirm PIN'}
        </Text>
        <Text style={styles.description}>
          {step === 1
            ? 'Enter a 6-digit PIN to secure your wallet'
            : 'Re-enter your PIN to confirm'}
        </Text>

        <View style={styles.pinContainer}>
          <TextInput
            ref={step === 1 ? pinInputRef : confirmPinInputRef}
            style={styles.pinInput}
            value={step === 1 ? pin : confirmPin}
            onChangeText={step === 1 ? handlePINEnter : handleConfirmPINEnter}
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
                style={[
                  styles.dot,
                  (step === 1 ? pin : confirmPin).length > index &&
                    styles.dotFilled,
                ]}
              />
            ))}
          </View>
        </View>

        {step === 2 && (
          <TouchableOpacity
            style={styles.button}
            onPress={handleSubmit}
            disabled={confirmPin.length !== 6}
          >
            <Text style={styles.buttonText}>Confirm</Text>
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
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: GOLD_COLORS.light,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
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
  button: {
    backgroundColor: GOLD_COLORS.primary,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.xl,
    borderRadius: theme.borderRadius.lg,
    minWidth: 200,
    alignItems: 'center',
    ...theme.shadows.medium,
  },
  buttonText: {
    color: theme.colors.secondary,
    fontSize: 18,
    fontWeight: '600',
  },
});

export default PINSetupScreen;

