import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Clipboard,
  Alert,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import QRCode from 'react-native-qrcode-svg';
import { useWallet } from '../context/WalletContext';
import { theme } from '../styles/theme';
import { validateAddress, validateAmount } from '../utils/validation';
import { sendCustodialTransaction } from '../services/custodialService';
import { sendGRXTokens } from '../services/grxChainService';
import { getMnemonic } from '../services/storageService';

// Gold color constants
const GOLD_COLORS = {
  primary: '#D4AF37',
  light: '#F4E4BC',
  dark: '#B8941F',
  accent: '#FFD700',
};

const ReceiveScreen = ({ navigation }) => {
  const { walletAddress, grxBalance, custodialMode, refreshBalances } = useWallet();
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const handleCopyAddress = () => {
    Clipboard.setString(walletAddress);
    Alert.alert('Copied', 'Wallet address copied to clipboard');
  };

  const handleSend = async () => {
    console.log('handleSend called', { recipient, amount, grxBalance });
    
    if (!recipient || recipient.trim() === '') {
      console.log('No recipient');
      Alert.alert('Error', 'Please enter a recipient address');
      return;
    }

    const isValidAddress = validateAddress(recipient.trim());
    console.log('Address validation:', isValidAddress, recipient);
    
    if (!isValidAddress) {
      Alert.alert('Error', 'Please enter a valid recipient address (must start with "grx" for GRX addresses)');
      return;
    }

    if (!amount || amount.trim() === '') {
      console.log('No amount');
      Alert.alert('Error', 'Please enter an amount');
      return;
    }

    if (!validateAmount(amount)) {
      console.log('Invalid amount');
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }

    const amountNum = parseFloat(amount);
    const balanceNum = parseFloat(grxBalance || '0');
    console.log('Balance check:', { amountNum, balanceNum });

    if (amountNum > balanceNum) {
      Alert.alert('Error', 'Insufficient balance');
      return;
    }

    console.log('Showing confirmation modal');
    // Show confirmation modal
    setShowConfirmModal(true);
  };

  const handleCancelSend = () => {
    console.log('User cancelled send');
    setShowConfirmModal(false);
  };

  const handleConfirmModalSend = () => {
    console.log('User confirmed, calling handleConfirmSend');
    setShowConfirmModal(false);
    handleConfirmSend();
  };

  const handleConfirmSend = async () => {
    console.log('handleConfirmSend called', { recipient, amount, custodialMode });
    setLoading(true);
    try {
      if (custodialMode) {
        const response = await sendCustodialTransaction({
          from: walletAddress,
          to: recipient,
          amount,
          token: 'GRX',
          network: 'GRX',
          isTestnet: false,
        });
        Alert.alert(
          'Request Submitted',
          `Custodial transfer queued. Reference: ${response?.reference || response?.id || 'pending'}`,
          [
            {
              text: 'OK',
              onPress: () => {
                setRecipient('');
                setAmount('');
              },
            },
          ]
        );
      } else {
        // Direct GRX chain transaction
        const mnemonic = await getMnemonic();
        if (!mnemonic) {
          throw new Error('Wallet mnemonic not found. Please unlock your wallet.');
        }

        console.log('Sending transaction...');
        const txHash = await sendGRXTokens(mnemonic, recipient, amount, '');
        console.log('Transaction sent successfully, hash:', txHash);
        
        // Clear form immediately
        setRecipient('');
        setAmount('');
        
        // Immediately refresh balance multiple times quickly
        console.log('Refreshing balance immediately...');
        refreshBalances(); // First refresh immediately
        
        // Quick successive refreshes for faster update
        setTimeout(() => refreshBalances(), 500);  // After 0.5s
        setTimeout(() => refreshBalances(), 1000); // After 1s
        setTimeout(() => refreshBalances(), 2000); // After 2s
        
        Alert.alert(
          'Transaction Sent!',
          `Successfully sent ${amount} GRX to ${recipient.substring(0, 20)}...\n\nTransaction Hash: ${txHash}`,
          [
            {
              text: 'OK',
              onPress: () => {
                // Final refresh after alert dismiss
                refreshBalances();
              },
            },
          ]
        );
      }
    } catch (error) {
      console.error('Transaction error:', error);
      Alert.alert(
        'Transaction Failed',
        error.message || 'An error occurred while sending the transaction. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.title}>Receive</Text>
        <Text style={styles.description}>
          Share this address to receive {walletAddress ? 'tokens' : ''}
        </Text>

        {walletAddress && (
          <>
            <View style={styles.qrContainer}>
              <QRCode
                value={walletAddress}
                size={250}
                backgroundColor={theme.colors.surface}
                color={theme.colors.text}
              />
            </View>

            <View style={styles.addressContainer}>
              <View style={styles.addressHeader}>
                <MaterialIcons name="account-balance-wallet" size={20} color={GOLD_COLORS.primary} />
                <Text style={styles.addressLabel}>Your Wallet Address</Text>
              </View>
              <Text style={styles.addressText} selectable>
                {walletAddress}
              </Text>
            </View>

            <TouchableOpacity
              style={styles.copyButton}
              onPress={handleCopyAddress}
            >
              <Ionicons name="copy-outline" size={20} color="#FFFFFF" />
              <Text style={styles.copyButtonText}> Copy Address</Text>
            </TouchableOpacity>

            <View style={styles.warningBox}>
              <View style={styles.warningHeader}>
                <Ionicons name="warning-outline" size={20} color="#856404" />
                <Text style={styles.warningTitle}> Important Notice</Text>
              </View>
              <Text style={styles.warningText}>
                Only send {walletAddress ? 'tokens' : ''} to this address.
                Sending other assets may result in permanent loss.
              </Text>
            </View>
          </>
        )}

        {/* Send Section */}
        <View style={styles.sendSection}>
          <View style={styles.sectionHeader}>
            <MaterialIcons name="send" size={24} color={GOLD_COLORS.primary} />
            <Text style={styles.sectionTitle}>Send Tokens</Text>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Recipient Address</Text>
            <TextInput
              style={styles.input}
              value={recipient}
              onChangeText={setRecipient}
              placeholder="grx1..."
              autoCapitalize="none"
              placeholderTextColor={theme.colors.textSecondary}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>
              Amount (Balance: {grxBalance || '0'} GRX)
            </Text>
            <TextInput
              style={styles.input}
              value={amount}
              onChangeText={setAmount}
              placeholder="0.0"
              keyboardType="decimal-pad"
              placeholderTextColor={theme.colors.textSecondary}
            />
          </View>

          <TouchableOpacity
            style={[styles.sendButton, loading && styles.sendButtonDisabled]}
            onPress={() => {
              console.log('Send button pressed!');
              handleSend();
            }}
            disabled={loading}
            activeOpacity={0.7}
          >
            {loading ? (
              <ActivityIndicator color={theme.colors.secondary} />
            ) : (
              <>
                <Ionicons name="send-outline" size={20} color="#FFFFFF" />
                <Text style={styles.sendButtonText}> Send Tokens</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Confirmation Modal */}
        <Modal
          visible={showConfirmModal}
          transparent={true}
          animationType="fade"
          onRequestClose={handleCancelSend}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <MaterialIcons name="send" size={32} color={GOLD_COLORS.primary} />
                <Text style={styles.modalTitle}>Confirm Send</Text>
              </View>
              
              <View style={styles.modalBody}>
                <Text style={styles.modalText}>
                  Send <Text style={styles.modalAmount}>{amount} GRX</Text> to:
                </Text>
                <Text style={styles.modalAddress} selectable>
                  {recipient}
                </Text>
                <View style={styles.modalBalanceInfo}>
                  <Text style={styles.modalBalanceText}>
                    Current Balance: {grxBalance || '0'} GRX
                  </Text>
                  <Text style={styles.modalBalanceText}>
                    After Send: {(parseFloat(grxBalance || '0') - parseFloat(amount)).toFixed(4)} GRX
                  </Text>
                </View>
              </View>

              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.modalButtonCancel]}
                  onPress={handleCancelSend}
                >
                  <Text style={styles.modalButtonCancelText}>No, Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalButton, styles.modalButtonConfirm]}
                  onPress={handleConfirmModalSend}
                >
                  <Text style={styles.modalButtonConfirmText}>Yes, Send</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: theme.spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
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
  qrContainer: {
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.lg,
    borderRadius: theme.borderRadius.lg,
    marginBottom: theme.spacing.xl,
    borderWidth: 2,
    borderColor: GOLD_COLORS.primary,
    ...theme.shadows.medium,
  },
  addressContainer: {
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    width: '100%',
    marginBottom: theme.spacing.md,
    borderWidth: 1.5,
    borderColor: GOLD_COLORS.light,
    ...theme.shadows.small,
  },
  addressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.xs,
  },
  addressLabel: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginLeft: theme.spacing.xs,
    fontWeight: '600',
  },
  addressText: {
    fontSize: 14,
    color: theme.colors.text,
    fontWeight: '500',
    textAlign: 'center',
  },
  copyButton: {
    backgroundColor: GOLD_COLORS.primary,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.xl,
    borderRadius: theme.borderRadius.lg,
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.lg,
    ...theme.shadows.medium,
  },
  copyButtonText: {
    color: theme.colors.secondary,
    fontSize: 18,
    fontWeight: '600',
  },
  warningBox: {
    backgroundColor: '#FFF3CD',
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    width: '100%',
    borderWidth: 1.5,
    borderColor: GOLD_COLORS.primary,
  },
  warningHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.xs,
    justifyContent: 'center',
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
    textAlign: 'center',
  },
  sendSection: {
    width: '100%',
    marginTop: theme.spacing.xl,
    paddingTop: theme.spacing.xl,
    borderTopWidth: 2,
    borderTopColor: GOLD_COLORS.light,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
    justifyContent: 'center',
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginLeft: theme.spacing.sm,
  },
  inputGroup: {
    marginBottom: theme.spacing.md,
    width: '100%',
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  input: {
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    fontSize: 16,
    color: theme.colors.text,
    borderWidth: 1.5,
    borderColor: GOLD_COLORS.light,
    width: '100%',
  },
  sendButton: {
    backgroundColor: GOLD_COLORS.primary,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.xl,
    borderRadius: theme.borderRadius.lg,
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: theme.spacing.md,
    ...theme.shadows.medium,
  },
  sendButtonDisabled: {
    opacity: 0.6,
  },
  sendButtonText: {
    color: theme.colors.secondary,
    fontSize: 18,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.lg,
  },
  modalContent: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    width: '100%',
    maxWidth: 400,
    padding: theme.spacing.xl,
    borderWidth: 2,
    borderColor: GOLD_COLORS.primary,
    ...theme.shadows.large,
  },
  modalHeader: {
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginTop: theme.spacing.sm,
  },
  modalBody: {
    marginBottom: theme.spacing.xl,
  },
  modalText: {
    fontSize: 16,
    color: theme.colors.text,
    textAlign: 'center',
    marginBottom: theme.spacing.md,
  },
  modalAmount: {
    fontSize: 20,
    fontWeight: 'bold',
    color: GOLD_COLORS.primary,
  },
  modalAddress: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    backgroundColor: theme.colors.surfaceAlt,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing.md,
    fontFamily: 'monospace',
  },
  modalBalanceInfo: {
    backgroundColor: GOLD_COLORS.light,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    marginTop: theme.spacing.sm,
  },
  modalBalanceText: {
    fontSize: 14,
    color: theme.colors.text,
    textAlign: 'center',
    marginVertical: theme.spacing.xs,
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
    justifyContent: 'center',
  },
  modalButtonCancel: {
    backgroundColor: theme.colors.surfaceAlt,
    borderWidth: 2,
    borderColor: theme.colors.border,
  },
  modalButtonCancelText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
  },
  modalButtonConfirm: {
    backgroundColor: GOLD_COLORS.primary,
    ...theme.shadows.medium,
  },
  modalButtonConfirmText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.secondary,
  },
});

export default ReceiveScreen;

