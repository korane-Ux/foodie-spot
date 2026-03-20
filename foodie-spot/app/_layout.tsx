// app/_layout.tsx
import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { DarkTheme, DefaultTheme, ThemeProvider as NavThemeProvider } from '@react-navigation/native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import 'react-native-reanimated';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { AuthProvider, useAuth } from '@/contexts/auth-context';
import { CartProvider } from '@/contexts/cart-context';
import { ThemeProvider, useTheme } from '@/contexts/theme-context';
import { ToastProvider } from '@/components/toast-provider';
import { useOffline } from '@/hooks/use-offline';
import { Colors } from '@/constants/theme';

export const unstable_settings = {
  initialRouteName: '(tabs)',
};

function RootLayoutContent() {
  const { isDark, colors } = useTheme();
  const { isOnline, pendingCount, isSyncing, syncNow } = useOffline();
  const { isAuthenticated, isLoading, refreshAuth } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  const [onboardingChecked, setOnboardingChecked] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    const checkOnboarding = async () => {
      const done = await AsyncStorage.getItem('onboarding_done');
      setShowOnboarding(!done);
      setOnboardingChecked(true);
    };
    checkOnboarding();
  }, []);

  useEffect(() => {
    if (isLoading || !onboardingChecked) return;
    if (showOnboarding) { router.replace('/onboarding'); return; }
    const firstSegment = segments[0];
    const protectedRoutes = ['(tabs)', 'cart', 'checkout', 'restaurant', 'dish', 'tracking', 'review'];
    const isProtectedRoute = protectedRoutes.some(route => firstSegment === route || firstSegment?.startsWith(route));
    const isAuthRoute = firstSegment === '(auth)' || firstSegment === 'login' || firstSegment === 'register';
    if (!isAuthenticated && isProtectedRoute) router.replace('/login');
    else if (isAuthenticated && isAuthRoute) router.replace('/(tabs)');
  }, [segments, isLoading, isAuthenticated, router, onboardingChecked, showOnboarding]);

  useEffect(() => {
    if (segments[0] === '(tabs)' && !isLoading && !isAuthenticated) {
      let cancelled = false;
      refreshAuth().catch(() => { if (!cancelled) router.replace('/login'); });
      return () => { cancelled = true; };
    }
  }, [segments[0], isLoading, isAuthenticated]);

  if (isLoading || !onboardingChecked) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <Text style={styles.loadingLogo}>🍔</Text>
        <ActivityIndicator size="large" color={Colors.light.tint} />
        <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Chargement...</Text>
      </View>
    );
  }

  return (
    <NavThemeProvider value={isDark ? DarkTheme : DefaultTheme}>
      {!isOnline && (
        <View style={styles.offlineBanner}>
          <Ionicons name="cloud-offline-outline" size={16} color="#fff" />
          <Text style={styles.bannerText}>Hors ligne {pendingCount > 0 && `• ${pendingCount} en attente`}</Text>
        </View>
      )}
      {isOnline && pendingCount > 0 && (
        <TouchableOpacity style={styles.syncBanner} onPress={syncNow} disabled={isSyncing}>
          <Ionicons name={isSyncing ? 'sync' : 'sync-outline'} size={16} color="#fff" />
          <Text style={styles.bannerText}>{isSyncing ? 'Synchronisation...' : `Synchroniser ${pendingCount} action(s)`}</Text>
        </TouchableOpacity>
      )}
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="onboarding" options={{ animation: 'fade' }} />
        <Stack.Screen name="(auth)" options={{ animation: 'fade' }} />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="restaurant/[id]" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="dish/[id]" options={{ presentation: 'modal' }} />
        <Stack.Screen name="cart" options={{ animation: 'slide_from_bottom' }} />
        <Stack.Screen name="checkout" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="tracking/[orderId]" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="review/[orderId]" options={{ presentation: 'modal' }} />
      </Stack>
      <StatusBar style={isDark ? 'light' : 'auto'} />
    </NavThemeProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingLogo: { fontSize: 64, marginBottom: 16 },
  loadingText: { marginTop: 12, fontSize: 16 },
  offlineBanner: { backgroundColor: '#EF4444', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 8, paddingTop: 50, gap: 8 },
  syncBanner: { backgroundColor: '#F59E0B', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 8, paddingTop: 50, gap: 8 },
  bannerText: { color: '#fff', fontSize: 14, fontWeight: '600' },
});

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ThemeProvider>
          <ToastProvider>
            <AuthProvider>
              <CartProvider>
                <RootLayoutContent />
              </CartProvider>
            </AuthProvider>
          </ToastProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}