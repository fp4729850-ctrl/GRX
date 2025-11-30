import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Platform,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { theme } from '../styles/theme';
import { isAdminAddress } from '../utils/adminUtils';
import { useWallet } from '../context/WalletContext';

// Gold color constants
const GOLD_COLORS = {
  primary: '#D4AF37',
  light: '#F4E4BC',
  dark: '#B8941F',
  accent: '#FFD700',
};

// Admin sections
import AdminDashboard from './admin/AdminDashboard';
import AdminUsers from './admin/AdminUsers';
import AdminTransactions from './admin/AdminTransactions';
import AdminInvoices from './admin/AdminInvoices';
import AdminOracle from './admin/AdminOracle';
import AdminSystem from './admin/AdminSystem';

const SIDEBAR_SECTIONS = [
  { id: 'dashboard', label: 'Dashboard', icon: 'dashboard' },
  { id: 'users', label: 'Users', icon: 'people' },
  { id: 'transactions', label: 'Transactions', icon: 'swap-horiz' },
  { id: 'invoices', label: 'Invoices', icon: 'receipt-long' },
  { id: 'oracle', label: 'Oracle', icon: 'insights' },
  { id: 'system', label: 'System', icon: 'settings' },
];

const AdminPanelScreen = ({ navigation }) => {
  const { walletAddress } = useWallet();
  const [activeSection, setActiveSection] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const isMobile = Platform.OS !== 'web';
  const screenWidth = Dimensions.get('window').width;
  const isSmallScreen = screenWidth < 768;

  // Check if user is admin
  if (!isAdminAddress(walletAddress)) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <MaterialIcons name="block" size={64} color={theme.colors.error} />
          <Text style={styles.errorTitle}>Access Denied</Text>
          <Text style={styles.errorText}>You do not have permission to access the admin panel.</Text>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const renderContent = () => {
    switch (activeSection) {
      case 'dashboard':
        return <AdminDashboard />;
      case 'users':
        return <AdminUsers />;
      case 'transactions':
        return <AdminTransactions />;
      case 'invoices':
        return <AdminInvoices />;
      case 'oracle':
        return <AdminOracle />;
      case 'system':
        return <AdminSystem />;
      default:
        return <AdminDashboard />;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.menuButton}
          onPress={() => setSidebarOpen(!sidebarOpen)}
        >
          <Ionicons
            name={sidebarOpen ? 'menu' : 'menu-outline'}
            size={24}
            color={GOLD_COLORS.primary}
          />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Admin Panel</Text>
        <TouchableOpacity
          style={styles.closeButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="close" size={24} color={GOLD_COLORS.primary} />
        </TouchableOpacity>
      </View>

      <View style={styles.contentContainer}>
        {/* Sidebar - Modal on mobile, fixed on web */}
        {isMobile ? (
          <Modal
            visible={sidebarOpen}
            animationType="slide"
            transparent={true}
            onRequestClose={() => setSidebarOpen(false)}
          >
            <TouchableOpacity
              style={styles.modalOverlay}
              activeOpacity={1}
              onPress={() => setSidebarOpen(false)}
            >
              <View style={styles.mobileSidebar}>
                <View style={styles.sidebarHeader}>
                  <Text style={styles.sidebarTitle}>Admin Menu</Text>
                  <TouchableOpacity onPress={() => setSidebarOpen(false)}>
                    <Ionicons name="close" size={24} color={GOLD_COLORS.primary} />
                  </TouchableOpacity>
                </View>
                <ScrollView style={styles.sidebarScroll}>
                  {SIDEBAR_SECTIONS.map((section) => (
                    <TouchableOpacity
                      key={section.id}
                      style={[
                        styles.sidebarItem,
                        activeSection === section.id && styles.sidebarItemActive,
                      ]}
                      onPress={() => {
                        setActiveSection(section.id);
                        setSidebarOpen(false);
                      }}
                    >
                      <MaterialIcons
                        name={section.icon}
                        size={24}
                        color={
                          activeSection === section.id
                            ? GOLD_COLORS.primary
                            : theme.colors.textSecondary
                        }
                      />
                      <Text
                        style={[
                          styles.sidebarItemText,
                          activeSection === section.id && styles.sidebarItemTextActive,
                        ]}
                      >
                        {section.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </TouchableOpacity>
          </Modal>
        ) : (
          sidebarOpen && (
            <View style={styles.sidebar}>
              <ScrollView style={styles.sidebarScroll}>
                {SIDEBAR_SECTIONS.map((section) => (
                  <TouchableOpacity
                    key={section.id}
                    style={[
                      styles.sidebarItem,
                      activeSection === section.id && styles.sidebarItemActive,
                    ]}
                    onPress={() => setActiveSection(section.id)}
                  >
                    <MaterialIcons
                      name={section.icon}
                      size={24}
                      color={
                        activeSection === section.id
                          ? GOLD_COLORS.primary
                          : theme.colors.textSecondary
                      }
                    />
                    <Text
                      style={[
                        styles.sidebarItemText,
                        activeSection === section.id && styles.sidebarItemTextActive,
                      ]}
                    >
                      {section.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )
        )}

        <View style={[styles.mainContent, !sidebarOpen && !isMobile && styles.mainContentFull]}>
          {/* Mobile: Show current section name */}
          {isMobile && (
            <View style={styles.mobileSectionHeader}>
              <Text style={styles.mobileSectionTitle}>
                {SIDEBAR_SECTIONS.find((s) => s.id === activeSection)?.label || 'Dashboard'}
              </Text>
            </View>
          )}
          {renderContent()}
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 2,
    borderBottomColor: GOLD_COLORS.primary,
    ...theme.shadows.small,
    zIndex: 10,
  },
  menuButton: {
    padding: theme.spacing.xs,
    minWidth: 44,
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: Platform.OS === 'web' ? 20 : 18,
    fontWeight: '700',
    color: GOLD_COLORS.primary,
    flex: 1,
    textAlign: 'center',
  },
  closeButton: {
    padding: theme.spacing.xs,
    minWidth: 44,
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  contentContainer: {
    flex: 1,
    flexDirection: Platform.OS === 'web' ? 'row' : 'column',
  },
  sidebar: {
    width: Platform.OS === 'web' ? 250 : '100%',
    backgroundColor: theme.colors.surface,
    borderRightWidth: Platform.OS === 'web' ? 2 : 0,
    borderRightColor: GOLD_COLORS.light,
  },
  sidebarScroll: {
    flex: 1,
  },
  sidebarItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: Platform.OS === 'web' ? theme.spacing.md : theme.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    minHeight: 56,
  },
  sidebarItemActive: {
    backgroundColor: GOLD_COLORS.light,
    borderLeftWidth: 4,
    borderLeftColor: GOLD_COLORS.primary,
  },
  sidebarItemText: {
    fontSize: Platform.OS === 'web' ? 16 : 15,
    color: theme.colors.textSecondary,
    marginLeft: theme.spacing.md,
    fontWeight: '500',
  },
  sidebarItemTextActive: {
    color: GOLD_COLORS.dark,
    fontWeight: '700',
  },
  mainContent: {
    flex: 1,
    backgroundColor: theme.colors.background,
    width: Platform.OS === 'web' ? 'auto' : '100%',
  },
  mainContentFull: {
    width: '100%',
  },
  mobileSectionHeader: {
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: GOLD_COLORS.light,
  },
  mobileSectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: GOLD_COLORS.primary,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-start',
  },
  mobileSidebar: {
    width: '80%',
    maxWidth: 300,
    height: '100%',
    backgroundColor: theme.colors.surface,
    borderRightWidth: 2,
    borderRightColor: GOLD_COLORS.primary,
    ...theme.shadows.large,
  },
  sidebarHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 2,
    borderBottomColor: GOLD_COLORS.primary,
    backgroundColor: GOLD_COLORS.light,
  },
  sidebarTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: GOLD_COLORS.dark,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.xl,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: theme.colors.error,
    marginTop: theme.spacing.lg,
    marginBottom: theme.spacing.md,
  },
  errorText: {
    fontSize: 16,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginBottom: theme.spacing.xl,
  },
  backButton: {
    backgroundColor: GOLD_COLORS.primary,
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
  },
  backButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default AdminPanelScreen;

