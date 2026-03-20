import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator, Alert, FlatList, StyleSheet, Text,
  TextInput, TouchableOpacity, View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Clock, Mic, MicOff, Search, X } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Audio } from 'expo-av';

import { RestaurantCard } from '@/components/restaurant-card';
import { restaurantAPI, searchAPI } from '@/services/api';
import { useTheme } from '@/contexts/theme-context';
import { storage, STORAGE_KEYS } from '@/services/storage';
import { Category, Restaurant } from '@/types';
import { COLORS } from '@/constants/theme';

const DEBOUNCE_MS = 400;

export default function SearchScreen() {
  const router = useRouter();
  const { colors } = useTheme();

  const [query, setQuery] = useState('');
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>();
  const [loading, setLoading] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Recherche vocale
  const [isListening, setIsListening] = useState(false);
  const [voiceStatus, setVoiceStatus] = useState('');
  const recordingRef = useRef<Audio.Recording | null>(null);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    restaurantAPI.getCategories().then(setCategories);
    storage.getItem<string[]>(STORAGE_KEYS.RECENT_SEARCHES).then((r) => {
      if (r) setRecentSearches(r);
    });
    loadRestaurants();
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (query.length === 0) {
      setSuggestions([]);
      loadRestaurants(selectedCategory);
      return;
    }
    if (query.length >= 2) {
      searchAPI.getSuggestions(query).then(setSuggestions);
    }
    debounceRef.current = setTimeout(() => doSearch(query), DEBOUNCE_MS);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query, selectedCategory]);

  useEffect(() => {
    if (!query) loadRestaurants(selectedCategory);
  }, [selectedCategory]);

  const loadRestaurants = async (cuisine?: string) => {
    setLoading(true);
    try {
      const data = await restaurantAPI.getRestaurants({ cuisine });
      setRestaurants(data);
    } finally {
      setLoading(false);
    }
  };

  const doSearch = async (q: string) => {
    setLoading(true);
    setShowSuggestions(false);
    try {
      const data = await restaurantAPI.searchRestaurants(q);
      setRestaurants(data);
      saveRecentSearch(q);
    } finally {
      setLoading(false);
    }
  };

  const saveRecentSearch = async (q: string) => {
    const trimmed = q.trim();
    if (!trimmed) return;
    const updated = [trimmed, ...recentSearches.filter((s) => s !== trimmed)].slice(0, 8);
    setRecentSearches(updated);
    await storage.setItem(STORAGE_KEYS.RECENT_SEARCHES, updated);
  };

  const clearQuery = () => {
    setQuery('');
    setSuggestions([]);
    loadRestaurants(selectedCategory);
  };

  const clearRecent = async () => {
    setRecentSearches([]);
    await storage.removeItem(STORAGE_KEYS.RECENT_SEARCHES);
  };

  // ====== RECHERCHE VOCALE ======
  const startVoiceSearch = async () => {
    try {
      const { granted } = await Audio.requestPermissionsAsync();
      if (!granted) {
        Alert.alert('Permission requise', 'Veuillez autoriser l\'accès au microphone');
        return;
      }
      setIsListening(true);
      setVoiceStatus('Écoute en cours...');
      await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
      const { recording } = await Audio.Recording.createAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
      recordingRef.current = recording;
      setTimeout(() => stopVoiceSearch(), 4000);
    } catch {
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
      // Simulation STT — en prod : envoyer l'audio à Google STT / Whisper
      const terms = ['Pizza', 'Burger', 'Sushi', 'Tacos', 'Salade', 'Pasta'];
      const recognized = terms[Math.floor(Math.random() * terms.length)];
      setQuery(recognized);
      saveRecentSearch(recognized);
      doSearch(recognized);
      setVoiceStatus(`"${recognized}" reconnu`);
      setTimeout(() => setVoiceStatus(''), 2000);
    } catch {
      setVoiceStatus('Erreur de reconnaissance');
      setTimeout(() => setVoiceStatus(''), 2000);
    } finally {
      recordingRef.current = null;
      setIsListening(false);
    }
  };

  const handleVoiceButton = () => {
    if (isListening) stopVoiceSearch();
    else startVoiceSearch();
  };
  // ====== FIN RECHERCHE VOCALE ======

  const renderRestaurant = useCallback(
    ({ item }: { item: Restaurant }) => (
      <RestaurantCard
        restaurant={item}
        onPress={() => router.push(`/restaurant/${item.id}`)}
      />
    ),
    [router]
  );

  const RecentHeader = () => {
    if (query !== '' || recentSearches.length === 0) return null;
    return (
      <View style={styles.recentSection}>
        <View style={styles.recentHeader}>
          <Text style={[styles.recentTitle, { color: colors.text }]}>Recherches récentes</Text>
          <TouchableOpacity onPress={clearRecent}>
            <Text style={[styles.clearText, { color: COLORS.primary }]}>Effacer</Text>
          </TouchableOpacity>
        </View>
        {recentSearches.map((s) => (
          <TouchableOpacity
            key={s}
            style={styles.recentItem}
            onPress={() => { setQuery(s); doSearch(s); }}
          >
            <Clock size={15} color={colors.textMuted} />
            <Text style={[styles.recentText, { color: colors.textSecondary }]}>{s}</Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>

      {/* Barre de recherche + bouton micro */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <View style={[
          styles.searchBox,
          { backgroundColor: colors.backgroundSecondary },
          isListening && { borderWidth: 2, borderColor: COLORS.primary },
        ]}>
          <Search size={20} color={colors.textMuted} />
          <TextInput
            style={[styles.input, { color: colors.text }]}
            placeholder={isListening ? 'Parlez maintenant...' : 'Rechercher un restaurant'}
            placeholderTextColor={isListening ? COLORS.primary : colors.textMuted}
            value={query}
            onChangeText={(v) => { setQuery(v); setShowSuggestions(v.length >= 2); }}
            returnKeyType="search"
            onSubmitEditing={() => query && doSearch(query)}
            editable={!isListening}
          />
          {query.length > 0 && !isListening && (
            <TouchableOpacity onPress={clearQuery}>
              <X size={18} color={colors.textMuted} />
            </TouchableOpacity>
          )}
          {/* Bouton micro */}
          <TouchableOpacity
            style={[styles.micBtn, { backgroundColor: isListening ? COLORS.primary : colors.backgroundTertiary }]}
            onPress={handleVoiceButton}
          >
            {isListening
              ? <MicOff size={16} color="#fff" />
              : <Mic size={16} color={COLORS.primary} />
            }
          </TouchableOpacity>
        </View>
      </View>

      {/* Bandeau statut vocal */}
      {voiceStatus !== '' && (
        <View style={[styles.voiceBanner, { backgroundColor: COLORS.primary }]}>
          <ActivityIndicator size="small" color="#fff" />
          <Text style={styles.voiceBannerText}>{voiceStatus}</Text>
        </View>
      )}

      {/* Bandeau écoute active */}
      {isListening && (
        <View style={[styles.listeningBanner, { backgroundColor: colors.backgroundSecondary, borderColor: colors.border }]}>
          <Text style={[styles.listeningText, { color: COLORS.primary }]}>
            🎤 Parlez maintenant... (4s)
          </Text>
          <TouchableOpacity onPress={stopVoiceSearch}>
            <Text style={[styles.stopText, { color: COLORS.primary }]}>Arrêter</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Suggestions */}
      {showSuggestions && suggestions.length > 0 && (
        <View style={[styles.suggestionsBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
          {suggestions.slice(0, 5).map((s, i) => (
            <TouchableOpacity
              key={i}
              style={[styles.suggestionItem, { borderBottomColor: colors.border }]}
              onPress={() => { setQuery(s.text); setShowSuggestions(false); doSearch(s.text); }}
            >
              <Search size={13} color={colors.textMuted} />
              <Text style={[styles.suggestionText, { color: colors.text }]}>{s.text}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Filtres catégories */}
      <FlatList
        data={categories}
        keyExtractor={(c) => c.id}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filtersRow}
        style={styles.filtersWrapper}
        renderItem={({ item }) => {
          const active = selectedCategory === item.slug;
          return (
            <TouchableOpacity
              style={[styles.chip, { backgroundColor: active ? COLORS.primary : colors.backgroundSecondary }]}
              onPress={() => setSelectedCategory(active ? undefined : item.slug)}
            >
              <Text style={styles.chipIcon}>{item.icon}</Text>
              <Text style={[styles.chipText, { color: active ? '#fff' : colors.textSecondary }]}>
                {item.name}
              </Text>
            </TouchableOpacity>
          );
        }}
      />

      {/* Résultats */}
      {loading ? (
        <View style={styles.loaderWrap}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={[styles.loaderText, { color: colors.textSecondary }]}>Recherche en cours...</Text>
        </View>
      ) : (
        <FlatList
          data={restaurants}
          keyExtractor={(r) => r.id}
          renderItem={renderRestaurant}
          contentContainerStyle={styles.listContent}
          ListHeaderComponent={<RecentHeader />}
          ListEmptyComponent={
            <View style={styles.emptyWrap}>
              <Text style={styles.emptyIcon}>🔍</Text>
              <Text style={[styles.emptyTitle, { color: colors.text }]}>Aucun restaurant trouvé</Text>
              {query ? (
                <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
                  Aucun résultat pour "{query}"
                </Text>
              ) : null}
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { padding: 16, borderBottomWidth: 1 },
  searchBox: {
    flexDirection: 'row', alignItems: 'center',
    gap: 10, borderRadius: 24, paddingHorizontal: 16, paddingVertical: 12,
  },
  input: { flex: 1, fontSize: 16 },
  micBtn: {
    width: 30, height: 30, borderRadius: 15,
    alignItems: 'center', justifyContent: 'center',
  },
  voiceBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 16, paddingVertical: 8,
  },
  voiceBannerText: { color: '#fff', fontWeight: '600', fontSize: 14 },
  listeningBanner: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 10, borderBottomWidth: 1,
  },
  listeningText: { fontSize: 14, fontWeight: '500' },
  stopText: { fontSize: 14, fontWeight: '700' },
  suggestionsBox: { marginHorizontal: 16, borderRadius: 12, borderWidth: 1, overflow: 'hidden', zIndex: 10 },
  suggestionItem: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, borderBottomWidth: 1 },
  suggestionText: { fontSize: 14 },
  filtersWrapper: { maxHeight: 56 },
  filtersRow: { paddingHorizontal: 16, paddingVertical: 10, gap: 8 },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, marginRight: 4 },
  chipIcon: { fontSize: 14 },
  chipText: { fontSize: 13, fontWeight: '600' },
  loaderWrap: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 10 },
  loaderText: { fontSize: 14 },
  listContent: { padding: 16, paddingBottom: 100 },
  recentSection: { marginBottom: 16 },
  recentHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  recentTitle: { fontSize: 15, fontWeight: '700' },
  clearText: { fontSize: 13 },
  recentItem: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8 },
  recentText: { fontSize: 14 },
  emptyWrap: { alignItems: 'center', paddingTop: 60 },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyTitle: { fontSize: 16, fontWeight: '600' },
  emptySubtitle: { fontSize: 14, marginTop: 4 },
});