// =============================================================
// components/ui/skeleton.tsx
// Effet de chargement "squelette" — montre la structure de la page
// avant que les vraies données arrivent (max 5s)
// =============================================================

import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { useTheme } from '@/contexts/theme-context';

interface SkeletonProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: any;
}

export function Skeleton({ width = '100%', height = 16, borderRadius = 8, style }: SkeletonProps) {
  const { isDark } = useTheme();
  const opacity = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    // Animation pulsée pour simuler un chargement
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 600, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.4, duration: 600, useNativeDriver: true }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, []);

  const bgColor = isDark ? '#2A2D2E' : '#E0E0E0';

  return (
    <Animated.View
      style={[
        { width, height, borderRadius, backgroundColor: bgColor, opacity },
        style,
      ]}
    />
  );
}

// Skeleton complet de la page restaurant
export function RestaurantSkeleton() {
  const { colors } = useTheme();
  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Image */}
      <Skeleton height={220} borderRadius={0} />

      {/* Infos */}
      <View style={styles.infoSection}>
        <Skeleton height={26} width="70%" style={{ marginBottom: 10 }} />
        <Skeleton height={16} width="40%" style={{ marginBottom: 14 }} />
        <View style={styles.metaRow}>
          <Skeleton height={14} width={80} />
          <Skeleton height={14} width={80} />
          <Skeleton height={14} width={80} />
        </View>
        <Skeleton height={60} borderRadius={12} style={{ marginBottom: 14 }} />
        <View style={styles.actionsRow}>
          <Skeleton height={44} width="48%" borderRadius={12} />
          <Skeleton height={44} width="48%" borderRadius={12} />
        </View>
      </View>

      {/* Catégories menu */}
      <View style={styles.catsRow}>
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} height={34} width={80} borderRadius={20} />
        ))}
      </View>

      {/* Plats */}
      <View style={{ padding: 16, gap: 12 }}>
        {[1, 2, 3].map((i) => (
          <View key={i} style={styles.dishRow}>
            <Skeleton width={90} height={90} borderRadius={12} />
            <View style={styles.dishInfo}>
              <Skeleton height={16} width="80%" style={{ marginBottom: 8 }} />
              <Skeleton height={12} width="90%" style={{ marginBottom: 6 }} />
              <Skeleton height={12} width="60%" style={{ marginBottom: 10 }} />
              <Skeleton height={14} width={60} />
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  infoSection: { padding: 16 },
  metaRow: { flexDirection: 'row', gap: 12, marginBottom: 14 },
  actionsRow: { flexDirection: 'row', gap: 12 },
  catsRow: {
    flexDirection: 'row', gap: 10,
    paddingHorizontal: 16, paddingVertical: 12, flexWrap: 'wrap',
  },
  dishRow: { flexDirection: 'row', gap: 12 },
  dishInfo: { flex: 1 },
});
