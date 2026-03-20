import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Heart } from 'lucide-react-native';
import { restaurantAPI } from '@/services/api';
import { RestaurantCard } from '@/components/restaurant-card';
import { Restaurant } from '@/types';

export default function FavoritesScreen() {
  const [favorites, setFavorites] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFavorites();
  }, []);

  const loadFavorites = async () => {
    try {
      const all = await restaurantAPI.getRestaurants();
      // Filtrer les restaurants favoris (isFavorite ou favorited)
      const favs = all.filter((r: any) => r.isFavorite || r.favorited);
      setFavorites(favs);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#FF6B35" />
          <Text style={styles.loadingText}>Chargement des favoris...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Mes Favoris</Text>
      </View>

      <FlatList
        data={favorites}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.content}
        ListEmptyComponent={
          <View style={styles.centered}>
            <Heart size={64} color="#ccc" />
            <Text style={styles.emptyText}>Aucun favori pour l'instant</Text>
            <Text style={styles.emptySubText}>Ajoutez des restaurants à vos favoris</Text>
            <TouchableOpacity style={styles.button} onPress={() => router.push('/(tabs)/search')}>
              <Text style={styles.buttonText}>Explorer les restaurants</Text>
            </TouchableOpacity>
          </View>
        }
        renderItem={({ item }) => (
          <RestaurantCard
            restaurant={item}
            onPress={() => router.push(`/restaurant/${item.id}`)}
          />
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  title: { fontSize: 24, fontWeight: 'bold', color: '#111827' },
  content: { padding: 16, flexGrow: 1 },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  loadingText: { marginTop: 12, fontSize: 14, color: '#666' },
  emptyText: { fontSize: 16, fontWeight: '600', color: '#333', marginTop: 16 },
  emptySubText: { fontSize: 14, color: '#999', marginTop: 4, marginBottom: 24 },
  button: {
    backgroundColor: '#FF6B35',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  buttonText: { color: '#fff', fontWeight: '600', fontSize: 16 },
});
