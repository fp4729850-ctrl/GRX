import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { ethers } from 'ethers';
import { useWallet } from '../context/WalletContext';
import {
  sendTransaction,
  sendTokenTransaction,
  estimateGas,
  getGasPrice,
} from '../services/networkService';
import { sendCustodialTransaction } from '../services/custodialService';
import { getWalletAddress } from '../services/storageService';
import { validateAddress, validateAmount } from '../utils/validation';
import ConfirmModal from '../components/ConfirmModal';
import { theme } from '../styles/theme';

const SendScreen = ({ navigation }) => {
  const {
    privateKey,
    walletAddress,
    currentNetwork,
    isTestnet,
    ethBalance,
    usdtBalance,
    custodialMode,
  } = useWallet();
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [gasLimit, setGasLimit] = useState('');
  const [tokenType, setTokenType] = useState('ETH'); // ETH or USDT
  const [loading, setLoading] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [transactionFee, setTransactionFee] = useState('0');
  const [estimatedGas, setEstimatedGas] = useState(null);

  useEffect(() => {
    calculateFee();
  }, [amount, recipient, gasLimit, tokenType, custodialMode]);

  const calculateFee = async () => {
    if (custodialMode) {
      setTransactionFee('Managed by GRX');
      return;
    }

    if (!amount || !recipient || !validateAddress(recipient)) {
      setTransactionFee('0');
      return;
    }

    try {
      const gasPrice = await getGasPrice(currentNetwork, isTestnet);
      const gas = gasLimit || estimatedGas || 21000n; // Default gas limit
      const fee = (gas * gasPrice) / BigInt(10 ** 18);
      setTransactionFee(fee.toString());
    } catch (error) {
      console.error('Error calculating fee:', error);
    }
  };

  const handleEstimateGas = async () => {
    if (custodialMode) {
      Alert.alert(
        'Custodial Mode',
        'Gas estimation is handled by the GRX backend when custodial mode is active.'
      );
      return;
    }

    if (!recipient || !amount || !validateAddress(recipient)) {
      Alert.alert('Error', 'Please enter valid recipient and amount');
      return;
    }

    try {
      const senderAddress = walletAddress || (await getWalletAddress());
      const value = tokenType === 'ETH' 
        ? ethers.parseEther(amount)
        : '0x0';
      
      const gas = await estimateGas(
        senderAddress,
        recipient,
        value,
        '0x',
        currentNetwork,
        isTestnet
      );
      setEstimatedGas(gas);
      setGasLimit(gas.toString());
    } catch (error) {
      console.error('Error estimating gas:', error);
      
      // Check for insufficient funds error
      if (error.code === 'INSUFFICIENT_FUNDS' || error.message?.includes('insufficient funds')) {
        Alert.alert(
          'Insufficient Funds',
          'You do not have enough balance to complete this transaction. Please check your wallet balance and try again.'
        );
      } else {
        Alert.alert('Error', 'Failed to estimate gas. Please check your inputs and try again.');
      }
    }
  };

  const handleSend = () => {
    if (!recipient || !validateAddress(recipient)) {
      Alert.alert('Error', 'Please enter a valid recipient address');
      return;
    }

    if (!amount || !validateAmount(amount)) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }

    const balance = tokenType === 'ETH' ? ethBalance : usdtBalance;
    if (parseFloat(amount) > parseFloat(balance)) {
      Alert.alert('Error', 'Insufficient balance');
      return;
    }

    setShowConfirm(true);
  };

  const handleConfirmTransaction = async () => {
    setLoading(true);
    setShowConfirm(false);

    try {
      if (custodialMode) {
        const response = await sendCustodialTransaction({
          from: walletAddress,
          to: recipient,
          amount,
          token: tokenType,
          network: currentNetwork,
          isTestnet,
        });
        Alert.alert(
          'Request Submitted',
          `Custodial transfer queued. Reference: ${response?.reference || response?.id || 'pending'}`,
          [
            {
              text: 'OK',
              onPress: () => navigation.goBack(),
            },
          ]
        );
        return;
      }

      let tx;
      if (tokenType === 'ETH') {
        tx = await sendTransaction(
          privateKey,
          recipient,
          amount,
          gasLimit || undefined,
          currentNetwork,
          isTestnet
        );
      } else {
        // USDT - need decimals (6 for USDT)
        tx = await sendTokenTransaction(
          privateKey,
          recipient,
          amount,
          6, // USDT decimals
          gasLimit || undefined,
          currentNetwork,
          isTestnet
        );
      }

      Alert.alert('Success', `Transaction sent! Hash: ${tx.hash}`, [
        {
          text: 'OK',
          onPress: () => {
            navigation.goBack();
            // Refresh balances
            setTimeout(() => {
              // Trigger balance refresh in dashboard
            }, 2000);
          },
        },
      ]);
    } catch (error) {
      console.error('Transaction error:', error);
      
      // Check for insufficient funds error
      if (error.code === 'INSUFFICIENT_FUNDS' || error.message?.includes('insufficient funds')) {
        Alert.alert(
          'Insufficient Funds',
          'You do not have enough balance to complete this transaction. Please check your wallet balance and try again.'
        );
      } else if (error.code === 'UNPREDICTABLE_GAS_LIMIT') {
        Alert.alert(
          'Transaction Error',
          'Unable to estimate gas. This may be due to insufficient funds or an invalid transaction. Please check your balance and try again.'
        );
      } else {
        Alert.alert(
          'Transaction Failed',
          error.message || 'An error occurred while sending the transaction. Please try again.'
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const transactionDetails = {
    to: recipient,
    amount: amount,
    symbol: tokenType,
    gasLimit: custodialMode ? 'Backend managed' : gasLimit || 'Auto',
    fee: custodialMode
      ? 'Handled by GRX operations'
      : `${transactionFee} ${currentNetwork === 'ETHEREUM' ? 'ETH' : 'BNB'}`,
    mode: custodialMode ? 'Custodial (backend-managed)' : 'On-chain (self custody)',
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.form}>
        <View
          style={[
            styles.modeBanner,
            custodialMode ? styles.custodialBanner : styles.onchainBanner,
          ]}
        >
          <Text style={styles.modeBannerText}>
            {custodialMode
              ? 'Custodial wallet enabled · Requests are sent to the GRX backend team.'
              : 'On-chain mode · You will sign this transaction directly with your device.'}
          </Text>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Token</Text>
          <View style={styles.tokenSelector}>
            <TouchableOpacity
              style={[
                styles.tokenButton,
                tokenType === 'ETH' && styles.tokenButtonActive,
              ]}
              onPress={() => setTokenType('ETH')}
            >
              <Text
                style={[
                  styles.tokenButtonText,
                  tokenType === 'ETH' && styles.tokenButtonTextActive,
                ]}
              >
                {currentNetwork === 'ETHEREUM' ? 'ETH' : 'BNB'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.tokenButton,
                tokenType === 'USDT' && styles.tokenButtonActive,
              ]}
              onPress={() => setTokenType('USDT')}
            >
              <Text
                style={[
                  styles.tokenButtonText,
                  tokenType === 'USDT' && styles.tokenButtonTextActive,
                ]}
              >
                USDT
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Recipient Address</Text>
          <TextInput
            style={styles.input}
            value={recipient}
            onChangeText={setRecipient}
            placeholder="0x..."
            autoCapitalize="none"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>
            Amount (Balance: {tokenType === 'ETH' ? ethBalance : usdtBalance})
          </Text>
          <TextInput
            style={styles.input}
            value={amount}
            onChangeText={setAmount}
            placeholder="0.0"
            keyboardType="decimal-pad"
          />
        </View>

        <View style={styles.inputGroup}>
          <View style={styles.gasRow}>
            <Text style={styles.label}>Gas Limit (Optional)</Text>
            <TouchableOpacity
              style={[styles.estimateButton, custodialMode && styles.disabledButton]}
              onPress={handleEstimateGas}
              disabled={custodialMode}
            >
              <Text style={styles.estimateButtonText}>
                {custodialMode ? 'Managed' : 'Estimate'}
              </Text>
            </TouchableOpacity>
          </View>
          <TextInput
            style={[styles.input, custodialMode && styles.inputDisabled]}
            value={gasLimit}
            onChangeText={setGasLimit}
            placeholder="Auto"
            keyboardType="numeric"
            editable={!custodialMode}
          />
        </View>

        <View style={styles.feeContainer}>
          <Text style={styles.feeLabel}>
            {custodialMode ? 'Service Routing:' : 'Network Fee:'}
          </Text>
          <Text style={styles.feeValue}>
            {custodialMode
              ? 'Handled by GRX backend'
              : `${transactionFee} ${currentNetwork === 'ETHEREUM' ? 'ETH' : 'BNB'}`}
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.sendButton, loading && styles.buttonDisabled]}
          onPress={handleSend}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={theme.colors.secondary} />
          ) : (
            <Text style={styles.sendButtonText}>Send</Text>
          )}
        </TouchableOpacity>
      </View>

      <ConfirmModal
        visible={showConfirm}
        onClose={() => setShowConfirm(false)}
        onConfirm={handleConfirmTransaction}
        transactionDetails={transactionDetails}
        loading={loading}
      />
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
  form: {
    gap: theme.spacing.lg,
  },
  inputGroup: {
    marginBottom: theme.spacing.md,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  tokenSelector: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  tokenButton: {
    flex: 1,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
    backgroundColor: theme.colors.background,
    borderWidth: 2,
    borderColor: theme.colors.border,
  },
  tokenButtonActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  tokenButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
  },
  tokenButtonTextActive: {
    color: theme.colors.secondary,
  },
  input: {
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    fontSize: 16,
    color: theme.colors.text,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  gasRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  estimateButton: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
  },
  estimateButtonText: {
    color: theme.colors.primary,
    fontSize: 14,
    fontWeight: '600',
  },
  feeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing.md,
  },
  feeLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
  },
  feeValue: {
    fontSize: 16,
    color: theme.colors.textSecondary,
  },
  sendButton: {
    backgroundColor: theme.colors.primary,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    alignItems: 'center',
    marginTop: theme.spacing.md,
    ...theme.shadows.medium,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  sendButtonText: {
    color: theme.colors.secondary,
    fontSize: 18,
    fontWeight: '600',
  },
  modeBanner: {
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.lg,
  },
  custodialBanner: {
    backgroundColor: theme.colors.surfaceAlt,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  onchainBanner: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  modeBannerText: {
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
  disabledButton: {
    opacity: 0.5,
  },
  inputDisabled: {
    backgroundColor: theme.colors.surfaceAlt,
  },
});

export default SendScreen;

