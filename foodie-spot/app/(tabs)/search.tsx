import React, { useEffect, useState, useCallback } from "react";
import { FlatList, StyleSheet, Text, TextInput, TouchableOpacity, View, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { RestaurantCard } from "@/components/restaurant-card";
import { Colors } from "@/constants/theme";
import { restaurantAPI } from "@/services/api";
import { Restaurant, SearchFilters } from "@/types";
import { Filter, Search } from "lucide-react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function SearchScreen() {
    const router = useRouter();
    const [query, setQuery] = useState('');
    const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
    const [filters, setFilters] = useState<SearchFilters>({});
    const [showFilters, setShowFilters] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [categories, setCategories] = useState<string[]>(['Burger', 'Pizza', 'Sushi', 'Healthy', 'Desserts']);

    // Charger les catégories depuis l'API au montage
    useEffect(() => {
        loadCategories();
    }, []);

    const loadCategories = async () => {
        try {
            const data = await restaurantAPI.getCategories();
            if (data && data.length > 0) setCategories(data);
        } catch {
            // fallback sur les catégories par défaut
        }
    };

    // Debounce : attendre 500ms après la dernière frappe avant d'appeler l'API
   useEffect(() => {
    // Si query est vide, charger immédiatement sans debounce
    if (!query) {
        loadRestaurants();
        return;
    }
    // Sinon debounce de 500ms
    const timer = setTimeout(() => {
        loadRestaurants();
    }, 500);
    return () => clearTimeout(timer);
}, [query, filters]);

    const loadRestaurants = async () => {
        setIsLoading(true);
        try {
            if (query) {
                const data = await restaurantAPI.searchRestaurants(query);
                setRestaurants(data);
            } else {
                const data = await restaurantAPI.getRestaurants(filters);
                setRestaurants(data);
            }
        } catch {
            setRestaurants([]);
        } finally {
            setIsLoading(false);
        }
    };

    const toggleCuisine = (cuisine: string) => {
        setFilters({
            ...filters,
            cuisine: filters.cuisine === cuisine ? undefined : cuisine
        });
    };

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            {/* Header recherche */}
            <View style={styles.header}>
                <View style={styles.searchContainer}>
                    <Search size={24} color={Colors.light.text} />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Rechercher un restaurant"
                        value={query}
                        onChangeText={setQuery}
                    />
                </View>
                <TouchableOpacity style={styles.filterButton} onPress={() => setShowFilters(!showFilters)}>
                    <Filter size={24} color={Colors.light.text} />
                </TouchableOpacity>
            </View>

            {/* Filtres catégories */}
            {showFilters && (
                <View style={styles.filters}>
                    <FlatList
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        data={categories}
                        keyExtractor={(item) => item}
                        renderItem={({ item }) => (
                            <TouchableOpacity
                                style={[
                                    styles.filterChip,
                                    filters.cuisine === item && styles.filterChipActive
                                ]}
                                onPress={() => toggleCuisine(item)}
                            >
                                <Text style={[
                                    styles.filterChipText,
                                    filters.cuisine === item && styles.filterChipTextActive
                                ]}>
                                    {item}
                                </Text>
                            </TouchableOpacity>
                        )}
                    />
                </View>
            )}

            {/* État de chargement */}
            {isLoading ? (
                <View style={styles.centered}>
                    <ActivityIndicator size="large" color="#FF6B35" />
                    <Text style={styles.loadingText}>Recherche en cours...</Text>
                </View>
            ) : (
                <FlatList
                    data={restaurants}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={styles.content}
                    ListHeaderComponent={
                        <Text style={styles.resultsText}>
                            {restaurants.length} {restaurants.length > 1 ? 'restaurants' : 'restaurant'} trouvé{restaurants.length > 1 ? 's' : ''}
                        </Text>
                    }
                    ListEmptyComponent={
                        <View style={styles.centered}>
                            <Text style={styles.emptyIcon}>🍽️</Text>
                            <Text style={styles.emptyText}>Aucun restaurant trouvé</Text>
                            <Text style={styles.emptySubText}>Essayez un autre terme ou filtre</Text>
                        </View>
                    }
                    renderItem={({ item }) => (
                        <RestaurantCard
                            restaurant={item}
                            onPress={() => router.push(`/restaurant/${item.id}`)}
                        />
                    )}
                />
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    searchContainer: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        backgroundColor: '#f5f5f5',
        paddingHorizontal: 16,
        paddingVertical: 16,
        borderRadius: 24,
    },
    searchInput: {
        flex: 1,
        fontSize: 16,
    },
    filterButton: {
        padding: 8,
    },
    filters: {
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    filterChip: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: '#f5f5f5',
        marginRight: 8,
    },
    filterChipActive: {
        backgroundColor: '#FF6B35', // chip actif en orange
    },
    filterChipText: {
        fontSize: 14,
        color: '#666',
    },
    filterChipTextActive: {
        color: '#fff',
        fontWeight: '600',
    },
    content: {
        padding: 16,
        flexGrow: 1,
    },
    resultsText: {
        fontSize: 14,
        color: '#666',
        marginBottom: 16,
    },
    centered: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 40,
    },
    loadingText: {
        marginTop: 12,
        fontSize: 14,
        color: '#666',
    },
    emptyIcon: {
        fontSize: 48,
        marginBottom: 12,
    },
    emptyText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
    },
    emptySubText: {
        fontSize: 14,
        color: '#999',
        marginTop: 4,
    },
});