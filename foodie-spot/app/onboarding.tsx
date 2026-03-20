import React, { useRef, useState } from 'react';
import {
  Animated, Dimensions, FlatList,
  StyleSheet, Text, TouchableOpacity, View,
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { storage, STORAGE_KEYS } from '@/services/storage';
import { useTheme } from '@/contexts/theme-context';
import { COLORS } from '@/constants/theme';

const { width } = Dimensions.get('window');

const SLIDES = [
  {
    key: 'slide1',
    emoji: '🍔',
    title: 'Bienvenue sur FoodieSpot',
    subtitle: 'Découvrez les meilleurs restaurants près de chez vous et commandez en quelques clics.',
    bg: '#FFF4EF',
    accentBg: COLORS.primary,
  },
  {
    key: 'slide2',
    emoji: '🛒',
    title: 'Commandez facilement',
    subtitle: 'Ajoutez vos plats préférés au panier et passez commande en toute simplicité.',
    bg: '#F3F0FF',
    accentBg: COLORS.secondary,
  },
  {
    key: 'slide3',
    emoji: '🛵',
    title: 'Livraison rapide',
    subtitle: 'Suivez votre commande en temps réel et recevez vos plats chauds à votre porte.',
    bg: '#E8F5E9',
    accentBg: '#4CAF50',
  },
];

export default function OnboardingScreen() {
  const { colors } = useTheme();
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);
  const scrollX = useRef(new Animated.Value(0)).current;

  const handleNext = () => {
    if (currentIndex < SLIDES.length - 1) {
      flatListRef.current?.scrollToIndex({ index: currentIndex + 1 });
      setCurrentIndex(currentIndex + 1);
    } else {
      handleFinish();
    }
  };

  const handleFinish = async () => {
    await storage.setItem(STORAGE_KEYS.ONBOARDING_DONE, true);
    router.replace('/login');
  };

  const isLast = currentIndex === SLIDES.length - 1;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Skip */}
      <View style={styles.skipRow}>
        {!isLast && (
          <TouchableOpacity onPress={handleFinish} style={styles.skipBtn}>
            <Text style={[styles.skipText, { color: colors.textSecondary }]}>Passer</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Slides */}
      <Animated.FlatList
        ref={flatListRef}
        data={SLIDES}
        keyExtractor={(item) => item.key}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        scrollEnabled={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { x: scrollX } } }],
          { useNativeDriver: false }
        )}
        renderItem={({ item }) => (
          <View style={[styles.slide, { width }]}>
            <View style={[styles.illustrationCircle, { backgroundColor: item.bg }]}>
              <Text style={styles.emoji}>{item.emoji}</Text>
            </View>
            <Text style={[styles.slideTitle, { color: colors.text }]}>{item.title}</Text>
            <Text style={[styles.slideSubtitle, { color: colors.textSecondary }]}>{item.subtitle}</Text>
          </View>
        )}
      />

      {/* Dots + Bouton */}
      <View style={styles.footer}>
        <View style={styles.dotsRow}>
          {SLIDES.map((_, i) => {
            const inputRange = [(i - 1) * width, i * width, (i + 1) * width];
            const dotWidth = scrollX.interpolate({
              inputRange, outputRange: [8, 24, 8], extrapolate: 'clamp',
            });
            const opacity = scrollX.interpolate({
              inputRange, outputRange: [0.3, 1, 0.3], extrapolate: 'clamp',
            });
            return (
              <Animated.View
                key={i}
                style={[styles.dot, { width: dotWidth, opacity, backgroundColor: SLIDES[currentIndex].accentBg }]}
              />
            );
          })}
        </View>

        <TouchableOpacity
          style={[styles.nextBtn, { backgroundColor: SLIDES[currentIndex].accentBg }]}
          onPress={handleNext}
          activeOpacity={0.85}
        >
          <Text style={styles.nextBtnText}>
            {isLast ? "C'est parti ! 🚀" : 'Suivant →'}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  skipRow: {
    flexDirection: 'row', justifyContent: 'flex-end',
    paddingHorizontal: 20, paddingTop: 8, minHeight: 40,
  },
  skipBtn: { padding: 8 },
  skipText: { fontSize: 15 },
  slide: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 32, gap: 24,
  },
  illustrationCircle: {
    width: 220, height: 220, borderRadius: 110,
    alignItems: 'center', justifyContent: 'center', marginBottom: 16,
  },
  emoji: { fontSize: 96 },
  slideTitle: { fontSize: 26, fontWeight: 'bold', textAlign: 'center', lineHeight: 34 },
  slideSubtitle: { fontSize: 16, textAlign: 'center', lineHeight: 24 },
  footer: { paddingHorizontal: 24, paddingBottom: 40, gap: 24, alignItems: 'center' },
  dotsRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dot: { height: 8, borderRadius: 4 },
  nextBtn: { width: '100%', paddingVertical: 16, borderRadius: 16, alignItems: 'center' },
  nextBtnText: { color: '#fff', fontSize: 17, fontWeight: '700' },
});