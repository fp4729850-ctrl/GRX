import React, { useState, useEffect } from 'react';
import { AppState, Platform, View, TouchableOpacity, Text } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { WalletProvider, useWallet } from './src/context/WalletContext';
import { getWalletAddress, getAppLocked, setAppLocked } from './src/services/storageService';
import { theme } from './src/styles/theme';

// Gold color constants
const GOLD_COLORS = {
  primary: '#D4AF37',
  light: '#F4E4BC',
  dark: '#B8941F',
  accent: '#FFD700',
};

// Polyfill Buffer for web
if (Platform.OS === 'web') {
  global.Buffer = require('buffer').Buffer;
}

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


const MainTabs = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarHideOnKeyboard: !isWeb,
        tabBarActiveTintColor: GOLD_COLORS.primary,
        tabBarInactiveTintColor: theme.colors.textSecondary,
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
          marginTop: 4,
        },
        tabBarItemStyle: {
          borderRadius: 16,
          marginHorizontal: 6,
          paddingVertical: 4,
        },
        tabBarStyle: {
          backgroundColor: theme.colors.surface,
          borderTopWidth: 2,
          borderTopColor: GOLD_COLORS.light,
          marginHorizontal: 16,
          marginBottom: 16,
          borderRadius: 24,
          height: 70,
          paddingBottom: 10,
          paddingTop: 10,
          shadowColor: GOLD_COLORS.primary,
          shadowOpacity: 0.3,
          shadowRadius: 12,
          elevation: 12,
        },
        tabBarIcon: ({ color, focused, size }) => {
          const icons = iconMap[route.name];
          const iconName = focused ? icons?.focused : icons?.default;
          return (
            <View style={{
              backgroundColor: focused ? GOLD_COLORS.light : 'transparent',
              padding: 8,
              borderRadius: 12,
            }}>
              <Ionicons name={iconName || 'ellipse'} size={focused ? 24 : 22} color={color} />
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
  };

  if (isLoading) {
    return null; // You can add a loading screen here
  }

  if (isLocked && isWalletInitialized) {
    return <UnlockScreen onUnlock={handleUnlock} />;
  }

  return (
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
