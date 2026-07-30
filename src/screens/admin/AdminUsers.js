import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TextInput, 
  TouchableOpacity, 
  Dimensions,
  Alert
} from 'react-native';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { theme } from '../../styles/theme';
import { formatAddress } from '../../utils/validation';
import { getWalletMappings, saveWalletMapping, deleteWalletMapping } from '../../services/storageService';

// Gold color constants
const GOLD_COLORS = {
  primary: '#D4AF37',
  light: '#F4E4BC',
  dark: '#B8941F',
  accent: '#FFD700',
};

const AdminUsers = () => {
  const [mappings, setMappings] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [country, setCountry] = useState('');
  const [walletAddress, setWalletAddress] = useState('');

  useEffect(() => {
    loadMappings();
  }, []);

  const loadMappings = async () => {
    const data = await getWalletMappings();
    setMappings(data);
  };

  const handleAddMapping = async () => {
    if (!country.trim() || !walletAddress.trim()) {
      Alert.alert('Error', 'Please enter both Country and Wallet Address');
      return;
    }

    const result = await saveWalletMapping(country.trim(), walletAddress.trim());
    if (result.success) {
      setMappings(result.mappings);
      setCountry('');
      setWalletAddress('');
      Alert.alert('Success', 'Wallet mapped successfully!');
    } else {
      Alert.alert('Error', result.error);
    }
  };

  const handleDeleteMapping = async (address) => {
    const result = await deleteWalletMapping(address);
    if (result.success) {
      setMappings(result.mappings);
    } else {
      Alert.alert('Error', result.error);
    }
  };

  const filteredMappings = mappings.filter(
    (mapping) =>
      mapping.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
      mapping.country.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.title}>Wallet Mapping</Text>
        <Text style={styles.subtitle}>Connect countries and the Admin wallet (for fees) to their official addresses</Text>
      </View>

      <View style={styles.formContainer}>
        <Text style={styles.sectionTitle}>Add New Mapping</Text>
        
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Country Name</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. India, Russia, UAE, Admin"
            placeholderTextColor={theme.colors.textSecondary}
            value={country}
            onChangeText={setCountry}
          />
        </View>
        
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Wallet Address</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. grx1cf97hmg0kgpclr..."
            placeholderTextColor={theme.colors.textSecondary}
            value={walletAddress}
            onChangeText={setWalletAddress}
          />
        </View>
        
        <TouchableOpacity style={styles.addButton} onPress={handleAddMapping}>
          <Ionicons name="add-circle" size={20} color="#FFFFFF" />
          <Text style={styles.addButtonText}>Save Mapping</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.listContainer}>
        <Text style={styles.sectionTitle}>Saved Mappings ({mappings.length})</Text>

        <View style={styles.searchContainer}>
          <Ionicons name="search-outline" size={20} color={theme.colors.textSecondary} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by country or address..."
            placeholderTextColor={theme.colors.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {filteredMappings.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>No wallet mappings found</Text>
          </View>
        ) : (
          filteredMappings.map((mapping) => (
            <View key={mapping.id} style={styles.mappingCard}>
              <View style={styles.mappingInfo}>
                <View style={styles.countryBadge}>
                  <Text style={styles.countryText}>{mapping.country}</Text>
                </View>
                <Text style={styles.mappingAddress}>{formatAddress(mapping.address)}</Text>
              </View>
              <TouchableOpacity 
                style={styles.deleteBtn}
                onPress={() => handleDeleteMapping(mapping.address)}
              >
                <Ionicons name="trash" size={20} color={theme.colors.error} />
              </TouchableOpacity>
            </View>
          ))
        )}
      </View>
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
    marginBottom: theme.spacing.lg,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: GOLD_COLORS.primary,
    marginBottom: theme.spacing.xs,
  },
  subtitle: {
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
  formContainer: {
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.lg,
    borderRadius: theme.borderRadius.lg,
    marginBottom: theme.spacing.xl,
    borderWidth: 1.5,
    borderColor: GOLD_COLORS.light,
    ...theme.shadows.small,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
  },
  inputGroup: {
    marginBottom: theme.spacing.md,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.xs,
  },
  input: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    fontSize: 16,
    color: theme.colors.text,
    backgroundColor: theme.colors.background,
  },
  addButton: {
    backgroundColor: GOLD_COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    marginTop: theme.spacing.sm,
    gap: theme.spacing.sm,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  listContainer: {
    flex: 1,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: theme.spacing.md,
    marginBottom: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  searchIcon: {
    marginRight: theme.spacing.sm,
  },
  searchInput: {
    flex: 1,
    paddingVertical: theme.spacing.sm,
    fontSize: 16,
    color: theme.colors.text,
  },
  mappingCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing.sm,
    borderWidth: 1,
    borderColor: GOLD_COLORS.light,
  },
  mappingInfo: {
    flex: 1,
  },
  countryBadge: {
    backgroundColor: GOLD_COLORS.light,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 4,
    borderRadius: theme.borderRadius.sm,
    alignSelf: 'flex-start',
    marginBottom: 4,
  },
  countryText: {
    color: GOLD_COLORS.dark,
    fontWeight: '700',
    fontSize: 12,
  },
  mappingAddress: {
    fontSize: 14,
    fontFamily: 'monospace',
    color: theme.colors.text,
  },
  deleteBtn: {
    padding: theme.spacing.sm,
    backgroundColor: theme.colors.error + '10',
    borderRadius: theme.borderRadius.sm,
  },
  emptyState: {
    padding: theme.spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyStateText: {
    fontSize: 16,
    color: theme.colors.textSecondary,
    fontStyle: 'italic',
  }
});

export default AdminUsers;


