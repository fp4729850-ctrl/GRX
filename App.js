// CRITICAL: Polyfills must be imported FIRST, before any other imports
import 'react-native-get-random-values';
import { Buffer } from 'buffer';
global.Buffer = Buffer;
import 'text-encoding-polyfill';

import React, { useState, useEffect } from 'react';
import { AppState, Platform, View, TouchableOpacity, Text } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { SafeAreaProvider, SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { WalletProvider, useWallet } from './src/context/WalletContext';
import { getWalletAddress, getAppLocked, setAppLocked } from './src/services/storageService';
import { isPINVerificationValid, isPINSet } from './src/services/pinService';
import { theme } from './src/styles/theme';

// Gold color constants
const GOLD_COLORS = {
  primary: '#D4AF37',
  light: '#F4E4BC',
  dark: '#B8941F',
  accent: '#FFD700',
};

const isWeb = Platform.OS === 'web';

// Screens
import WelcomeScreen from './src/screens/WelcomeScreen';
import CreateWalletScreen from './src/screens/CreateWalletScreen';
import MnemonicDisplayScreen from './src/screens/MnemonicDisplayScreen';
import MnemonicConfirmScreen from './src/screens/MnemonicConfirmScreen';
import ImportWalletScreen from './src/screens/ImportWalletScreen';
import PINSetupScreen from './src/screens/PINSetupScreen';
import UnlockScreen from './src/screens/UnlockScreen';
import DashboardScreen from './src/screens/DashboardScreen';
import SendScreen from './src/screens/SendScreen';
import ReceiveScreen from './src/screens/ReceiveScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import RedeemScreen from './src/screens/RedeemScreen';
import InvoicesScreen from './src/screens/InvoicesScreen';
import InvoiceDetailScreen from './src/screens/InvoiceDetailScreen';
import MintScreen from './src/screens/MintScreen';
import VaultScreen from './src/screens/VaultScreen';
import OwnershipSwapScreen from './src/screens/OwnershipSwapScreen';
import AdminPanelScreen from './src/screens/AdminPanelScreen';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

// Main app tabs (shown after wallet is set up)
const iconMap = {
  Dashboard: { focused: 'wallet', default: 'wallet-outline', label: 'Wallet' },
  Receive: { focused: 'download', default: 'download-outline', label: 'Receive' },
  Settings: { focused: 'settings', default: 'settings-outline', label: 'Settings' },
};

// Bottom tab navigator used after wallet is initialized
const MainTabs = () => {
  const insets = useSafeAreaInsets();
  
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        
        tabBarHideOnKeyboard: !isWeb,
        tabBarActiveTintColor: GOLD_COLORS.primary,
        tabBarInactiveTintColor: theme.colors.textSecondary,
        tabBarLabelStyle: {
          fontSize: 13,
          fontWeight: '700',
          marginTop: 2,
          marginBottom: 2,
        },
        tabBarItemStyle: {
          borderRadius: 12,
          marginHorizontal: 4,
          paddingVertical: 6,
          marginTop: 4,
        },
        tabBarStyle: {
          backgroundColor: theme.colors.surface,
          borderTopWidth: 2,
          borderTopColor: GOLD_COLORS.primary,
          marginHorizontal: 8,
          // marginBottom: 20,
          borderRadius: 20,
          height: 75 + (Platform.OS === 'android' ? insets.bottom : 0),
          paddingBottom: Platform.OS === 'ios' ? insets.bottom + 4 : insets.bottom + 8,
          paddingTop: 12,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.25,
          shadowRadius: 8,
          elevation: 15,
        },
        tabBarIcon: ({ color, focused }) => {
          const icons = iconMap[route.name];
          const iconName = focused ? icons?.focused : icons?.default;
          return (
            <View
              style={{
              backgroundColor: focused ? GOLD_COLORS.light : 'transparent',
              padding: 8,
              borderRadius: 12,
              }}
            >
              <Ionicons
                name={iconName || 'ellipse'}
                size={focused ? 26 : 24}
                color={color}
              />
            </View>
          );
        },
      })}
    >
      <Tab.Screen 
        name="Dashboard" 
        component={DashboardScreen}
        options={{ title: iconMap.Dashboard.label }}
      />
      <Tab.Screen 
        name="Receive" 
        component={ReceiveScreen}
        options={{ title: iconMap.Receive.label }}
      />
      <Tab.Screen 
        name="Settings" 
        component={SettingsScreen}
        options={{ title: iconMap.Settings.label }}
      />
    </Tab.Navigator>
  );
};

// Root navigator
const RootNavigator = () => {
  const { isWalletInitialized } = useWallet();
  const [isLoading, setIsLoading] = useState(true);
  const [isLocked, setIsLocked] = useState(false);

  useEffect(() => {
    checkWalletStatus();
    return setupAppLock();
  }, []);

  const checkWalletStatus = async () => {
    try {
      const address = await getWalletAddress();
      const locked = await getAppLocked();
      
      // Check if PIN is set and verification is still valid (12 hours)
      if (address) {
        const pinSet = await isPINSet();
        if (pinSet) {
          const pinValid = await isPINVerificationValid();
          // If PIN is set but verification expired, require PIN entry
          if (!pinValid) {
            setIsLocked(true);
            setIsLoading(false);
            return;
          }
        }
      }
      
      setIsLocked(locked && !!address);
      setIsLoading(false);
    } catch (error) {
      setIsLoading(false);
    }
  };

  const setupAppLock = () => {
    // Lock app when it goes to background (skip on web for better UX)
    if (isWeb) return;
    
    const subscription = AppState.addEventListener('change', async (nextAppState) => {
      if (nextAppState === 'background' || nextAppState === 'inactive') {
        const address = await getWalletAddress();
        if (address) {
          await setAppLocked(true);
          setIsLocked(true);
        }
      }
    });

    return () => subscription?.remove();
  };

  const handleUnlock = async () => {
    await setAppLocked(false);
    setIsLocked(false);
    // PIN verification timestamp is stored by UnlockScreen when PIN is verified
  };

  if (isLoading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
        {/* Loading screen can be added here */}
      </SafeAreaView>
    );
  }

  if (isLocked && isWalletInitialized) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
        <UnlockScreen onUnlock={handleUnlock} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <NavigationContainer>
        <Stack.Navigator
          screenOptions={{
          headerStyle: {
            backgroundColor: GOLD_COLORS.primary,
            borderBottomWidth: 2,
            borderBottomColor: GOLD_COLORS.dark,
            elevation: 0,
            shadowOpacity: 0,
          },
          headerTintColor: '#FFFFFF',
          headerTitleStyle: {
            fontWeight: '700',
            fontSize: 18,
          },
          headerBackTitleVisible: false,
          headerLeftContainerStyle: {
            paddingLeft: Platform.OS === 'ios' ? 8 : 0,
          },
        }}
      >
        {!isWalletInitialized ? (
          <>
            <Stack.Screen 
              name="Welcome" 
              component={WelcomeScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen 
              name="CreateWallet" 
              component={CreateWalletScreen}
              options={{ title: 'Create Wallet' }}
            />
            <Stack.Screen 
              name="MnemonicDisplay" 
              component={MnemonicDisplayScreen}
              options={{ title: 'Backup Your Wallet' }}
            />
            <Stack.Screen 
              name="MnemonicConfirm" 
              component={MnemonicConfirmScreen}
              options={{ title: 'Confirm Mnemonic' }}
            />
            <Stack.Screen 
              name="ImportWallet" 
              component={ImportWalletScreen}
              options={{ title: 'Import Wallet' }}
            />
            <Stack.Screen 
              name="PINSetup" 
              component={PINSetupScreen}
              options={{ title: 'Set Up PIN' }}
            />
          </>
        ) : (
          <>
            <Stack.Screen 
              name="MainTabs" 
              component={MainTabs}
              options={{ headerShown: false }}
            />
            <Stack.Screen 
              name="Send" 
              component={SendScreen}
              options={{ title: 'Send' }}
            />
            <Stack.Screen 
              name="Mint" 
              component={MintScreen}
              options={{ title: 'Mint' }}
            />
            <Stack.Screen 
              name="Vault" 
              component={VaultScreen}
              options={{ title: 'Vault' }}
            />
            <Stack.Screen 
              name="Redeem" 
              component={RedeemScreen}
              options={{ title: 'Redeem / Burn' }}
            />
            <Stack.Screen 
              name="Invoices" 
              component={InvoicesScreen}
              options={{ title: 'Invoices' }}
            />
            <Stack.Screen 
              name="InvoiceDetail" 
              component={InvoiceDetailScreen}
              options={{ title: 'Invoice Details' }}
            />
            <Stack.Screen 
              name="OwnershipSwap" 
              component={OwnershipSwapScreen}
              options={{ title: 'Ownership Swapping' }}
            />
            <Stack.Screen 
              name="AdminPanel" 
              component={AdminPanelScreen}
              options={{ title: 'Admin Panel', headerShown: false }}
            />
          </>
        )}
      </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaView>
  );
};


export default function App() {
  return (
    <SafeAreaProvider>
      <WalletProvider>
        <RootNavigator />
      </WalletProvider>
    </SafeAreaProvider>
  );
}