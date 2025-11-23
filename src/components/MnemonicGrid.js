import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { theme } from '../styles/theme';

const MnemonicGrid = ({ words }) => {
  return (
    <View style={styles.container}>
      {words.map((word, index) => (
        <View key={index} style={styles.wordContainer}>
          <Text style={styles.wordNumber}>{index + 1}</Text>
          <Text style={styles.word}>{word}</Text>
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: theme.spacing.sm,
  },
  wordContainer: {
    width: '30%',
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...theme.shadows.small,
  },
  wordNumber: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginRight: theme.spacing.xs,
    fontWeight: '600',
  },
  word: {
    fontSize: 16,
    color: theme.colors.text,
    fontWeight: '500',
    flex: 1,
  },
});

export default MnemonicGrid;

