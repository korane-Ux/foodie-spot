import React, { memo } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Image } from 'expo-image';
import { Clock, Heart, MapPin, Star } from 'lucide-react-native';
import { Restaurant } from '@/types';
import { useTheme } from '@/contexts/theme-context';
import { COLORS } from '@/constants/theme';

interface Props {
  restaurant: Restaurant;
  onPress?: () => void;
  compact?: boolean;
}

const RestaurantCardBase: React.FC<Props> = ({ restaurant, onPress, compact }) => {
  const { colors } = useTheme();

  const cuisineDisplay = Array.isArray(restaurant.cuisine)
    ? restaurant.cuisine.slice(0, 2).join(' · ')
    : restaurant.cuisine;

  const deliveryDisplay =
    typeof restaurant.deliveryTime === 'object' && restaurant.deliveryTime !== null
      ? `${(restaurant.deliveryTime as any).min}-${(restaurant.deliveryTime as any).max} min`
      : `${restaurant.deliveryTime} min`;

  return (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: colors.card }, compact && styles.compact]}
      onPress={onPress}
      activeOpacity={0.85}
      accessibilityLabel={`${restaurant.name}, ${cuisineDisplay}, ${restaurant.rating} étoiles`}
      accessibilityRole="button"
    >
      <View style={styles.imageWrapper}>
        <Image
          source={{ uri: restaurant.image }}
          style={[styles.image, compact && styles.imageCompact]}
          contentFit="cover"
        />
        {restaurant.isFavorite && (
          <View style={styles.heartBadge}>
            <Heart size={12} color={COLORS.primary} fill={COLORS.primary} />
          </View>
        )}
        {!restaurant.isOpen && (
          <View style={styles.closedOverlay}>
            <Text style={styles.closedText}>Fermé</Text>
          </View>
        )}
      </View>

      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={[styles.name, { color: colors.text }]} numberOfLines={1}>{restaurant.name}</Text>
          <View style={[styles.priceBadge, { backgroundColor: COLORS.primaryLight }]}>
            <Text style={styles.priceText}>
              {'€'.repeat(typeof restaurant.priceRange === 'number' ? restaurant.priceRange : 2)}
            </Text>
          </View>
        </View>
        <Text style={[styles.cuisine, { color: colors.textSecondary }]}>{cuisineDisplay}</Text>
        <View style={styles.meta}>
          <View style={styles.metaItem}>
            <Star size={13} color="#FFC107" fill="#FFC107" />
            <Text style={[styles.metaText, { color: colors.textSecondary }]}>
              {restaurant.rating.toFixed(1)}
            </Text>
          </View>
          <Text style={[styles.metaDot, { color: colors.border }]}>·</Text>
          <View style={styles.metaItem}>
            <Clock size={13} color={colors.textMuted} />
            <Text style={[styles.metaText, { color: colors.textSecondary }]}>{deliveryDisplay}</Text>
          </View>
          {restaurant.distance !== undefined && (
            <>
              <Text style={[styles.metaDot, { color: colors.border }]}>·</Text>
              <View style={styles.metaItem}>
                <MapPin size={13} color={colors.textMuted} />
                <Text style={[styles.metaText, { color: colors.textSecondary }]}>
                  {restaurant.distance.toFixed(1)} km
                </Text>
              </View>
            </>
          )}
        </View>
        {!compact && restaurant.deliveryFee === 0 && (
          <View style={styles.freeDelivery}>
            <Text style={styles.freeDeliveryText}>🚀 Livraison gratuite</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};

// React.memo évite les re-renders inutiles dans FlatList
export const RestaurantCard = memo(RestaurantCardBase);

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row', marginBottom: 12,
    borderRadius: 16, overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 8, elevation: 2,
  },
  compact: { marginBottom: 8 },
  imageWrapper: { position: 'relative' },
  image: { width: 110, height: 110 },
  imageCompact: { width: 90, height: 90 },
  heartBadge: { position: 'absolute', top: 6, left: 6, backgroundColor: '#fff', width: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  closedOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.45)', alignItems: 'center', justifyContent: 'center' },
  closedText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  content: { flex: 1, padding: 10, justifyContent: 'space-between' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 6 },
  name: { flex: 1, fontSize: 15, fontWeight: '700' },
  priceBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  priceText: { color: COLORS.primary, fontSize: 11, fontWeight: '700' },
  cuisine: { fontSize: 12, marginTop: 2 },
  meta: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 4, marginTop: 4 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  metaText: { fontSize: 12 },
  metaDot: { fontSize: 14 },
  freeDelivery: { marginTop: 6, backgroundColor: '#E8F5E9', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, alignSelf: 'flex-start' },
  freeDeliveryText: { fontSize: 11, color: '#4CAF50', fontWeight: '600' },
});
