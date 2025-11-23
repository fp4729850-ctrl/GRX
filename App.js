import React, { useState, useEffect } from 'react';
import { AppState, Platform } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { WalletProvider, useWallet } from './src/context/WalletContext';
import { getWalletAddress, getAppLocked, setAppLocked } from './src/services/storageService';

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

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

// Main app tabs (shown after wallet is set up)
const MainTabs = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#2196F3',
        tabBarInactiveTintColor: '#757575',
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopWidth: 1,
          borderTopColor: '#E0E0E0',
        },
      }}
    >
      <Tab.Screen 
        name="Dashboard" 
        component={DashboardScreen}
        options={{ title: 'Wallet' }}
      />
      <Tab.Screen 
        name="Receive" 
        component={ReceiveScreen}
        options={{ title: 'Receive' }}
      />
      <Tab.Screen 
        name="Settings" 
        component={SettingsScreen}
        options={{ title: 'Settings' }}
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
    setupAppLock();
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
            backgroundColor: '#2196F3',
          },
          headerTintColor: '#FFFFFF',
          headerTitleStyle: {
            fontWeight: 'bold',
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
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default function App() {
  return (
    <WalletProvider>
      <RootNavigator />
    </WalletProvider>
  );
}
