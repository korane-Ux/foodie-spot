// app/(tabs)/_layout.tsx
import { Tabs, router } from 'expo-router';
import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, TouchableOpacity } from 'react-native';

import { HapticTab } from '@/components/haptic-tab';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useCart } from '@/contexts/cart-context';
import { useTheme } from '@/contexts/theme-context';

// Badge animé affiché sur l'icône panier
function CartBadge({ count }: { count: number }) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const { colors } = useTheme();

  useEffect(() => {
    if (count === 0) return;
    // Petit "pop" à chaque ajout
    Animated.sequence([
      Animated.spring(scaleAnim, { toValue: 1.5, useNativeDriver: true, speed: 40 }),
      Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, speed: 20 }),
    ]).start();
  }, [count]);

  if (count === 0) return null;

  return (
    <Animated.View
      style={[
        styles.badge,
        { backgroundColor: colors.primary, transform: [{ scale: scaleAnim }] },
      ]}
    >
      <Text style={styles.badgeText}>{count > 99 ? '99+' : count}</Text>
    </Animated.View>
  );
}

// Icône panier avec badge
function CartTabIcon({ color }: { color: string }) {
  const { itemCount } = useCart();
  return (
    <View style={styles.iconWrapper}>
      <IconSymbol size={28} name="cart.fill" color={color} />
      <CartBadge count={itemCount} />
    </View>
  );
}

export default function TabLayout() {
  const { colors, isDark } = useTheme();
  const { itemCount } = useCart();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textTertiary,
        tabBarStyle: {
          backgroundColor: colors.tabBar,
          borderTopColor: colors.borderLight,
          borderTopWidth: 1,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '500',
        },
        headerShown: false,
        tabBarButton: HapticTab,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Accueil',
          tabBarIcon: ({ color }) => (
            <IconSymbol size={28} name="house.fill" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          title: 'Recherche',
          tabBarIcon: ({ color }) => (
            <IconSymbol size={28} name="magnifyingglass" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="orders"
        options={{
          title: 'Commandes',
          tabBarIcon: ({ color }) => (
            <IconSymbol size={28} name="bag" color={color} />
          ),
        }}
      />

      {/* Onglet Panier — centré, mis en avant */}
      <Tabs.Screen
        name="cart-tab"
        options={{
          title: 'Panier',
          tabBarIcon: ({ color }) => <CartTabIcon color={color} />,
          tabBarBadge: undefined, // on gère nous-mêmes via CartTabIcon
        }}
        listeners={{
          tabPress: (e) => {
            // Intercepter la tab et naviguer vers /cart (écran modal)
            e.preventDefault();
            router.push('/cart');
          },
        }}
      />

      <Tabs.Screen
        name="favorites"
        options={{
          title: 'Favoris',
          tabBarIcon: ({ color }) => (
            <IconSymbol size={28} name="heart.fill" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="notifications"
        options={{
          title: 'Notifications',
          tabBarIcon: ({ color }) => (
            <View style={styles.iconWrapper}>
              <IconSymbol size={28} name="alarm.fill" color={color} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profil',
          tabBarIcon: ({ color }) => (
            <IconSymbol size={28} name="person.fill" color={color} />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  iconWrapper: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    top: -6,
    right: -10,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    borderWidth: 1.5,
    borderColor: '#fff',
  },
  badgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '800',
    lineHeight: 12,
  },
});