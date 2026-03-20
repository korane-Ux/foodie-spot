import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Image } from 'expo-image';
import { Plus, Minus } from 'lucide-react-native';
import { Dish } from '@/types';
import { useCart } from '@/contexts/cart-context';
import { useTheme } from '@/contexts/theme-context';
import { COLORS } from '@/constants/theme';

interface Props {
  dish: Dish;
  restaurantId: string;
  restaurantName: string;
  onPress?: () => void;
}

export const DishCard: React.FC<Props> = ({ dish, restaurantId, restaurantName, onPress }) => {
  const { colors } = useTheme();
  const { addItem, updateQuantity, getItemQuantity } = useCart();
  const qty = getItemQuantity(dish.id);

  const handleAdd = (e: any) => {
    e.stopPropagation?.();
    addItem(dish, restaurantId, restaurantName);
  };

  const handleDecrease = (e: any) => {
    e.stopPropagation?.();
    updateQuantity(dish.id, qty - 1);
  };

  return (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: colors.card }]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={styles.imageContainer}>
        <Image source={{ uri: dish.image }} style={styles.image} />
        {dish.isPopular && (
          <View style={styles.popularBadge}>
            <Text style={styles.popularText}>🔥</Text>
          </View>
        )}
      </View>

      <View style={styles.info}>
        <Text style={[styles.name, { color: colors.text }]} numberOfLines={1}>{dish.name}</Text>
        <Text style={[styles.description, { color: colors.textSecondary }]} numberOfLines={2}>
          {dish.description}
        </Text>
        <View style={styles.footer}>
          <Text style={styles.price}>{dish.price.toFixed(2)} €</Text>

          {qty === 0 ? (
            <TouchableOpacity style={styles.addBtn} onPress={handleAdd}>
              <Plus size={16} color="#fff" />
            </TouchableOpacity>
          ) : (
            <View style={styles.qtyRow}>
              <TouchableOpacity style={styles.qtyBtn} onPress={handleDecrease}>
                <Minus size={14} color="#fff" />
              </TouchableOpacity>
              <Text style={[styles.qtyText, { color: colors.text }]}>{qty}</Text>
              <TouchableOpacity style={styles.qtyBtn} onPress={handleAdd}>
                <Plus size={14} color="#fff" />
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    borderRadius: 16,
    padding: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  imageContainer: { position: 'relative' },
  image: { width: 90, height: 90, borderRadius: 12, marginRight: 12 },
  popularBadge: {
    position: 'absolute',
    top: 4, left: 4,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 8,
    paddingHorizontal: 4,
  },
  popularText: { fontSize: 10 },
  info: { flex: 1, justifyContent: 'space-between' },
  name: { fontSize: 15, fontWeight: '700' },
  description: { fontSize: 12, lineHeight: 16 },
  footer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 },
  price: { fontSize: 15, fontWeight: '700', color: COLORS.primary },
  addBtn: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: COLORS.primary,
    alignItems: 'center', justifyContent: 'center',
  },
  qtyRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  qtyBtn: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: COLORS.primary,
    alignItems: 'center', justifyContent: 'center',
  },
  qtyText: { fontSize: 15, fontWeight: '700', minWidth: 20, textAlign: 'center' },
});
