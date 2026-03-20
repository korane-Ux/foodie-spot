// =============================================================
// app/(tabs)/index.tsx
// Écran d'accueil - liste des restaurants proches
// =============================================================

import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator, FlatList,
  RefreshControl, StyleSheet, Text,
  TouchableOpacity, View,
} from 'react-native';
import { router } from 'expo-router';
import { MapPin, Search } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CategoryList } from '@/components/category-list';
import { RestaurantCard } from '@/components/restaurant-card';
import { CartBar } from '@/components/cart-bar';
import { restaurantAPI, promoAPI } from '@/services/api';
import { locationService } from '@/services/location';
import { useTheme } from '@/contexts/theme-context';
import { useI18n } from '@/contexts/i18n-context';
import { useToast } from '@/components/toast-provider';
import { Restaurant, PromoResult } from '@/types';
import { COLORS } from '@/constants/theme';

export default function HomeScreen() {
  const { colors } = useTheme();
  const { t } = useI18n();
  const toast = useToast();

  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [location, setLocation] = useState<string>('');
  const [coords, setCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const [promos, setPromos] = useState<PromoResult[]>([]);

  // Chargement principal : restaurants + promos en parallèle
  const loadData = useCallback(async (lat?: number, lng?: number) => {
    try {
      // Promise.all pour charger les deux en même temps et gagner du temps
      const [data, promoData] = await Promise.all([
        restaurantAPI.getRestaurants(lat && lng ? { lat, lng } : undefined),
        promoAPI.getAvailable(),
      ]);
      setRestaurants(data);
      setPromos(promoData);
    } catch (err) {
      console.log('Erreur chargement home:', err); // TODO: améliorer la gestion d'erreur
      toast.error(t('common.error'));
    } finally {
      setLoading(false);
    }
  }, []);

  // Récupère la position GPS pour trier les restaurants par distance
  const getCurrentLocation = useCallback(async () => {
    setLocation(t('home.locating'));
    const position = await locationService.getCurrentLocation();
    if (position) {
      setCoords(position);
      const address = await locationService.reverseGeoCode(position);
      if (address) setLocation(address);
      await loadData(position.latitude, position.longitude);
    } else {
      // Si la localisation échoue, on charge quand même les restaurants
      console.log('Localisation non disponible, chargement sans tri par distance');
      setLocation('Paris, France');
      await loadData();
    }
  }, [loadData]);

  useEffect(() => {
    getCurrentLocation();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData(coords?.latitude, coords?.longitude);
    setRefreshing(false);
  };

  // Bannière promo dynamique depuis l'API (avant c'était hardcodé)
  const PromoBanner = () => {
    if (promos.length === 0) return null;
    const promo = promos[0];
    return (
      <View style={styles.promoBanner}>
        <Text style={styles.promoLabel}>{t('home.promoLabel')}</Text>
        <Text style={styles.promoTitle}>{promo.description}</Text>
        <Text style={styles.promoCode}>Code : {promo.code}</Text>
      </View>
    );
  };

  const ListHeader = () => (
    <>
      <PromoBanner />
      <CategoryList />
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          {t('home.nearby')}
        </Text>
        <Text style={[styles.sectionCount, { color: colors.textSecondary }]}>
          {restaurants.length}{' '}
          {restaurants.length > 1 ? t('home.restaurantsPlural') : t('home.restaurants')}
        </Text>
      </View>
    </>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>

      {/* Header avec localisation et barre de recherche */}
      <View style={[styles.header, { backgroundColor: COLORS.primary }]}>
        <View style={styles.locationRow}>
          <MapPin size={20} color="#fff" />
          <View style={{ flex: 1 }}>
            <Text style={styles.locationLabel}>{t('home.deliveryTo')}</Text>
            <Text style={styles.locationText} numberOfLines={1}>
              {location || t('home.locating')}
            </Text>
          </View>
        </View>

        {/* La barre de recherche navigue vers l'écran Search */}
        <TouchableOpacity
          style={styles.searchBar}
          onPress={() => router.push('/(tabs)/search')}
          activeOpacity={0.8}
          accessibilityLabel={t('home.searchPlaceholder')}
          accessibilityRole="button"
        >
          <Search size={20} color="#999" />
          <Text style={styles.searchPlaceholder}>{t('home.searchPlaceholder')}</Text>
        </TouchableOpacity>
      </View>

      {/* Spinner pendant le chargement initial */}
      {loading ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={[styles.loaderText, { color: colors.textSecondary }]}>
            {t('common.loading')}
          </Text>
        </View>
      ) : (
        <FlatList
          data={restaurants}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <RestaurantCard
              restaurant={item}
              onPress={() => router.push(`/restaurant/${item.id}`)}
            />
          )}
          ListHeaderComponent={<ListHeader />}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListEmptyComponent={
            <Text style={[styles.emptyText, { color: colors.textMuted }]}>
              {t('home.noRestaurants')}
            </Text>
          }
        />
      )}

      {/* Barre flottante panier (visible seulement si panier non vide) */}
      <CartBar />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { padding: 16, paddingBottom: 20 },
  locationRow: {
    flexDirection: 'row', alignItems: 'center',
    gap: 8, marginBottom: 16,
  },
  locationLabel: { fontSize: 12, color: 'rgba(255,255,255,0.8)' },
  locationText: { fontSize: 16, fontWeight: '600', color: '#fff' },
  searchBar: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: '#fff', borderRadius: 24,
    paddingHorizontal: 16, paddingVertical: 12,
  },
  searchPlaceholder: { flex: 1, fontSize: 14, color: 'rgba(0,0,0,0.5)' },
  loaderContainer: {
    flex: 1, justifyContent: 'center',
    alignItems: 'center', gap: 12,
  },
  loaderText: { fontSize: 15 },
  listContent: { paddingBottom: 120 },
  promoBanner: {
    margin: 16, padding: 16,
    backgroundColor: COLORS.secondary,
    borderRadius: 16,
  },
  promoLabel: {
    fontSize: 10, fontWeight: '700', color: '#fff',
    letterSpacing: 1, marginBottom: 4, textTransform: 'uppercase',
  },
  promoTitle: { fontSize: 18, fontWeight: 'bold', color: '#fff', marginBottom: 4 },
  promoCode: { fontSize: 13, color: 'rgba(255,255,255,0.9)' },
  sectionHeader: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16, marginBottom: 8,
  },
  sectionTitle: { fontSize: 18, fontWeight: '700' },
  sectionCount: { fontSize: 14 },
  emptyText: { textAlign: 'center', padding: 40, fontSize: 16 },
});
