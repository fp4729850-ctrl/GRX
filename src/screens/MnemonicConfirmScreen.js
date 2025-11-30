import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { deriveWalletFromMnemonic } from '../services/walletService';
import {
  storeMnemonic,
  storePrivateKey,
  storeWalletAddress,
} from '../services/storageService';
import { useWallet } from '../context/WalletContext';
import { theme } from '../styles/theme';

// Gold color constants
const GOLD_COLORS = {
  primary: '#D4AF37',
  light: '#F4E4BC',
  dark: '#B8941F',
  accent: '#FFD700',
};

const MnemonicConfirmScreen = ({ route, navigation }) => {
  const { mnemonic } = route.params;
  const { initializeWallet } = useWallet();
  const [loading, setLoading] = useState(false);
  
  const originalWords = mnemonic.split(' ');
  const [shuffledWords, setShuffledWords] = useState([]);
  const [selectedWords, setSelectedWords] = useState([]);
  const [currentStep, setCurrentStep] = useState(1); // 1-12

  useEffect(() => {
    // Shuffle words for confirmation
    const shuffled = [...originalWords].sort(() => Math.random() - 0.5);
    setShuffledWords(shuffled);
  }, []);

  const handleWordSelect = (word) => {
    if (selectedWords.length >= 12) return; // Already completed
    
    const newSelected = [...selectedWords, word];
    setSelectedWords(newSelected);
    
    // Remove selected word from shuffled list
    const updatedShuffled = shuffledWords.filter(w => {
      const countInSelected = newSelected.filter(sw => sw === word).length;
      const countInShuffled = shuffledWords.filter(sw => sw === word).length;
      // Only remove if we haven't already removed all instances
      return !(word === w && countInSelected <= countInShuffled - 1);
    });
    setShuffledWords(updatedShuffled);
    
    // Move to next step
    if (newSelected.length < 12) {
      setCurrentStep(newSelected.length + 1);
    }
  };

  const handleWordRemove = (index) => {
    const wordToRemove = selectedWords[index];
    const newSelected = selectedWords.filter((_, i) => i !== index);
    setSelectedWords(newSelected);
    
    // Add word back to shuffled list
    setShuffledWords([...shuffledWords, wordToRemove]);
    
    // Update current step
    setCurrentStep(newSelected.length + 1);
  };

  const handleConfirm = async () => {
    if (selectedWords.length !== 12) {
      Alert.alert('Error', 'Please select all 12 words');
      return;
    }

    const enteredMnemonic = selectedWords.join(' ');
    
    if (enteredMnemonic !== mnemonic) {
      Alert.alert(
        'Error',
        'The order you selected does not match your recovery phrase. Please try again.'
      );
      // Reset
      const shuffled = [...originalWords].sort(() => Math.random() - 0.5);
      setShuffledWords(shuffled);
      setSelectedWords([]);
      setCurrentStep(1);
      return;
    }

    setLoading(true);
    try {
      // Derive wallet from mnemonic
      const wallet = await deriveWalletFromMnemonic(mnemonic);

      // Store securely
      await storeMnemonic(mnemonic);
      await storePrivateKey(wallet.privateKey);
      await storeWalletAddress(wallet.address);

      // Initialize wallet context
      initializeWallet(wallet.address, wallet.privateKey);

      // Navigate to PIN setup, then dashboard
      navigation.navigate('PINSetup', {
        onComplete: () => {
          navigation.reset({
            index: 0,
            routes: [{ name: 'MainTabs' }],
          });
        },
      });
    } catch (error) {
      Alert.alert('Error', 'Failed to create wallet. Please try again.');
      console.error('Error creating wallet:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <MaterialIcons name="verified-user" size={32} color={GOLD_COLORS.primary} />
        <Text style={styles.title}>Confirm Your Recovery Phrase</Text>
      </View>
      <Text style={styles.description}>
        Select the words in the correct order to confirm you've saved your recovery phrase.
      </Text>

      {/* Current step indicator */}
      <View style={styles.stepIndicator}>
        <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />
        <Text style={styles.stepText}>
          {' '}Select word {currentStep} of 12
        </Text>
      </View>

      {/* Selected words display */}
      <View style={styles.selectedContainer}>
        <Text style={styles.selectedLabel}>Selected Words:</Text>
        <View style={styles.selectedWordsGrid}>
          {Array.from({ length: 12 }).map((_, index) => (
            <View key={index} style={styles.wordSlot}>
              <Text style={styles.wordSlotNumber}>{index + 1}.</Text>
              {selectedWords[index] ? (
                <TouchableOpacity
                  style={styles.selectedWordChip}
                  onPress={() => handleWordRemove(index)}
                >
                  <Text style={styles.selectedWordText}>
                    {selectedWords[index]}
                  </Text>
                  <Ionicons name="close-circle" size={18} color="#FFFFFF" />
                </TouchableOpacity>
              ) : (
                <View style={styles.emptyWordSlot}>
                  <Text style={styles.emptyWordText}>?</Text>
                </View>
              )}
            </View>
          ))}
        </View>
      </View>

      {/* Available words to select */}
      <View style={styles.availableContainer}>
        <Text style={styles.availableLabel}>Tap words in order:</Text>
        <View style={styles.wordsGrid}>
          {shuffledWords.map((word, index) => (
            <TouchableOpacity
              key={`${word}-${index}`}
              style={styles.wordButton}
              onPress={() => handleWordSelect(word)}
            >
              <Text style={styles.wordButtonText}>{word}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Confirm button */}
      <TouchableOpacity
        style={[
          styles.button,
          (selectedWords.length !== 12 || loading) && styles.buttonDisabled,
        ]}
        onPress={handleConfirm}
        disabled={selectedWords.length !== 12 || loading}
      >
        {loading ? (
          <ActivityIndicator color={theme.colors.secondary} />
        ) : (
          <Text style={styles.buttonText}>Confirm & Create Wallet</Text>
        )}
      </TouchableOpacity>

      {/* Reset button */}
      {selectedWords.length > 0 && (
        <TouchableOpacity
          style={styles.resetButton}
          onPress={() => {
            const shuffled = [...originalWords].sort(() => Math.random() - 0.5);
            setShuffledWords(shuffled);
            setSelectedWords([]);
            setCurrentStep(1);
          }}
        >
          <Ionicons name="refresh-outline" size={18} color={theme.colors.textSecondary} />
          <Text style={styles.resetButtonText}> Reset</Text>
        </TouchableOpacity>
      )}
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
  header: {
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginTop: theme.spacing.sm,
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    color: theme.colors.textSecondary,
    lineHeight: 24,
    marginBottom: theme.spacing.lg,
    textAlign: 'center',
  },
  stepIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: GOLD_COLORS.primary,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing.lg,
    justifyContent: 'center',
  },
  stepText: {
    color: theme.colors.secondary,
    fontSize: 18,
    fontWeight: '600',
  },
  selectedContainer: {
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing.lg,
    borderWidth: 1.5,
    borderColor: GOLD_COLORS.light,
    ...theme.shadows.small,
  },
  selectedLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
  },
  selectedWordsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  wordSlot: {
    width: '30%',
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  wordSlotNumber: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginRight: theme.spacing.xs,
    fontWeight: '600',
    minWidth: 20,
  },
  selectedWordChip: {
    flex: 1,
    backgroundColor: GOLD_COLORS.primary,
    paddingVertical: theme.spacing.xs,
    paddingHorizontal: theme.spacing.sm,
    borderRadius: theme.borderRadius.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  selectedWordText: {
    color: theme.colors.secondary,
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
  },
  emptyWordSlot: {
    flex: 1,
    backgroundColor: theme.colors.background,
    paddingVertical: theme.spacing.xs,
    paddingHorizontal: theme.spacing.sm,
    borderRadius: theme.borderRadius.sm,
    borderWidth: 1.5,
    borderColor: GOLD_COLORS.light,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 32,
  },
  emptyWordText: {
    color: theme.colors.textSecondary,
    fontSize: 16,
  },
  availableContainer: {
    marginBottom: theme.spacing.lg,
  },
  availableLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
  },
  wordsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  wordButton: {
    backgroundColor: theme.colors.surface,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1.5,
    borderColor: GOLD_COLORS.light,
    ...theme.shadows.small,
  },
  wordButtonText: {
    fontSize: 16,
    color: theme.colors.text,
    fontWeight: '500',
  },
  button: {
    backgroundColor: GOLD_COLORS.primary,
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
  resetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.sm,
    marginTop: theme.spacing.md,
  },
  resetButtonText: {
    color: theme.colors.textSecondary,
    fontSize: 16,
  },
});

export default MnemonicConfirmScreen;
