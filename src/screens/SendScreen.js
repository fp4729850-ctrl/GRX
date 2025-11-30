import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { ethers } from 'ethers';
import { useWallet } from '../context/WalletContext';

// Gold color constants
const GOLD_COLORS = {
  primary: '#D4AF37',
  light: '#F4E4BC',
  dark: '#B8941F',
  accent: '#FFD700',
};

// Dummy data for testing
const DUMMY_GRX_BALANCE = "1250.5000";
import {
  sendTransaction,
  sendTokenTransaction,
  sendGRXTransaction,
  estimateGas,
  getGasPrice,
} from '../services/networkService';
import { sendCustodialTransaction } from '../services/custodialService';
import { getWalletAddress } from '../services/storageService';
import { validateAddress, validateAmount } from '../utils/validation';
import { useGRXBalance } from '../hooks/useGRXBalance';
import { useGrxPricing } from '../hooks/useGrxPricing';
import { useUserCurrency } from '../hooks/useUserCurrency';
import ConfirmModal from '../components/ConfirmModal';
import SendUsdToGrxCard from '../components/SendUsdToGrxCard';
import { theme } from '../styles/theme';
import { convertGrxToFiat, COUNTRY_OPTIONS, convertFiatBetweenCurrencies } from '../utils/grxPricing';
import { ORACLE_SNAPSHOT_CONFIG } from '../utils/constants';
import { fetchPayoutStatus } from '../services/partnerService';

const SendScreen = ({ navigation }) => {
  const USD_FEE_PERCENT = 0.01;
  const USD_PRECISION = 6;
  const allowedWindowMinutes =
    ORACLE_SNAPSHOT_CONFIG.allowedWindowMinutes || 10;

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
  const [tokenType, setTokenType] = useState('ETH'); // ETH, USDT, or GRX
  const [loading, setLoading] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [transactionFee, setTransactionFee] = useState('0');
  const [estimatedGas, setEstimatedGas] = useState(null);
  const [fiatEstimate, setFiatEstimate] = useState(null);
  const [desiredUsd, setDesiredUsd] = useState('');
  const [usdQuote, setUsdQuote] = useState(null);
  const [converterAmount, setConverterAmount] = useState('1');
  const [converterFromCountry, setConverterFromCountry] = useState('IN');
  const [converterToCountry, setConverterToCountry] = useState('AE');
  const [fromDropdownOpen, setFromDropdownOpen] = useState(false);
  const [toDropdownOpen, setToDropdownOpen] = useState(false);
  const [fromSearchTerm, setFromSearchTerm] = useState('');
  const [toSearchTerm, setToSearchTerm] = useState('');
  const [payoutInvoiceId, setPayoutInvoiceId] = useState('');
  const [payoutStatus, setPayoutStatus] = useState(null);
  const [payoutLoading, setPayoutLoading] = useState(false);
  const [payoutError, setPayoutError] = useState(null);
  const payoutPollRef = useRef(null);
  
  // Get GRX balance
  const {
    balance: grxBalance,
    loading: grxBalanceLoading,
  } = useGRXBalance(walletAddress, currentNetwork, isTestnet);

  const {
    pricing,
    loading: pricingLoading,
    stale: pricingStale,
    warning: pricingWarning,
    refresh: refreshPricing,
  } = useGrxPricing();

  const {
    countryCode: userCountry,
    currencyCode: userCurrencyCode,
    loading: userCurrencyLoading,
  } = useUserCurrency();

  const snapshotDisplay = useMemo(() => {
    if (!pricing) {
      return null;
    }

    const fxMap = {
      INR:
        pricing.fx?.USD_INR ??
        pricing.fx?.INR ??
        pricing.fx?.usd_inr ??
        pricing.fx?.usdInr ??
        null,
      AED:
        pricing.fx?.USD_AED ??
        pricing.fx?.AED ??
        pricing.fx?.usd_aed ??
        pricing.fx?.usdAed ??
        null,
      RUB:
        pricing.fx?.USD_RUB ??
        pricing.fx?.RUB ??
        pricing.fx?.usd_rub ??
        pricing.fx?.usdRub ??
        null,
      CNY:
        pricing.fx?.USD_CNY ??
        pricing.fx?.CNY ??
        pricing.fx?.usd_cny ??
        pricing.fx?.usdCny ??
        null,
    };

    return {
      id: pricing.id,
      goldPerGramUSD: Number(pricing.goldPerGramUSD || 0),
      fx: fxMap,
      lastUpdated: pricing.lastUpdated,
    };
  }, [pricing]);

  const snapshotTimestampLabel = useMemo(() => {
    if (!snapshotDisplay?.lastUpdated) {
      return 'Unknown';
    }
    try {
      const date = new Date(snapshotDisplay.lastUpdated);
      return date.toLocaleString();
    } catch {
      return 'Unknown';
    }
  }, [snapshotDisplay]);

  const snapshotFresh = useMemo(() => {
    if (!pricing?.lastUpdated || !pricing?.goldPerGramUSD) {
      return false;
    }

    try {
      const timestamp = new Date(pricing.lastUpdated).getTime();
      if (Number.isNaN(timestamp)) {
        return false;
      }
      const ageMinutes = (Date.now() - timestamp) / 60000;
      return ageMinutes <= allowedWindowMinutes && pricing.goldPerGramUSD > 0;
    } catch {
      return false;
    }
  }, [pricing, allowedWindowMinutes]);

  const findCountryOption = (code) =>
    COUNTRY_OPTIONS.find((option) => option.code === code) || COUNTRY_OPTIONS[0];

  const fromCountryOption = useMemo(
    () => findCountryOption(converterFromCountry),
    [converterFromCountry]
  );

  const toCountryOption = useMemo(
    () => findCountryOption(converterToCountry),
    [converterToCountry]
  );

  const converterResult = useMemo(() => {
    if (!pricing) {
      return { value: 0, formatted: '0' };
    }
    return convertFiatBetweenCurrencies(
      converterAmount,
      fromCountryOption?.currencyCode,
      toCountryOption?.currencyCode,
      pricing
    );
  }, [converterAmount, fromCountryOption, toCountryOption, pricing]);

  const payoutUpdatedLabel = useMemo(() => {
    if (!payoutStatus?.updatedAt) {
      return null;
    }
    try {
      return new Date(payoutStatus.updatedAt).toLocaleString();
    } catch {
      return payoutStatus.updatedAt;
    }
  }, [payoutStatus]);

  const grxSendDisabled =
    tokenType === 'GRX' &&
    (!snapshotFresh || pricingStale || Number(pricing?.goldPerGramUSD || 0) <= 0);

  const handleSwapCurrencies = () => {
    setConverterFromCountry(converterToCountry);
    setConverterToCountry(converterFromCountry);
  };

  const handleDropdownToggle = (type, nextOpen) => {
    if (type === 'From') {
      setFromDropdownOpen(nextOpen);
      if (nextOpen) {
        setToDropdownOpen(false);
      }
    } else {
      setToDropdownOpen(nextOpen);
      if (nextOpen) {
        setFromDropdownOpen(false);
      }
    }
  };

  const renderCountryDropdown = ({
    type,
    label,
    selectedCode,
    onSelect,
    open,
    searchValue,
    onSearchChange,
  }) => {
    const selectedOption =
      COUNTRY_OPTIONS.find((option) => option.code === selectedCode) ||
      COUNTRY_OPTIONS[0];

    const filteredOptions = COUNTRY_OPTIONS.filter((option) => {
      if (!searchValue) {
        return true;
      }
      const query = searchValue.toLowerCase();
      return (
        option.label.toLowerCase().includes(query) ||
        option.currencyCode.toLowerCase().includes(query)
      );
    });

    return (
      <View style={styles.dropdownContainer}>
        <Text style={styles.dropdownLabel}>{label}</Text>
        <TouchableOpacity
          style={styles.dropdownTrigger}
          onPress={() => {
            handleDropdownToggle(type, !open);
          }}
        >
          <Text style={styles.dropdownTriggerText}>
            {selectedOption ? selectedOption.label : 'Select country'}
          </Text>
        </TouchableOpacity>
        {open && (
          <View style={styles.dropdownPanel}>
            <TextInput
              style={styles.dropdownSearch}
              value={searchValue}
              onChangeText={onSearchChange}
              placeholder="Search country or currency"
            />
            <View style={styles.dropdownList}>
              {filteredOptions.map((option) => (
                <TouchableOpacity
                  key={option.code}
                  style={styles.dropdownOption}
                  onPress={() => {
                    onSelect(option.code);
                    handleDropdownToggle(type, false);
                    onSearchChange('');
                  }}
                >
                  <Text style={styles.dropdownOptionText}>{option.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}
      </View>
    );
  };

  useEffect(() => {
    calculateFee();
  }, [amount, recipient, gasLimit, tokenType, custodialMode]);

  useEffect(() => {
    if (tokenType !== 'GRX' || !amount || !pricing) {
      setFiatEstimate(null);
      return;
    }

    const conversion = convertGrxToFiat(amount, pricing, userCountry);
    setFiatEstimate(conversion);
  }, [amount, tokenType, pricing, userCountry]);

  useEffect(() => {
    if (tokenType !== 'GRX') {
      return;
    }

    if (desiredUsd && usdQuote?.finalGrams) {
      setAmount(usdQuote.finalGrams.toString());
    }
  }, [desiredUsd, usdQuote, tokenType]);

  useEffect(() => {
    if (payoutPollRef.current) {
      clearInterval(payoutPollRef.current);
      payoutPollRef.current = null;
    }

    const normalizedId = payoutInvoiceId.trim();
    if (!normalizedId) {
      setPayoutStatus(null);
      setPayoutError(null);
      setPayoutLoading(false);
      return;
    }

    let isMounted = true;

    const fetchStatus = async () => {
      if (!isMounted) {
        return;
      }
      setPayoutLoading(true);
      try {
        const data = await fetchPayoutStatus(normalizedId);
        if (isMounted) {
          setPayoutStatus(data);
          setPayoutError(null);
        }
      } catch (error) {
        if (isMounted) {
          setPayoutError(error?.message || 'Unable to fetch payout status');
        }
      } finally {
        if (isMounted) {
          setPayoutLoading(false);
        }
      }
    };

    fetchStatus();
      // DISABLED: Polling causes too many API calls
      // payoutPollRef.current = setInterval(fetchStatus, 15000);

    return () => {
      isMounted = false;
      if (payoutPollRef.current) {
        clearInterval(payoutPollRef.current);
        payoutPollRef.current = null;
      }
    };
  }, [payoutInvoiceId]);

  useEffect(() => {
    if (tokenType !== 'GRX') {
      setDesiredUsd('');
      setUsdQuote(null);
    }
  }, [tokenType]);

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
        : '0x0'; // For token transfers, value is 0
      
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
    if (grxSendDisabled) {
      Alert.alert(
        'Live pricing unavailable',
        'Oracle snapshot is stale or gold price unavailable. Refresh pricing before sending.',
        [
          {
            text: 'Refresh',
            onPress: refreshPricing,
          },
          {
            text: 'Cancel',
            style: 'cancel',
          },
        ]
      );
      return;
    }

    if (!recipient || !validateAddress(recipient)) {
      Alert.alert('Error', 'Please enter a valid recipient address');
      return;
    }

    if (!amount || !validateAmount(amount)) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }

    const balance = tokenType === 'ETH' 
      ? ethBalance 
      : tokenType === 'USDT' 
        ? usdtBalance 
        : grxBalance || DUMMY_GRX_BALANCE;
    if (parseFloat(amount) > parseFloat(balance)) {
      Alert.alert('Error', 'Insufficient balance');
      return;
    }

    setShowConfirm(true);
  };

  const handleNavigateHome = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      navigation.navigate('MainTabs', { screen: 'Dashboard' });
    }
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
      } else if (tokenType === 'USDT') {
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
      } else if (tokenType === 'GRX') {
        // GRX - 18 decimals
        tx = await sendGRXTransaction(
          privateKey,
          recipient,
          amount,
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
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        nestedScrollEnabled
        showsVerticalScrollIndicator
      >
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
            <TouchableOpacity
              style={[
                styles.tokenButton,
                tokenType === 'GRX' && styles.tokenButtonActive,
              ]}
              onPress={() => setTokenType('GRX')}
            >
              <Text
                style={[
                  styles.tokenButtonText,
                  tokenType === 'GRX' && styles.tokenButtonTextActive,
                ]}
              >
                GRX
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

        {snapshotDisplay && (
          <View style={styles.snapshotCard}>
            <View style={styles.snapshotHeader}>
              <Text style={styles.snapshotTitle}>Oracle Snapshot</Text>
              <Text style={styles.snapshotTimestamp}>{snapshotTimestampLabel}</Text>
            </View>
            <View style={styles.snapshotRow}>
              <Text style={styles.snapshotLabel}>Gold price (USD / g)</Text>
              <Text style={styles.snapshotValue}>
                ${snapshotDisplay.goldPerGramUSD.toFixed(2)}
              </Text>
            </View>

            <View style={styles.snapshotDivider} />

            <Text style={styles.snapshotLabel}>FX (USD →)</Text>
            <View style={styles.fxGrid}>
              {['INR', 'AED', 'RUB', 'CNY'].map((currency) => (
                <View key={currency} style={styles.fxItem}>
                  <Text style={styles.fxCode}>{currency}</Text>
                  <Text style={styles.fxValue}>
                    {snapshotDisplay.fx?.[currency]
                      ? Number(snapshotDisplay.fx[currency]).toFixed(4)
                      : '--'}
                  </Text>
                </View>
              ))}
            </View>

            <View style={styles.snapshotMetaRow}>
              <Text style={styles.snapshotMetaLabel}>Snapshot ID</Text>
              <Text style={styles.snapshotMetaValue}>{snapshotDisplay.id || 'Unknown'}</Text>
            </View>
            <View style={styles.snapshotMetaRow}>
              <Text style={styles.snapshotMetaLabel}>Signature</Text>
              <Text style={styles.snapshotMetaValue}>
                {pricing?.signature ? `${pricing.signature.slice(0, 10)}…` : '—'}
              </Text>
            </View>
            <View style={styles.snapshotBadgeLine}>
              <Text style={styles.snapshotFootnote}>Using signed snapshot</Text>
            </View>
          </View>
        )}

        {tokenType === 'GRX' && (
          <SendUsdToGrxCard
            pricing={pricing}
            userCountry={userCountry}
            feePct={USD_FEE_PERCENT}
            precision={USD_PRECISION}
            value={desiredUsd}
            onChangeValue={setDesiredUsd}
            onQuoteChange={setUsdQuote}
            snapshotValid={snapshotFresh}
          />
        )}

        <View style={styles.converterCard}>
          <Text style={styles.converterTitle}>FX Converter</Text>
          <Text style={styles.converterSubtitle}>
            Live USD snapshot · choose any country pair
          </Text>
          <TextInput
            style={styles.converterInput}
            value={converterAmount}
            onChangeText={setConverterAmount}
            keyboardType="decimal-pad"
            placeholder="Enter amount"
          />
          <View style={styles.dropdownRow}>
            {renderCountryDropdown({
              type: 'From',
              label: 'From',
              selectedCode: converterFromCountry,
              onSelect: setConverterFromCountry,
              open: fromDropdownOpen,
              searchValue: fromSearchTerm,
              onSearchChange: setFromSearchTerm,
            })}
            <TouchableOpacity style={styles.swapButton} onPress={handleSwapCurrencies}>
              <Ionicons name="swap-horizontal" size={20} color="#FFFFFF" />
            </TouchableOpacity>
            {renderCountryDropdown({
              type: 'To',
              label: 'To',
              selectedCode: converterToCountry,
              onSelect: setConverterToCountry,
              open: toDropdownOpen,
              searchValue: toSearchTerm,
              onSearchChange: setToSearchTerm,
            })}
          </View>
          <Text style={styles.converterResult}>
            {pricing
              ? `${converterAmount || 0} ${fromCountryOption.currencyCode} ≈ ${converterResult.formatted}`
              : 'Loading oracle FX…'}
          </Text>
          <Text style={styles.converterNote}>
            Rates based on signed oracle snapshot ({snapshotTimestampLabel})
          </Text>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>
            Amount (Balance: {
              tokenType === 'ETH' 
                ? ethBalance 
                : tokenType === 'USDT' 
                  ? usdtBalance 
                  : grxBalanceLoading 
                    ? '...' 
                    : grxBalance || DUMMY_GRX_BALANCE
            })
          </Text>
          <TextInput
            style={styles.input}
            value={amount}
            onChangeText={setAmount}
            placeholder="0.0"
            keyboardType="decimal-pad"
          />
          {tokenType === 'GRX' && (
            <View style={styles.livePriceContainer}>
              <Text style={styles.livePriceText}>
                {pricingLoading || userCurrencyLoading
                  ? 'Loading live price...'
                  : fiatEstimate
                    ? `You are sending ≈ ${fiatEstimate.formattedValue} (auto-calculated)`
                    : userCurrencyCode
                      ? `Enter amount to preview ${userCurrencyCode}`
                      : 'Enter amount to preview fiat value'}
              </Text>
              {pricingWarning && (
                <View style={styles.warningRow}>
                  <Ionicons name="warning-outline" size={16} color={theme.colors.warning} />
                  <Text style={styles.warningText}>{pricingWarning}</Text>
                </View>
              )}
            </View>
          )}
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

        <View style={styles.payoutCard}>
          <Text style={styles.payoutTitle}>Payout Confirmation</Text>
          <Text style={styles.payoutHelper}>
            Track partner settlement status (auto-refreshes every 15s)
          </Text>
          <TextInput
            style={styles.payoutInput}
            value={payoutInvoiceId}
            onChangeText={setPayoutInvoiceId}
            placeholder="Enter invoice ID (e.g., INV-123)"
            autoCapitalize="none"
            autoCorrect={false}
          />
          {!payoutInvoiceId.trim() ? (
            <Text style={styles.payoutPlaceholder}>
              Enter an invoice ID to start receiving confirmations.
            </Text>
          ) : payoutError ? (
            <Text style={styles.payoutError}>{payoutError}</Text>
          ) : payoutStatus ? (
            <>
              <View style={styles.payoutRow}>
                <Text style={styles.payoutLabel}>Currency</Text>
                <Text style={styles.payoutValue}>
                  {payoutStatus.payoutCurrency || '--'}
                </Text>
              </View>
              <View style={styles.payoutRow}>
                <Text style={styles.payoutLabel}>Amount</Text>
                <Text style={styles.payoutValue}>
                  {payoutStatus.payoutAmount || '--'}
                </Text>
              </View>
              <View style={styles.payoutRow}>
                <Text style={styles.payoutLabel}>Partner</Text>
                <Text style={styles.payoutValue}>
                  {payoutStatus.partnerId || '--'}
                </Text>
              </View>
              <View style={styles.payoutRow}>
                <Text style={styles.payoutLabel}>Confirmation</Text>
                <Text style={styles.payoutValue}>
                  {payoutStatus.payoutTx ||
                    payoutStatus.confirmationCode ||
                    'Pending'}
                </Text>
              </View>
              {payoutUpdatedLabel && (
                <Text style={styles.payoutUpdated}>
                  Updated {payoutUpdatedLabel}
                </Text>
              )}
            </>
          ) : payoutLoading ? (
            <View style={styles.payoutLoadingRow}>
              <ActivityIndicator size="small" color={theme.colors.primary} />
              <Text style={styles.payoutHelper}>Waiting for confirmation…</Text>
            </View>
          ) : (
            <Text style={styles.payoutPlaceholder}>Waiting for first update…</Text>
          )}
        </View>

        {tokenType === 'GRX' && (pricingStale || !snapshotFresh) && (
          <View style={styles.staleNotice}>
            <Text style={styles.staleNoticeText}>
              {pricingStale
                ? 'Live FX rate expired. Refresh before sending.'
                : 'Oracle snapshot expired. Refresh before sending.'}
            </Text>
            <TouchableOpacity onPress={refreshPricing}>
              <Text style={styles.refreshText}>Refresh</Text>
            </TouchableOpacity>
          </View>
        )}

        <TouchableOpacity
          style={[
            styles.sendButton,
            (loading || grxSendDisabled) && styles.buttonDisabled,
          ]}
          onPress={handleSend}
          disabled={loading || grxSendDisabled}
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
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    height:'80vh',
    backgroundColor: theme.colors.background,
  },
  container: {
    flex: 1,
    height:'80vh',
    overflowY: 'auto',
    scrollbarWidth: 'none',
    msOverflowStyle: 'none',
    backgroundColor: theme.colors.background,
  },
  content: {
    padding: theme.spacing.lg,
    paddingBottom: theme.spacing.xl * 2,
    flexGrow: 1,
  },
  form: {
    height:'80vh',
    overflowY: 'auto',
    scrollbarWidth: 'none',
    msOverflowStyle: 'none',
    gap: theme.spacing.lg,
    flexGrow: 1,
  },
  breadcrumbRow: {
    marginBottom: theme.spacing.sm,
  },
  breadcrumbButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  breadcrumbIcon: {
    fontSize: 20,
    color: theme.colors.primary,
    fontWeight: '600',
  },
  breadcrumbText: {
    fontSize: 14,
    color: theme.colors.primary,
    fontWeight: '600',
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
    backgroundColor: GOLD_COLORS.primary,
    borderColor: GOLD_COLORS.primary,
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
    borderWidth: 1.5,
    borderColor: GOLD_COLORS.light,
  },
  converterCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    gap: theme.spacing.sm,
    borderWidth: 1.5,
    borderColor: GOLD_COLORS.light,
    ...theme.shadows.small,
  },
  converterTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.text,
  },
  converterSubtitle: {
    fontSize: 13,
    color: theme.colors.textSecondary,
  },
  converterInput: {
    backgroundColor: theme.colors.surfaceAlt,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    fontSize: 16,
    color: theme.colors.text,
  },
  dropdownRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: theme.spacing.sm,
  },
  dropdownContainer: {
    flex: 1,
    position: 'relative',
  },
  dropdownLabel: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.xs / 2,
  },
  dropdownTrigger: {
    backgroundColor: theme.colors.surfaceAlt,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: theme.spacing.sm,
  },
  dropdownTriggerText: {
    color: theme.colors.text,
    fontSize: 14,
  },
  dropdownPanel: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    marginTop: theme.spacing.xs,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    maxHeight: 220,
    zIndex: 1000,
    ...theme.shadows.small,
  },
  dropdownSearch: {
    borderBottomWidth: 1,
    borderColor: theme.colors.border,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
  },
  dropdownList: {
    maxHeight: 160,
    ...Platform.select({
      web: {
        overflowY: 'auto',
        WebkitOverflowScrolling: 'touch',
      },
      default: {},
    }),
  },
  dropdownOption: {
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  dropdownOptionText: {
    color: theme.colors.text,
    fontSize: 14,
  },
  swapButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: GOLD_COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 22,
    ...theme.shadows.small,
  },
  converterResult: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
  },
  converterNote: {
    fontSize: 12,
    color: theme.colors.textSecondary,
  },
  livePriceContainer: {
    marginTop: theme.spacing.xs,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.sm,
  },
  livePriceText: {
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
  warningRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: theme.spacing.xs,
  },
  warningText: {
    fontSize: 12,
    color: theme.colors.warning || theme.colors.textSecondary,
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
  payoutCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    gap: theme.spacing.sm,
    borderWidth: 1.5,
    borderColor: GOLD_COLORS.light,
    ...theme.shadows.small,
  },
  payoutTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.text,
  },
  payoutHelper: {
    fontSize: 12,
    color: theme.colors.textSecondary,
  },
  payoutInput: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.sm,
    fontSize: 14,
    color: theme.colors.text,
    backgroundColor: theme.colors.surfaceAlt,
  },
  payoutPlaceholder: {
    fontSize: 13,
    color: theme.colors.textSecondary,
  },
  payoutRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  payoutLabel: {
    fontSize: 13,
    color: theme.colors.textSecondary,
  },
  payoutValue: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text,
    textAlign: 'right',
  },
  payoutError: {
    color: theme.colors.error,
    fontSize: 13,
  },
  payoutUpdated: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.xs,
  },
  payoutLoadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  snapshotCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    borderWidth: 1.5,
    borderColor: GOLD_COLORS.light,
    ...theme.shadows.small,
  },
  snapshotHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  snapshotTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.colors.text,
  },
  snapshotTimestamp: {
    fontSize: 12,
    color: theme.colors.textSecondary,
  },
  snapshotRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  snapshotLabel: {
    fontSize: 13,
    color: theme.colors.textSecondary,
  },
  snapshotValue: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.text,
  },
  snapshotDivider: {
    height: 1,
    backgroundColor: theme.colors.border,
    marginVertical: theme.spacing.sm,
  },
  fxGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: theme.spacing.sm,
  },
  fxItem: {
    width: '50%',
    marginBottom: theme.spacing.sm,
  },
  fxCode: {
    fontSize: 12,
    color: theme.colors.textSecondary,
  },
  fxValue: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
  },
  snapshotMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: theme.spacing.xs,
  },
  snapshotMetaLabel: {
    fontSize: 12,
    color: theme.colors.textSecondary,
  },
  snapshotMetaValue: {
    fontSize: 12,
    color: theme.colors.text,
    fontWeight: '500',
  },
  snapshotBadgeLine: {
    marginTop: theme.spacing.sm,
  },
  snapshotFootnote: {
    marginTop: theme.spacing.sm,
    fontSize: 12,
    color: theme.colors.textSecondary,
  },
  snapshotErrorBanner: {
    backgroundColor: theme.colors.surfaceAlt,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginBottom: theme.spacing.sm,
  },
  snapshotErrorText: {
    color: theme.colors.warning,
    fontSize: 13,
    fontWeight: '600',
  },
  staleNotice: {
    backgroundColor: theme.colors.surfaceAlt,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  staleNoticeText: {
    color: theme.colors.text,
    fontSize: 14,
  },
  refreshText: {
    color: theme.colors.primary,
    fontWeight: '600',
  },
  sendButton: {
    backgroundColor: GOLD_COLORS.primary,
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

