import React, { useRef, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  Dimensions, FlatList, Animated
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width } = Dimensions.get('window');

const SLIDES = [
  {
    id: '1',
    emoji: '🍔',
    title: 'Bienvenue sur FoodieSpot',
    subtitle: 'Découvrez les meilleurs restaurants près de chez vous et commandez en quelques clics.',
    bg: '#FF6B35',
  },
  {
    id: '2',
    emoji: '🚴',
    title: 'Livraison rapide',
    subtitle: 'Suivez votre commande en temps réel et recevez vos plats chauds à votre porte.',
    bg: '#8B5CF6',
  },
  {
    id: '3',
    emoji: '⭐',
    title: 'Vos favoris, toujours là',
    subtitle: 'Sauvegardez vos restaurants préférés et commandez encore plus vite la prochaine fois.',
    bg: '#10b981',
  },
];

export default function OnboardingScreen() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);
  const scrollX = useRef(new Animated.Value(0)).current;

  const handleFinish = async () => {
    try {
      await AsyncStorage.setItem('onboarding_done', 'true');
    } catch (e) {}
    router.replace('/(auth)/login');
  };

  const handleNext = () => {
    if (currentIndex < SLIDES.length - 1) {
      const nextIndex = currentIndex + 1;
      flatListRef.current?.scrollToIndex({ index: nextIndex, animated: true });
      setCurrentIndex(nextIndex);
    } else {
      handleFinish();
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Bouton passer */}
      <TouchableOpacity style={styles.skipButton} onPress={handleFinish}>
        <Text style={styles.skipText}>Passer</Text>
      </TouchableOpacity>

      {/* Slides */}
      <Animated.FlatList
        ref={flatListRef}
        data={SLIDES}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        scrollEventThrottle={16}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { x: scrollX } } }],
          { useNativeDriver: false }
        )}
        onMomentumScrollEnd={(e) => {
          const index = Math.round(e.nativeEvent.contentOffset.x / width);
          setCurrentIndex(index);
        }}
        renderItem={({ item }) => (
          <View style={[styles.slide, { backgroundColor: item.bg }]}>
            <Text style={styles.emoji}>{item.emoji}</Text>
            <Text style={styles.title}>{item.title}</Text>
            <Text style={styles.subtitle}>{item.subtitle}</Text>
          </View>
        )}
      />

      {/* Indicateurs dots */}
      <View style={styles.dotsContainer}>
        {SLIDES.map((_, index) => {
          const inputRange = [(index - 1) * width, index * width, (index + 1) * width];
          const dotWidth = scrollX.interpolate({
            inputRange,
            outputRange: [8, 24, 8],
            extrapolate: 'clamp',
          });
          const opacity = scrollX.interpolate({
            inputRange,
            outputRange: [0.4, 1, 0.4],
            extrapolate: 'clamp',
          });
          return (
            <Animated.View key={index} style={[styles.dot, { width: dotWidth, opacity }]} />
          );
        })}
      </View>

      {/* Bouton suivant / commencer */}
      <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
        <Text style={styles.nextButtonText}>
          {currentIndex === SLIDES.length - 1 ? "C'est parti ! 🚀" : 'Suivant →'}
        </Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  skipButton: {
    position: 'absolute', top: 56, right: 24, zIndex: 10,
    paddingHorizontal: 16, paddingVertical: 8,
    backgroundColor: 'rgba(0,0,0,0.15)', borderRadius: 20,
  },
  skipText: { color: '#fff', fontWeight: '600', fontSize: 14 },
  slide: {
    width, flex: 1,
    alignItems: 'center', justifyContent: 'center', padding: 40,
  },
  emoji: { fontSize: 96, marginBottom: 32 },
  title: { fontSize: 28, fontWeight: 'bold', color: '#fff', textAlign: 'center', marginBottom: 16 },
  subtitle: { fontSize: 16, color: 'rgba(255,255,255,0.85)', textAlign: 'center', lineHeight: 24 },
  dotsContainer: {
    flexDirection: 'row', justifyContent: 'center',
    alignItems: 'center', gap: 6, paddingVertical: 24,
  },
  dot: { height: 8, borderRadius: 4, backgroundColor: '#FF6B35' },
  nextButton: {
    marginHorizontal: 24, marginBottom: 32,
    backgroundColor: '#FF6B35', borderRadius: 16,
    padding: 18, alignItems: 'center',
  },
  nextButtonText: { color: '#fff', fontSize: 18, fontWeight: '700' },
});