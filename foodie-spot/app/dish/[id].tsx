// app/dish/[id].tsx
import { useEffect, useState } from 'react';
import {
  StyleSheet, Text, TouchableOpacity,
  View, ActivityIndicator, Alert,
} from 'react-native';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScrollView } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, Minus, Plus, ShoppingCart } from 'lucide-react-native';
import { restaurantAPI } from '@/services/api';
import { Dish } from '@/types';
import { useCart } from '@/contexts/cart-context';
import { useTheme } from '@/contexts/theme-context';

export default function DishScreen() {
  const { id, restaurantId, restaurantName } = useLocalSearchParams<{
    id: string;
    restaurantId: string;
    restaurantName: string;
  }>();

  const { colors } = useTheme();
  const { addItem, restaurantId: cartRestaurantId, itemCount } = useCart();

  const [dish, setDish] = useState<Dish | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadDish();
  }, [id, restaurantId]);

  const loadDish = async () => {
    if (!restaurantId) {
      setError('Restaurant introuvable');
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      setError('');
      const menu = await restaurantAPI.getMenu(restaurantId);
      const found = menu.find((d: Dish) => d.id === id) ?? null;
      if (!found) setError('Plat introuvable');
      setDish(found);
    } catch {
      setError('Impossible de charger ce plat');
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = () => {
    if (!dish) return;

    // Prévenir le mix de restaurants
    if (cartRestaurantId && cartRestaurantId !== restaurantId) {
      Alert.alert(
        'Nouveau restaurant',
        'Votre panier contient des articles d\'un autre restaurant. Vider le panier et continuer ?',
        [
          { text: 'Annuler', style: 'cancel' },
          {
            text: 'Vider et continuer',
            style: 'destructive',
            onPress: () => {
              addItem(dish, restaurantId, restaurantName ?? '', quantity);
              router.back();
            },
          },
        ]
      );
      return;
    }

    addItem(dish, restaurantId, restaurantName ?? '', quantity);
    Alert.alert(
      '✅ Ajouté au panier',
      `${quantity}× ${dish.name}`,
      [
        { text: 'Continuer', style: 'cancel' },
        { text: 'Voir le panier', onPress: () => router.push('/cart') },
      ]
    );
  };

  // — Loading —
  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
        <TouchableOpacity style={[styles.backButton, { backgroundColor: colors.surface }]} onPress={() => router.back()}>
          <ArrowLeft size={24} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Chargement du plat...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // — Erreur —
  if (error || !dish) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
        <TouchableOpacity style={[styles.backButton, { backgroundColor: colors.surface }]} onPress={() => router.back()}>
          <ArrowLeft size={24} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.centered}>
          <Text style={{ fontSize: 48 }}>😕</Text>
          <Text style={[styles.errorText, { color: colors.text }]}>{error || 'Plat introuvable'}</Text>
          <TouchableOpacity onPress={loadDish} style={[styles.retryButton, { backgroundColor: colors.primary }]}>
            <Text style={styles.retryText}>Réessayer</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false}>

        {/* Image + bouton retour */}
        <View style={styles.imageWrapper}>
          <Image source={{ uri: dish.image }} style={styles.image} contentFit="cover" />
          <TouchableOpacity
            style={[styles.backButton, { backgroundColor: colors.surface }]}
            onPress={() => router.back()}
          >
            <ArrowLeft size={24} color={colors.text} />
          </TouchableOpacity>

          {/* Badge panier */}
          {itemCount > 0 && (
            <TouchableOpacity
              style={[styles.cartBadge, { backgroundColor: colors.primary }]}
              onPress={() => router.push('/cart')}
            >
              <ShoppingCart size={18} color="#fff" />
              <Text style={styles.cartBadgeText}>{itemCount}</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={[styles.content, { backgroundColor: colors.background }]}>
          <Text style={[styles.name, { color: colors.text }]}>{dish.name}</Text>

          {dish.description ? (
            <Text style={[styles.description, { color: colors.textSecondary }]}>{dish.description}</Text>
          ) : null}

          {/* Calories / tags si disponibles */}
          {(dish as any).calories && (
            <Text style={[styles.meta, { color: colors.textTertiary }]}>
              🔥 {(dish as any).calories} kcal
            </Text>
          )}

          {/* Prix + quantité */}
          <View style={styles.priceRow}>
            <Text style={[styles.price, { color: colors.primary }]}>{dish.price.toFixed(2)} €</Text>
            <View style={styles.qtyControls}>
              <TouchableOpacity
                style={[
                  styles.qtyButton,
                  { backgroundColor: quantity === 1 ? colors.border : colors.primary },
                ]}
                onPress={() => setQuantity(q => Math.max(1, q - 1))}
                disabled={quantity === 1}
              >
                <Minus size={18} color="#fff" />
              </TouchableOpacity>
              <Text style={[styles.qtyValue, { color: colors.text }]}>{quantity}</Text>
              <TouchableOpacity
                style={[styles.qtyButton, { backgroundColor: colors.primary }]}
                onPress={() => setQuantity(q => q + 1)}
              >
                <Plus size={18} color="#fff" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Total partiel */}
          <Text style={[styles.subTotal, { color: colors.textSecondary }]}>
            Total : {(dish.price * quantity).toFixed(2)} €
          </Text>

          <TouchableOpacity
            style={[styles.addButton, { backgroundColor: colors.primary }]}
            onPress={handleAddToCart}
          >
            <ShoppingCart size={20} color="#fff" />
            <Text style={styles.addButtonText}>
              Ajouter au panier — {(dish.price * quantity).toFixed(2)} €
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  imageWrapper: { position: 'relative' },
  image: { width: '100%', height: 280 },
  backButton: {
    position: 'absolute',
    top: 16, left: 16,
    width: 40, height: 40,
    borderRadius: 20,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4, elevation: 3,
  },
  cartBadge: {
    position: 'absolute',
    top: 16, right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 4,
  },
  cartBadgeText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  content: { padding: 20, gap: 12 },
  name: { fontSize: 24, fontWeight: 'bold' },
  description: { fontSize: 15, lineHeight: 22 },
  meta: { fontSize: 13 },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  price: { fontSize: 22, fontWeight: '800' },
  qtyControls: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  qtyButton: {
    width: 38, height: 38, borderRadius: 19,
    alignItems: 'center', justifyContent: 'center',
  },
  qtyValue: { fontSize: 18, fontWeight: '700', minWidth: 24, textAlign: 'center' },
  subTotal: { fontSize: 14, textAlign: 'right', marginTop: -4 },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    padding: 16,
    gap: 8,
    marginTop: 8,
  },
  addButtonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40, gap: 12 },
  loadingText: { fontSize: 15, marginTop: 8 },
  errorText: { fontSize: 16, fontWeight: '600', textAlign: 'center' },
  retryButton: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 10, marginTop: 8 },
  retryText: { color: '#fff', fontWeight: '600' },
});