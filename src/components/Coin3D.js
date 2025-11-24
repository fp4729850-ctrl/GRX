import React from "react";
import { View, StyleSheet } from "react-native";
import Svg, {
  Defs,
  RadialGradient,
  Stop,
  Circle,
  LinearGradient,
  Rect,
} from "react-native-svg";
import { theme } from "../styles/theme";

const Coin3D = () => {
  return (
    <View style={styles.wrapper}>
      <Svg width={220} height={220}>
        <Defs>
          <RadialGradient
            id="coinFace"
            cx="50%"
            cy="40%"
            rx="50%"
            ry="60%"
            fx="40%"
            fy="30%"
          >
            <Stop offset="0%" stopColor="#FFF5D7" />
            <Stop offset="45%" stopColor="#F7D37B" />
            <Stop offset="100%" stopColor="#C58A1C" />
          </RadialGradient>
          <RadialGradient
            id="coinRim"
            cx="50%"
            cy="50%"
            rx="50%"
            ry="50%"
          >
            <Stop offset="0%" stopColor="#FAD591" />
            <Stop offset="60%" stopColor="#D4932C" />
            <Stop offset="100%" stopColor="#8A5A10" />
          </RadialGradient>
          <LinearGradient id="shadow" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor="rgba(0,0,0,0.25)" />
            <Stop offset="100%" stopColor="rgba(0,0,0,0)" />
          </LinearGradient>
        </Defs>

        <Rect
          x="10"
          y="170"
          width="200"
          height="30"
          rx="15"
          fill="url(#shadow)"
          opacity={0.35}
        />

        <Circle cx="110" cy="110" r="100" fill="url(#coinRim)" />
        <Circle cx="110" cy="110" r="85" fill="url(#coinFace)" />
        <Circle
          cx="110"
          cy="110"
          r="60"
          stroke="#8A5A10"
          strokeWidth="2"
          fill="transparent"
        />
      </Svg>
      <View style={styles.textBadge}>
        <View style={styles.badgeRow}>
          <View style={styles.badgePill}>
            <Svg width={12} height={12}>
              <Circle cx="6" cy="6" r="5" fill={theme.colors.primary} />
            </Svg>
          </View>
          <View style={styles.badgeDivider} />
          <View style={styles.badgePillAlt}>
            <Svg width={12} height={12}>
              <Circle cx="6" cy="6" r="5" fill={theme.colors.accent} />
            </Svg>
          </View>
        </View>
        <View style={styles.labelRow}>
          <View>
            <View style={styles.badgeLabelRow}>
              <View style={styles.badgeDot} />
              <View>
                <View style={styles.badgeLabelLine} />
                <View style={styles.badgeLabelLineShort} />
              </View>
            </View>
          </View>
          <View>
            <View style={styles.badgeLabelRow}>
              <View style={[styles.badgeDot, styles.badgeDotAlt]} />
              <View>
                <View style={styles.badgeLabelLine} />
                <View style={styles.badgeLabelLineShort} />
              </View>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    alignItems: "center",
    justifyContent: "center",
  },
  textBadge: {
    marginTop: -40,
    alignItems: "center",
  },
  badgeRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    gap: 12,
  },
  badgePill: {
    width: 36,
    height: 16,
    borderRadius: 999,
    backgroundColor: "rgba(255, 255, 255, 0.85)",
    justifyContent: "center",
    alignItems: "center",
  },
  badgePillAlt: {
    width: 36,
    height: 16,
    borderRadius: 999,
    backgroundColor: "rgba(12, 74, 110, 0.15)",
    justifyContent: "center",
    alignItems: "center",
  },
  badgeDivider: {
    width: 24,
    height: 1,
    backgroundColor: "rgba(15, 23, 42, 0.2)",
  },
  labelRow: {
    flexDirection: "row",
    gap: 32,
  },
  badgeLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  badgeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.colors.primary,
  },
  badgeDotAlt: {
    backgroundColor: theme.colors.accent,
  },
  badgeLabelLine: {
    width: 48,
    height: 4,
    borderRadius: 2,
    backgroundColor: "rgba(15, 23, 42, 0.25)",
    marginBottom: 4,
  },
  badgeLabelLineShort: {
    width: 32,
    height: 4,
    borderRadius: 2,
    backgroundColor: "rgba(15, 23, 42, 0.15)",
  },
});

export default Coin3D;


