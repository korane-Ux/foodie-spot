import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { router } from 'expo-router';
import { ShoppingCart } from 'lucide-react-native';
import { useCart } from '@/contexts/cart-context';

export function CartBar() {
  const { itemCount, subtotal, restaurantName } = useCart();
  const translateY = useRef(new Animated.Value(100)).current;

  useEffect(() => {
    Animated.spring(translateY, {
      toValue: itemCount > 0 ? 0 : 100,
      useNativeDriver: true,
      tension: 80,
      friction: 10,
    }).start();
  }, [itemCount]);

  if (itemCount === 0) return null;

  return (
    <Animated.View style={[styles.container, { transform: [{ translateY }] }]}>
      <TouchableOpacity style={styles.bar} onPress={() => router.push('/cart')} activeOpacity={0.9}>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{itemCount}</Text>
        </View>
        <View style={styles.center}>
          <Text style={styles.restaurant} numberOfLines={1}>{restaurantName}</Text>
          <ShoppingCart size={16} color="#fff" />
        </View>
        <Text style={styles.total}>{subtotal.toFixed(2)} €</Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 90,
    left: 16,
    right: 16,
    zIndex: 999,
  },
  bar: {
    backgroundColor: '#FF6B35',
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
  },
  badge: {
    backgroundColor: '#fff',
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  badgeText: { color: '#FF6B35', fontWeight: '700', fontSize: 14 },
  center: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 },
  restaurant: { flex: 1, color: '#fff', fontWeight: '600', fontSize: 14 },
  total: { color: '#fff', fontWeight: '700', fontSize: 16 },
});
