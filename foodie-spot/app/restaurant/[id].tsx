// =============================================================
// app/restaurant/[id].tsx
// Détail d'un restaurant : infos, menu par catégorie, avis
// =============================================================

import React, { useCallback, useEffect, useState } from 'react';
import {
  Linking, ScrollView, Share,
  StyleSheet, Text, TouchableOpacity, View,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Image } from 'expo-image';
import {
  ArrowLeft, Clock, Heart, Info,
  MapPin, Navigation, Phone, Share2, Star,
} from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { DishCard } from '@/components/dish-card';
import { Loader } from '@/components/ui/loader';
import { CartBar } from '@/components/cart-bar';
import { restaurantAPI, userAPI } from '@/services/api';
import { locationService } from '@/services/location';
import { useTheme } from '@/contexts/theme-context';
import { useToast } from '@/components/toast-provider';
import { useI18n } from '@/contexts/i18n-context';
import { Dish, DeliveryEstimate, MenuCategory, Restaurant, Review } from '@/types';
import { COLORS } from '@/constants/theme';

export default function RestaurantScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useTheme();
  const toast = useToast();
  const { t } = useI18n();

  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [menuCategories, setMenuCategories] = useState<MenuCategory[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [estimate, setEstimate] = useState<DeliveryEstimate | null>(null);
  const [isFavorite, setIsFavorite] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      // Chargement en parallèle pour aller plus vite
      const [restaurantData, menuData, reviewsData] = await Promise.all([
        restaurantAPI.getRestaurantById(id),
        restaurantAPI.getMenuCategories(id),
        restaurantAPI.getReviews(id),
      ]);

      setRestaurant(restaurantData);
      setMenuCategories(menuData);
      setReviews(reviewsData);
      setIsFavorite(restaurantData?.isFavorite ?? false);

      // Première catégorie active par défaut
      if (menuData.length > 0) setActiveCategory(menuData[0].id);

      // Estimation livraison avec GPS
      const coords = await locationService.getCurrentLocation();
      const est = await restaurantAPI.getDeliveryEstimate(
        id,
        coords?.latitude,
        coords?.longitude
      );
      setEstimate(est);

    } catch (err) {
      console.log('Erreur chargement restaurant:', err);
      toast.error(t('common.error'));
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleToggleFavorite = async () => {
    try {
      await userAPI.toggleFavorite(id);
      setIsFavorite((prev) => !prev);
      toast.success(isFavorite ? t('restaurant.removedFavorite') : t('restaurant.addedFavorite'));
    } catch {
      toast.error(t('restaurant.favoritesError'));
    }
  };

  // Ouvre l'app Maps avec l'adresse du restaurant
  const handleCall = () => {
    const phone = restaurant?.phone;
    if (!phone) return;
    Linking.openURL(`tel:${phone}`).catch(() =>
      toast.error("Impossible d'ouvrir le téléphone")
    );
  };

  const handleDirections = () => {
    if (!restaurant) return;
    const { latitude, longitude, address } = restaurant;
    const query = latitude && longitude
      ? `${latitude},${longitude}`
      : encodeURIComponent(address);
    Linking.openURL(`https://maps.google.com/?q=${query}`);
  };

  const handleShare = async () => {
    if (!restaurant) return;
    try {
      await Share.share({
        title: restaurant.name,
        message: `Découvrez ${restaurant.name} sur FoodieSpot ! ${restaurant.address}`,
      });
    } catch { /* l'utilisateur a annulé */ }
  };

  // Formatage du temps de livraison (peut être un objet ou un nombre selon l'API)
  const deliveryDisplay =
    typeof restaurant?.deliveryTime === 'object' && restaurant.deliveryTime !== null
      ? `${(restaurant.deliveryTime as any).min}-${(restaurant.deliveryTime as any).max} min`
      : `${restaurant?.deliveryTime} min`;

  const cuisineDisplay = Array.isArray(restaurant?.cuisine)
    ? restaurant.cuisine.join(' • ')
    : restaurant?.cuisine;

  // Plats de la catégorie sélectionnée
  const activeDishes: Dish[] =
    menuCategories.find((c) => c.id === activeCategory)?.items ?? [];

  if (loading) return <Loader message={t('restaurant.loading')} />;

  if (!restaurant) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Text style={{ color: colors.text, textAlign: 'center', padding: 40 }}>
          {t('restaurant.notFound')}
        </Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false} stickyHeaderIndices={[1]}>

        {/* Image d'en-tête */}
        <View style={styles.imageContainer}>
          <Image source={{ uri: restaurant.image }} style={styles.image} />

          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => router.back()}
            accessibilityLabel={t('common.back')}
          >
            <ArrowLeft size={22} color="#000" />
          </TouchableOpacity>

          <View style={styles.headerActions}>
            <TouchableOpacity
              style={styles.actionBtn}
              onPress={handleToggleFavorite}
              accessibilityLabel={isFavorite ? 'Retirer des favoris' : 'Ajouter aux favoris'}
            >
              <Heart
                size={22}
                color={isFavorite ? COLORS.primary : '#000'}
                fill={isFavorite ? COLORS.primary : 'transparent'}
              />
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionBtn} onPress={handleShare}>
              <Share2 size={20} color="#000" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Informations restaurant */}
        <View style={[styles.infoSection, { backgroundColor: colors.card }]}>
          <Text style={[styles.name, { color: colors.text }]}>{restaurant.name}</Text>
          <Text style={[styles.cuisine, { color: colors.textSecondary }]}>{cuisineDisplay}</Text>

          {/* Métadonnées : note, temps, distance */}
          <View style={styles.metaRow}>
            <View style={styles.metaItem}>
              <Star size={15} color="#FFC107" fill="#FFC107" />
              <Text style={[styles.metaText, { color: colors.textSecondary }]}>
                {restaurant.rating.toFixed(1)} ({restaurant.reviewCount} avis)
              </Text>
            </View>
            <View style={styles.metaItem}>
              <Clock size={15} color={colors.textMuted} />
              <Text style={[styles.metaText, { color: colors.textSecondary }]}>
                {deliveryDisplay}
              </Text>
            </View>
            {restaurant.distance !== undefined && (
              <View style={styles.metaItem}>
                <MapPin size={15} color={colors.textMuted} />
                <Text style={[styles.metaText, { color: colors.textSecondary }]}>
                  {restaurant.distance.toFixed(1)} km
                </Text>
              </View>
            )}
          </View>

          {/* Estimation livraison dynamique (feature J) */}
          {estimate && (
            <View style={[styles.estimateCard, { backgroundColor: colors.backgroundSecondary }]}>
              <Info size={16} color={COLORS.primary} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.estimateTitle, { color: colors.text }]}>
                  {t('restaurant.deliveryEstimate')}
                </Text>
                <Text style={[styles.estimateDetail, { color: colors.textSecondary }]}>
                  ⏱ {estimate.estimatedTime.display}  •  📍 {estimate.distance} km  •  🛵{' '}
                  {estimate.deliveryFee === 0
                    ? t('restaurant.free')
                    : `${estimate.deliveryFee.toFixed(2)} €`}
                </Text>
                {estimate.freeDeliveryThreshold > 0 && (
                  <Text style={[styles.freeDelivery, { color: COLORS.primary }]}>
                    {t('restaurant.freeDeliveryFrom')} {estimate.freeDeliveryThreshold} €
                  </Text>
                )}
              </View>
            </View>
          )}

          {/* Boutons actions */}
          <View style={styles.actionsRow}>
            <TouchableOpacity
              style={[styles.primaryBtn, { backgroundColor: COLORS.primary }]}
              onPress={handleDirections}
              accessibilityLabel={t('restaurant.directions')}
            >
              <Navigation size={16} color="#fff" />
              <Text style={styles.primaryBtnText}>{t('restaurant.directions')}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.secondaryBtn, { backgroundColor: colors.backgroundSecondary }]}
              onPress={handleCall}
              accessibilityLabel={t('restaurant.call')}
            >
              <Phone size={16} color={colors.text} />
              <Text style={[styles.secondaryBtnText, { color: colors.text }]}>
                {t('restaurant.call')}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Onglets de navigation dans le menu */}
        <View style={[styles.categoriesRow, { backgroundColor: colors.card }]}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 16, gap: 10 }}
          >
            {menuCategories.map((cat) => (
              <TouchableOpacity
                key={cat.id}
                style={[
                  styles.catChip,
                  {
                    backgroundColor:
                      activeCategory === cat.id
                        ? COLORS.primary
                        : colors.backgroundSecondary,
                  },
                ]}
                onPress={() => setActiveCategory(cat.id)}
                accessibilityState={{ selected: activeCategory === cat.id }}
              >
                <Text style={[
                  styles.catChipText,
                  { color: activeCategory === cat.id ? '#fff' : colors.textSecondary },
                ]}>
                  {cat.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Liste des plats */}
        <View style={{ padding: 16 }}>
          {activeDishes.map((dish) => (
            <DishCard
              key={dish.id}
              dish={dish}
              restaurantId={id}
              restaurantName={restaurant.name}
              onPress={() =>
                router.push(`/dish/${dish.id}?restaurantId=${id}&restaurantName=${encodeURIComponent(restaurant.name)}`)
              }
            />
          ))}
        </View>

        {/* Avis récents */}
        {reviews.length > 0 && (
          <View style={{ padding: 16 }}>
            <Text style={[styles.reviewsTitle, { color: colors.text }]}>
              {t('restaurant.reviews')}
            </Text>
            {reviews.slice(0, 3).map((review) => (
              <View
                key={review.id}
                style={[styles.reviewCard, { backgroundColor: colors.card, borderColor: colors.border }]}
              >
                <View style={styles.reviewHeader}>
                  <Text style={[styles.reviewUser, { color: colors.text }]}>
                    {review.userName}
                  </Text>
                  <View style={styles.reviewStars}>
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        size={12}
                        color="#FFC107"
                        fill={i < review.rating ? '#FFC107' : 'transparent'}
                      />
                    ))}
                  </View>
                </View>
                {review.comment ? (
                  <Text
                    style={[styles.reviewComment, { color: colors.textSecondary }]}
                    numberOfLines={2}
                  >
                    {review.comment}
                  </Text>
                ) : null}
              </View>
            ))}
          </View>
        )}

        <View style={{ height: 120 }} />
      </ScrollView>

      <CartBar />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  imageContainer: { height: 220, position: 'relative' },
  image: { width: '100%', height: '100%' },
  backBtn: {
    position: 'absolute', top: 16, left: 16,
    backgroundColor: '#fff', borderRadius: 20, padding: 8,
  },
  headerActions: {
    position: 'absolute', top: 16, right: 16,
    flexDirection: 'row', gap: 8,
  },
  actionBtn: { backgroundColor: '#fff', borderRadius: 20, padding: 8 },
  infoSection: { padding: 16 },
  name: { fontSize: 22, fontWeight: 'bold', marginBottom: 4 },
  cuisine: { fontSize: 14, marginBottom: 10 },
  metaRow: { flexDirection: 'row', gap: 16, marginBottom: 14, flexWrap: 'wrap' },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { fontSize: 13 },
  estimateCard: {
    flexDirection: 'row', alignItems: 'flex-start',
    gap: 10, borderRadius: 12, padding: 12, marginBottom: 14,
  },
  estimateTitle: { fontSize: 14, fontWeight: '700', marginBottom: 2 },
  estimateDetail: { fontSize: 13 },
  freeDelivery: { fontSize: 12, fontWeight: '600', marginTop: 4 },
  actionsRow: { flexDirection: 'row', gap: 10 },
  primaryBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', gap: 8, borderRadius: 12, padding: 12,
  },
  primaryBtnText: { color: '#fff', fontWeight: '600' },
  secondaryBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', gap: 8, borderRadius: 12, padding: 12,
  },
  secondaryBtnText: { fontWeight: '600' },
  categoriesRow: { paddingVertical: 12 },
  catChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20 },
  catChipText: { fontSize: 13, fontWeight: '600' },
  reviewsTitle: { fontSize: 18, fontWeight: '700', marginBottom: 12 },
  reviewCard: { borderRadius: 12, padding: 12, marginBottom: 10, borderWidth: 1 },
  reviewHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  reviewUser: { fontWeight: '600', fontSize: 14 },
  reviewStars: { flexDirection: 'row', gap: 2 },
  reviewComment: { fontSize: 13, lineHeight: 18 },
});
