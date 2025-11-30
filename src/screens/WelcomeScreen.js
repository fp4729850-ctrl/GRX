import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { theme } from '../styles/theme';

// Gold color constants
const GOLD_COLORS = {
  primary: '#D4AF37',
  light: '#F4E4BC',
  dark: '#B8941F',
  accent: '#FFD700',
};

const WelcomeScreen = ({ navigation }) => {
  const fadeAnim = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();
  }, []);

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
        <View style={styles.iconContainer}>
          <MaterialIcons name="account-balance-wallet" size={80} color={GOLD_COLORS.primary} />
        </View>
        <Text style={styles.title}>GRX</Text>
        <Text style={styles.subtitle}>Your Secure Crypto Wallet</Text>
        <Text style={styles.description}>
          Create a new wallet or import an existing one to get started
        </Text>

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => navigation.navigate('CreateWallet')}
          >
            <Text style={styles.primaryButtonText}>Create Wallet</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => navigation.navigate('ImportWallet')}
          >
            <Text style={styles.secondaryButtonText}>Import Wallet</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.lg,
  },
  content: {
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
  },
  iconContainer: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: GOLD_COLORS.light,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  title: {
    fontSize: 48,
    fontWeight: 'bold',
    color: GOLD_COLORS.primary,
    marginBottom: theme.spacing.sm,
  },
  subtitle: {
    fontSize: 24,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
  },
  description: {
    fontSize: 16,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginBottom: theme.spacing.xl,
    lineHeight: 24,
  },
  buttonContainer: {
    width: '100%',
    gap: theme.spacing.md,
  },
  primaryButton: {
    backgroundColor: GOLD_COLORS.primary,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    borderRadius: theme.borderRadius.lg,
    alignItems: 'center',
    ...theme.shadows.medium,
  },
  primaryButtonText: {
    color: theme.colors.secondary,
    fontSize: 18,
    fontWeight: '600',
  },
  secondaryButton: {
    backgroundColor: theme.colors.secondary,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    borderRadius: theme.borderRadius.lg,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: GOLD_COLORS.primary,
    ...theme.shadows.small,
  },
  secondaryButtonText: {
    color: GOLD_COLORS.primary,
    fontSize: 18,
    fontWeight: '600',
  },
});

export default WelcomeScreen;

