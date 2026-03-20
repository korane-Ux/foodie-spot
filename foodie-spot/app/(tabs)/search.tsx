import React, { useEffect, useState, useRef } from "react";
import { FlatList, StyleSheet, Text, TextInput, TouchableOpacity, View, ActivityIndicator, Alert, Platform } from "react-native";
import { useRouter } from "expo-router";
import { RestaurantCard } from "@/components/restaurant-card";
import { Colors } from "@/constants/theme";
import { restaurantAPI } from "@/services/api";
import { Restaurant, SearchFilters } from "@/types";
import { Filter, Search, Clock, X, Mic, MicOff } from "lucide-react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Audio } from "expo-av";

const RECENT_SEARCHES_KEY = 'RECENT_SEARCHES';
const MAX_RECENT = 6;

export default function SearchScreen() {
    const router = useRouter();
    const [query, setQuery] = useState('');
    const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
    const [allRestaurants, setAllRestaurants] = useState<Restaurant[]>([]);
    const [filters, setFilters] = useState<SearchFilters>({});
    const [showFilters, setShowFilters] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [categories, setCategories] = useState<string[]>(['Burger', 'Pizza', 'Sushi', 'Healthy', 'Desserts']);
    const [recentSearches, setRecentSearches] = useState<string[]>([]);
    const [isFocused, setIsFocused] = useState(false);
    const [suggestions, setSuggestions] = useState<string[]>([]);

    // Recherche vocale
    const [isListening, setIsListening] = useState(false);
    const [voiceStatus, setVoiceStatus] = useState('');
    const recordingRef = useRef<Audio.Recording | null>(null);

    useEffect(() => {
        loadCategories();
        loadRecentSearches();
        loadAllRestaurants();
    }, []);

    // Debounce recherche
    useEffect(() => {
        if (!query) {
            loadRestaurants();
            setSuggestions([]);
            return;
        }
        const s = allRestaurants
            .filter(r => r.name.toLowerCase().includes(query.toLowerCase()))
            .map(r => r.name)
            .slice(0, 4);
        setSuggestions(s);

        const timer = setTimeout(() => {
            loadRestaurants();
        }, 500);
        return () => clearTimeout(timer);
    }, [query, filters]);

    const loadAllRestaurants = async () => {
        try {
            const data = await restaurantAPI.getRestaurants();
            setAllRestaurants(data);
        } catch {}
    };

    const loadCategories = async () => {
        try {
            const data = await restaurantAPI.getCategories();
            if (data && data.length > 0) setCategories(data);
        } catch {}
    };

    const loadRecentSearches = async () => {
        try {
            const stored = await AsyncStorage.getItem(RECENT_SEARCHES_KEY);
            if (stored) setRecentSearches(JSON.parse(stored));
        } catch {}
    };

    const saveRecentSearch = async (term: string) => {
        if (!term.trim()) return;
        try {
            const updated = [term, ...recentSearches.filter(s => s !== term)].slice(0, MAX_RECENT);
            setRecentSearches(updated);
            await AsyncStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
        } catch {}
    };

    const removeRecentSearch = async (term: string) => {
        try {
            const updated = recentSearches.filter(s => s !== term);
            setRecentSearches(updated);
            await AsyncStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
        } catch {}
    };

    const clearAllRecent = async () => {
        try {
            setRecentSearches([]);
            await AsyncStorage.removeItem(RECENT_SEARCHES_KEY);
        } catch {}
    };

    const handleSelectSuggestion = (term: string) => {
        setQuery(term);
        setIsFocused(false);
        saveRecentSearch(term);
    };

    const handleSubmitSearch = () => {
        if (query.trim()) {
            saveRecentSearch(query.trim());
            setIsFocused(false);
        }
    };

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
        setFilters({ ...filters, cuisine: filters.cuisine === cuisine ? undefined : cuisine });
    };

    // ====== RECHERCHE VOCALE ======
    const startVoiceSearch = async () => {
        try {
            // Demander permission micro
            const { granted } = await Audio.requestPermissionsAsync();
            if (!granted) {
                Alert.alert(
                    'Permission requise',
                    'Veuillez autoriser l\'accès au microphone pour la recherche vocale',
                    [{ text: 'OK' }]
                );
                return;
            }

            setIsListening(true);
            setVoiceStatus('Écoute en cours...');

            // Configurer l'enregistrement audio
            await Audio.setAudioModeAsync({
                allowsRecordingIOS: true,
                playsInSilentModeIOS: true,
            });

            const { recording } = await Audio.Recording.createAsync(
                Audio.RecordingOptionsPresets.HIGH_QUALITY
            );
            recordingRef.current = recording;

            // Arrêter automatiquement après 4 secondes
            setTimeout(async () => {
                await stopVoiceSearch();
            }, 4000);

        } catch (error) {
            setIsListening(false);
            setVoiceStatus('');
            Alert.alert('Erreur', 'Impossible de démarrer la recherche vocale');
        }
    };

    const stopVoiceSearch = async () => {
        try {
            if (!recordingRef.current) return;

            setVoiceStatus('Traitement...');
            await recordingRef.current.stopAndUnloadAsync();

            await Audio.setAudioModeAsync({ allowsRecordingIOS: false });

            // Simulation reconnaissance vocale
            // En production : envoyer l'audio à un service STT (Google Speech-to-Text, Whisper, etc.)
            // Ici on simule avec des termes courants pour la démo
            const simulatedTerms = ['Pizza', 'Burger', 'Sushi', 'Pasta', 'Tacos', 'Salade'];
            const randomTerm = simulatedTerms[Math.floor(Math.random() * simulatedTerms.length)];

            setQuery(randomTerm);
            saveRecentSearch(randomTerm);
            setVoiceStatus(`"${randomTerm}" reconnu`);

            setTimeout(() => setVoiceStatus(''), 2000);

        } catch (error) {
            setVoiceStatus('Erreur de reconnaissance');
            setTimeout(() => setVoiceStatus(''), 2000);
        } finally {
            recordingRef.current = null;
            setIsListening(false);
        }
    };

    const handleVoiceButton = () => {
        if (isListening) {
            stopVoiceSearch();
        } else {
            startVoiceSearch();
        }
    };
    // ====== FIN RECHERCHE VOCALE ======

    const showDropdown = isFocused && (query.length > 0 ? suggestions.length > 0 : recentSearches.length > 0);

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            {/* Header recherche */}
            <View style={styles.header}>
                <View style={[styles.searchContainer, isListening && styles.searchContainerListening]}>
                    <Search size={20} color={Colors.light.text} />
                    <TextInput
                        style={styles.searchInput}
                        placeholder={isListening ? "Parlez maintenant..." : "Rechercher un restaurant"}
                        value={query}
                        onChangeText={setQuery}
                        onFocus={() => setIsFocused(true)}
                        onBlur={() => setTimeout(() => setIsFocused(false), 150)}
                        onSubmitEditing={handleSubmitSearch}
                        returnKeyType="search"
                        editable={!isListening}
                    />
                    {query.length > 0 && !isListening && (
                        <TouchableOpacity onPress={() => setQuery('')}>
                            <X size={18} color="#999" />
                        </TouchableOpacity>
                    )}
                    {/* Bouton micro */}
                    <TouchableOpacity
                        style={[styles.micButton, isListening && styles.micButtonActive]}
                        onPress={handleVoiceButton}
                    >
                        {isListening
                            ? <MicOff size={18} color="#fff" />
                            : <Mic size={18} color="#FF6B35" />
                        }
                    </TouchableOpacity>
                </View>
                <TouchableOpacity style={styles.filterButton} onPress={() => setShowFilters(!showFilters)}>
                    <Filter size={24} color={Colors.light.text} />
                </TouchableOpacity>
            </View>

            {/* Bandeau statut vocal */}
            {voiceStatus !== '' && (
                <View style={styles.voiceBanner}>
                    <ActivityIndicator size="small" color="#fff" />
                    <Text style={styles.voiceBannerText}>{voiceStatus}</Text>
                </View>
            )}

            {/* Animation écoute */}
            {isListening && (
                <View style={styles.listeningBanner}>
                    <Text style={styles.listeningText}>🎤 Parlez maintenant... (4 secondes)</Text>
                    <TouchableOpacity onPress={stopVoiceSearch}>
                        <Text style={styles.stopText}>Arrêter</Text>
                    </TouchableOpacity>
                </View>
            )}

            {/* Dropdown suggestions / historique */}
            {showDropdown && (
                <View style={styles.dropdown}>
                    {query.length === 0 && recentSearches.length > 0 && (
                        <>
                            <View style={styles.dropdownHeader}>
                                <Text style={styles.dropdownTitle}>Recherches récentes</Text>
                                <TouchableOpacity onPress={clearAllRecent}>
                                    <Text style={styles.clearAll}>Tout effacer</Text>
                                </TouchableOpacity>
                            </View>
                            {recentSearches.map((term) => (
                                <View key={term} style={styles.dropdownRow}>
                                    <TouchableOpacity style={styles.dropdownItem} onPress={() => handleSelectSuggestion(term)}>
                                        <Clock size={16} color="#999" />
                                        <Text style={styles.dropdownText}>{term}</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity onPress={() => removeRecentSearch(term)}>
                                        <X size={16} color="#ccc" />
                                    </TouchableOpacity>
                                </View>
                            ))}
                        </>
                    )}
                    {query.length > 0 && suggestions.length > 0 && (
                        <>
                            <View style={styles.dropdownHeader}>
                                <Text style={styles.dropdownTitle}>Suggestions</Text>
                            </View>
                            {suggestions.map((s) => (
                                <TouchableOpacity key={s} style={styles.dropdownItem} onPress={() => handleSelectSuggestion(s)}>
                                    <Search size={16} color="#999" />
                                    <Text style={styles.dropdownText}>{s}</Text>
                                </TouchableOpacity>
                            ))}
                        </>
                    )}
                </View>
            )}

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
                                style={[styles.filterChip, filters.cuisine === item && styles.filterChipActive]}
                                onPress={() => toggleCuisine(item)}
                            >
                                <Text style={[styles.filterChipText, filters.cuisine === item && styles.filterChipTextActive]}>
                                    {item}
                                </Text>
                            </TouchableOpacity>
                        )}
                    />
                </View>
            )}

            {/* Résultats */}
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
                            onPress={() => {
                                saveRecentSearch(item.name);
                                router.push(`/restaurant/${item.id}`);
                            }}
                        />
                    )}
                />
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#fff' },
    header: {
        flexDirection: 'row', alignItems: 'center', gap: 12,
        padding: 16, borderBottomWidth: 1, borderBottomColor: '#f0f0f0',
    },
    searchContainer: {
        flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8,
        backgroundColor: '#f5f5f5', paddingHorizontal: 16,
        paddingVertical: 10, borderRadius: 24,
        borderWidth: 2, borderColor: 'transparent',
    },
    searchContainerListening: {
        borderColor: '#FF6B35',
        backgroundColor: '#FFF5F2',
    },
    searchInput: { flex: 1, fontSize: 16 },
    micButton: {
        width: 32, height: 32, borderRadius: 16,
        alignItems: 'center', justifyContent: 'center',
        backgroundColor: '#FFE5DB',
    },
    micButtonActive: {
        backgroundColor: '#FF6B35',
    },
    filterButton: { padding: 8 },
    voiceBanner: {
        flexDirection: 'row', alignItems: 'center', gap: 8,
        backgroundColor: '#10b981', paddingHorizontal: 16, paddingVertical: 8,
    },
    voiceBannerText: { color: '#fff', fontWeight: '600', fontSize: 14 },
    listeningBanner: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        backgroundColor: '#FFF5F2', paddingHorizontal: 16, paddingVertical: 12,
        borderBottomWidth: 1, borderBottomColor: '#FFD5C2',
    },
    listeningText: { fontSize: 14, color: '#FF6B35', fontWeight: '500' },
    stopText: { fontSize: 14, color: '#FF6B35', fontWeight: '700' },
    dropdown: {
        backgroundColor: '#fff', borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0', zIndex: 100,
        shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08, shadowRadius: 4, elevation: 3,
    },
    dropdownHeader: {
        flexDirection: 'row', justifyContent: 'space-between',
        alignItems: 'center', paddingHorizontal: 16, paddingTop: 12, paddingBottom: 4,
    },
    dropdownTitle: { fontSize: 12, fontWeight: '700', color: '#999', textTransform: 'uppercase' },
    clearAll: { fontSize: 12, color: '#FF6B35', fontWeight: '600' },
    dropdownRow: {
        flexDirection: 'row', alignItems: 'center',
        paddingRight: 16, justifyContent: 'space-between',
    },
    dropdownItem: {
        flex: 1, flexDirection: 'row', alignItems: 'center',
        gap: 12, paddingHorizontal: 16, paddingVertical: 12,
    },
    dropdownText: { fontSize: 15, color: '#111827' },
    filters: {
        paddingHorizontal: 16, paddingVertical: 12,
        borderBottomWidth: 1, borderBottomColor: '#f0f0f0',
    },
    filterChip: {
        paddingHorizontal: 16, paddingVertical: 8,
        borderRadius: 20, backgroundColor: '#f5f5f5', marginRight: 8,
    },
    filterChipActive: { backgroundColor: '#FF6B35' },
    filterChipText: { fontSize: 14, color: '#666' },
    filterChipTextActive: { color: '#fff', fontWeight: '600' },
    content: { padding: 16, flexGrow: 1 },
    resultsText: { fontSize: 14, color: '#666', marginBottom: 16 },
    centered: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 },
    loadingText: { marginTop: 12, fontSize: 14, color: '#666' },
    emptyIcon: { fontSize: 48, marginBottom: 12 },
    emptyText: { fontSize: 16, fontWeight: '600', color: '#333' },
    emptySubText: { fontSize: 14, color: '#999', marginTop: 4 },
});