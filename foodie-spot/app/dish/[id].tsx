// =============================================================
// app/dish/[id].tsx
// Détail d'un plat avec ajout au panier
// =============================================================

import React, { useEffect, useState } from 'react';
import {
  ScrollView, StyleSheet, Text,
  TouchableOpacity, View,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Image } from 'expo-image';
import { ArrowLeft, AlertCircle, Minus, Plus, ShoppingCart } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Loader } from '@/components/ui/loader';
import { restaurantAPI } from '@/services/api';
import { useCart } from '@/contexts/cart-context';
import { useTheme } from '@/contexts/theme-context';
import { useToast } from '@/components/toast-provider';
import { useI18n } from '@/contexts/i18n-context';
import { Dish } from '@/types';
import { COLORS } from '@/constants/theme';

export default function DishScreen() {
  // CORRECTION : le code original utilisait des IDs hardcodés pour trouver le plat
  // Ancien code :
  // const dishData = await Promise.all(['r1', 'r2'].map((rid) => restaurantAPI.getMenu(rid)));
  // → Bug : ne fonctionnait qu'avec r1 et r2, tous les autres restaurants échouaient
  //
  // CORRECTION : on passe restaurantId en paramètre de navigation
  const { id, restaurantId, restaurantName } = useLocalSearchParams<{
    id: string;
    restaurantId: string;
    restaurantName: string;
  }>();

  const { colors } = useTheme();
  const toast = useToast();
  const { t } = useI18n();
  const { addItem, updateQuantity, getItemQuantity } = useCart();

  const [dish, setDish] = useState<Dish | null>(null);
  const [loading, setLoading] = useState(true);
  const [localQty, setLocalQty] = useState(1);

  const cartQty = dish ? getItemQuantity(dish.id) : 0;

  useEffect(() => {
    loadDish();
  }, [id, restaurantId]);

  const loadDish = async () => {
    try {
      if (!restaurantId) {
        toast.error('Paramètre restaurantId manquant');
        router.back();
        return;
      }
      const menu = await restaurantAPI.getMenu(restaurantId);
      const found = menu.find((d) => d.id === id) ?? null;
      setDish(found);

      if (!found) {
        console.log('Plat non trouvé:', id, 'dans restaurant:', restaurantId);
      }
    } catch (err) {
      console.log('Erreur chargement plat:', err);
      toast.error(t('common.error'));
    } finally {
      setLoading(false);
    }
  };

  // CORRECTION : bouton "Ajouter au panier" ne faisait rien dans le code original
  // Ancien code : <TouchableOpacity style={styles.addButton}> (pas de onPress)
  // CORRECTION : on utilise le CartContext
  const handleAddToCart = () => {
    if (!dish || !restaurantId) return;
    for (let i = 0; i < localQty; i++) {
      addItem(dish, restaurantId, restaurantName ?? 'Restaurant');
    }
    toast.success(`${localQty}× ${dish.name} ${t('dish.addedToCart')}`);
    router.back();
  };

  if (loading) return <Loader message={t('dish.loading')} />;

  if (!dish) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.errorState}>
          <AlertCircle size={48} color={colors.textMuted} />
          <Text style={[styles.errorText, { color: colors.textSecondary }]}>
            {t('dish.notFound')}
          </Text>
          <TouchableOpacity onPress={() => router.back()} style={styles.backLink}>
            <Text style={{ color: COLORS.primary, fontWeight: '600' }}>
              {t('dish.back')}
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Image du plat */}
        <View style={styles.imageWrapper}>
          <Image source={{ uri: dish.image }} style={styles.image} />
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => router.back()}
            accessibilityLabel={t('common.back')}
          >
            <ArrowLeft size={22} color="#000" />
          </TouchableOpacity>

          {/* Badges informatifs */}
          <View style={styles.badges}>
            {dish.isVegetarian && (
              <View style={[styles.badge, { backgroundColor: '#4CAF50' }]}>
                <Text style={styles.badgeText}>🌿 Végétarien</Text>
              </View>
            )}
            {dish.isSpicy && (
              <View style={[styles.badge, { backgroundColor: '#F44336' }]}>
                <Text style={styles.badgeText}>🌶️ Épicé</Text>
              </View>
            )}
            {dish.isNew && (
              <View style={[styles.badge, { backgroundColor: COLORS.secondary }]}>
                <Text style={styles.badgeText}>✨ Nouveau</Text>
              </View>
            )}
          </View>
        </View>

        {/* CORRECTION : marginTop: -100 dans le code original était fragile
            Ancien code : container: { flex: 1, marginTop: -100, backgroundColor: '#fff' }
            → Sur les grands écrans ou en landscape, ça décalait tout
            CORRECTION : on supprime ce marginTop négatif et on laisse le layout naturel */}
        <View style={[styles.content, { backgroundColor: colors.background }]}>
          <Text style={[styles.name, { color: colors.text }]}>{dish.name}</Text>
          <Text style={[styles.description, { color: colors.textSecondary }]}>
            {dish.description}
          </Text>

          {/* Allergènes */}
          {dish.allergens && dish.allergens.length > 0 && (
            <View style={[styles.allergensCard, { backgroundColor: colors.backgroundSecondary }]}>
              <Text style={[styles.allergensTitle, { color: colors.text }]}>
                {t('dish.allergens')}
              </Text>
              <Text style={[styles.allergensList, { color: colors.textSecondary }]}>
                {dish.allergens.join(', ')}
              </Text>
            </View>
          )}

          {/* Sélection quantité */}
          <View style={styles.qtySection}>
            <Text style={[styles.priceLabel, { color: colors.text }]}>
              {(dish.price * localQty).toFixed(2)} €
            </Text>
            <View style={styles.qtyControls}>
              <TouchableOpacity
                style={[styles.qtyBtn, localQty === 1 && styles.qtyBtnDisabled]}
                onPress={() => setLocalQty(Math.max(1, localQty - 1))}
                disabled={localQty === 1}
                accessibilityLabel="Diminuer la quantité"
              >
                <Minus size={18} color={localQty === 1 ? '#ccc' : '#fff'} />
              </TouchableOpacity>
              <Text style={[styles.qtyValue, { color: colors.text }]}>{localQty}</Text>
              <TouchableOpacity
                style={styles.qtyBtn}
                onPress={() => setLocalQty(localQty + 1)}
                accessibilityLabel="Augmenter la quantité"
              >
                <Plus size={18} color="#fff" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Bouton ajout au panier */}
          <TouchableOpacity
            style={[styles.addBtn, !dish.isAvailable && styles.addBtnDisabled]}
            onPress={handleAddToCart}
            disabled={!dish.isAvailable}
            accessibilityLabel={t('dish.addToCart')}
          >
            <ShoppingCart size={20} color="#fff" />
            <Text style={styles.addBtnText}>
              {dish.isAvailable
                ? `${t('dish.addToCart')} · ${(dish.price * localQty).toFixed(2)} €`
                : t('dish.unavailable')}
            </Text>
          </TouchableOpacity>

          {cartQty > 0 && (
            <Text style={[styles.alreadyInCart, { color: colors.textSecondary }]}>
              {cartQty} {t('dish.alreadyInCart')}
            </Text>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  imageWrapper: { position: 'relative' },
  image: { width: '100%', height: 280 },
  backBtn: {
    position: 'absolute', top: 16, left: 16,
    backgroundColor: '#fff', borderRadius: 20, padding: 8,
  },
  badges: {
    position: 'absolute', bottom: 12, left: 12,
    flexDirection: 'row', gap: 6,
  },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  badgeText: { color: '#fff', fontSize: 11, fontWeight: '600' },
  content: { padding: 20, gap: 14 },
  name: { fontSize: 24, fontWeight: 'bold' },
  description: { fontSize: 15, lineHeight: 22 },
  allergensCard: { borderRadius: 12, padding: 12 },
  allergensTitle: { fontSize: 14, fontWeight: '700', marginBottom: 4 },
  allergensList: { fontSize: 13 },
  qtySection: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between',
  },
  priceLabel: { fontSize: 24, fontWeight: '700' },
  qtyControls: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  qtyBtn: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: COLORS.primary,
    alignItems: 'center', justifyContent: 'center',
  },
  qtyBtnDisabled: { backgroundColor: '#E0E0E0' },
  qtyValue: { fontSize: 20, fontWeight: '700', minWidth: 28, textAlign: 'center' },
  addBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 10, backgroundColor: COLORS.primary,
    borderRadius: 16, padding: 16, marginTop: 8,
  },
  addBtnDisabled: { backgroundColor: '#ccc' },
  addBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  alreadyInCart: { textAlign: 'center', fontSize: 13 },
  errorState: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    gap: 12, padding: 40,
  },
  errorText: { fontSize: 16 },
  backLink: { marginTop: 8 },
});
