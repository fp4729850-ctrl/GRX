import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { theme } from "../styles/theme";

const MintScreen = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Mint GRX</Text>
      <Text style={styles.subtitle}>
        Minting will be available soon. Stay tuned!
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    alignItems: "center",
    justifyContent: "center",
    padding: theme.spacing.lg,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  subtitle: {
    fontSize: 16,
    color: theme.colors.textSecondary,
    textAlign: "center",
  },
});

export default MintScreen;

