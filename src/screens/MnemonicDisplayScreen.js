import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Clipboard,
} from 'react-native';
import MnemonicGrid from '../components/MnemonicGrid';
import { theme } from '../styles/theme';

const MnemonicDisplayScreen = ({ route, navigation }) => {
  const { mnemonic } = route.params;
  const [isBackedUp, setIsBackedUp] = useState(false);
  const words = mnemonic.split(' ');

  const handleCopy = () => {
    Clipboard.setString(mnemonic);
    Alert.alert('Copied', 'Recovery phrase copied to clipboard');
  };

  const handleNext = () => {
    if (!isBackedUp) {
      Alert.alert(
        'Backup Required',
        'Please confirm that you have backed up your recovery phrase before continuing.'
      );
      return;
    }
    navigation.navigate('MnemonicConfirm', { mnemonic });
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.warningBox}>
        <Text style={styles.warningTitle}>⚠️ Important Security Warning</Text>
        <Text style={styles.warningText}>
          Write down these 12 words in the exact order shown. Store them in a
          safe place. Anyone with access to these words can control your wallet.
        </Text>
      </View>

      <MnemonicGrid words={words} />

      <TouchableOpacity style={styles.copyButton} onPress={handleCopy}>
        <Text style={styles.copyButtonText}>Copy to Clipboard</Text>
      </TouchableOpacity>

      <View style={styles.checkboxContainer}>
        <TouchableOpacity
          style={styles.checkbox}
          onPress={() => setIsBackedUp(!isBackedUp)}
        >
          <View
            style={[
              styles.checkboxInner,
              isBackedUp && styles.checkboxChecked,
            ]}
          >
            {isBackedUp && <Text style={styles.checkmark}>✓</Text>}
          </View>
          <Text style={styles.checkboxLabel}>
            I have backed up my recovery phrase
          </Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={[styles.button, !isBackedUp && styles.buttonDisabled]}
        onPress={handleNext}
        disabled={!isBackedUp}
      >
        <Text style={styles.buttonText}>Next</Text>
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
  warningBox: {
    backgroundColor: '#FFEBEE',
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.error,
  },
  warningTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.error,
    marginBottom: theme.spacing.xs,
  },
  warningText: {
    fontSize: 14,
    color: '#C62828',
    lineHeight: 20,
  },
  copyButton: {
    backgroundColor: theme.colors.surface,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
    marginTop: theme.spacing.lg,
    marginBottom: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  copyButtonText: {
    color: theme.colors.primary,
    fontSize: 16,
    fontWeight: '600',
  },
  checkboxContainer: {
    marginVertical: theme.spacing.lg,
  },
  checkbox: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkboxInner: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderColor: theme.colors.primary,
    borderRadius: 4,
    marginRight: theme.spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: theme.colors.primary,
  },
  checkmark: {
    color: theme.colors.secondary,
    fontSize: 16,
    fontWeight: 'bold',
  },
  checkboxLabel: {
    fontSize: 16,
    color: theme.colors.text,
    flex: 1,
  },
  button: {
    backgroundColor: theme.colors.primary,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    borderRadius: theme.borderRadius.lg,
    alignItems: 'center',
    marginTop: theme.spacing.md,
    ...theme.shadows.medium,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: theme.colors.secondary,
    fontSize: 18,
    fontWeight: '600',
  },
});

export default MnemonicDisplayScreen;

