// =============================================================
// app/_layout.tsx
// Layout racine de l'application
// Gère : providers globaux, guard de navigation, bannières réseau
// =============================================================

import { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import 'react-native-reanimated';

import { AuthProvider, useAuth } from '@/contexts/auth-context';
import { ThemeProvider as AppThemeProvider, useTheme } from '@/contexts/theme-context';
import { CartProvider } from '@/contexts/cart-context';
import { I18nProvider, useI18n } from '@/contexts/i18n-context';
import { ToastProvider } from '@/components/toast-provider';
import { useOffline } from '@/hooks/use-offline';
import { storage, STORAGE_KEYS } from '@/services/storage';

export const unstable_settings = { initialRouteName: '(tabs)' };

const PROTECTED = ['(tabs)', 'cart', 'checkout', 'restaurant', 'dish', 'tracking', 'review', 'addresses'];
const AUTH_ROUTES = ['(auth)', 'login', 'register'];

function NavigationGuard({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  const { isOnline, pendingCount, isSyncing, syncNow } = useOffline();
  const { isDark, colors } = useTheme();
  const { t } = useI18n();
  const segments = useSegments();
  const router = useRouter();

  // Flag pour n'afficher l'onboarding qu'une seule fois au démarrage
  const [onboardingReady, setOnboardingReady] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);

  // Vérifier l'onboarding une seule fois au montage
  useEffect(() => {
    const checkOnboarding = async () => {
      const done = await storage.getItem<boolean>(STORAGE_KEYS.ONBOARDING_DONE);
      setShowOnboarding(!done);
      setOnboardingReady(true);
    };
    checkOnboarding();
  }, []); // tableau vide = une seule fois

  // Guard de navigation - séparé de l'onboarding pour éviter les conflits
  useEffect(() => {
    // On attend que tout soit prêt
    if (isLoading || !onboardingReady) return;

    const firstSeg = segments[0] as string | undefined;

    // Priorité 1 : onboarding si pas encore vu
    if (showOnboarding && firstSeg !== 'onboarding') {
      router.replace('/onboarding');
      return;
    }

    const isProtected = PROTECTED.some(
      (r) => firstSeg === r || firstSeg?.startsWith(r)
    );
    const isAuthRoute = AUTH_ROUTES.includes(firstSeg ?? '');

    // Priorité 2 : rediriger vers login si route protégée et non connecté
    if (!isAuthenticated && isProtected) {
      router.replace('/login');
      return;
    }

    // Priorité 3 : rediriger vers home si connecté et sur page auth
    // CORRECTION : c'était la source de la boucle !
    // Avant : on utilisait hasNavigated.current qui se remettait à false
    // et faisait une boucle login → tabs → login → tabs...
    // Maintenant : condition simple, si authentifié ET sur page auth → home
    if (isAuthenticated && isAuthRoute) {
      router.replace('/(tabs)');
      return;
    }
  }, [segments, isLoading, isAuthenticated, onboardingReady, showOnboarding]);

  // Écran de chargement initial
  if (isLoading || !onboardingReady) {
    return (
      <View style={[styles.loading, { backgroundColor: colors.background }]}>
        <Text style={styles.loadingLogo}>🍔</Text>
        <ActivityIndicator size="large" color="#FF6B35" />
        <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
          {t('common.loading')}
        </Text>
      </View>
    );
  }

  return (
    <ThemeProvider value={isDark ? DarkTheme : DefaultTheme}>
      {/* Bannière mode hors-ligne */}
      {!isOnline && (
        <View style={styles.offlineBanner}>
          <Ionicons name="cloud-offline-outline" size={16} color="#fff" />
          <Text style={styles.bannerText}>
            Hors ligne {pendingCount > 0 ? `• ${pendingCount} en attente` : ''}
          </Text>
        </View>
      )}

      {/* Bannière synchronisation données en attente */}
      {isOnline && pendingCount > 0 && (
        <TouchableOpacity style={styles.syncBanner} onPress={syncNow} disabled={isSyncing}>
          <Ionicons name={isSyncing ? 'sync' : 'sync-outline'} size={16} color="#fff" />
          <Text style={styles.bannerText}>
            {isSyncing
              ? 'Synchronisation...'
              : `Synchroniser ${pendingCount} action(s)`}
          </Text>
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
        <Stack.Screen name="addresses" options={{ animation: 'slide_from_right' }} />
      </Stack>

      <StatusBar style={isDark ? 'light' : 'dark'} />
    </ThemeProvider>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AppThemeProvider>
          <I18nProvider>
            <ToastProvider>
              <AuthProvider>
                <CartProvider>
                  <NavigationGuard>{null}</NavigationGuard>
                </CartProvider>
              </AuthProvider>
            </ToastProvider>
          </I18nProvider>
        </AppThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingLogo: { fontSize: 64, marginBottom: 16 },
  loadingText: { marginTop: 12, fontSize: 16 },
  offlineBanner: {
    backgroundColor: '#EF4444',
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 8, paddingTop: 50, gap: 8,
  },
  syncBanner: {
    backgroundColor: '#F59E0B',
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 8, paddingTop: 50, gap: 8,
  },
  bannerText: { color: '#fff', fontSize: 14, fontWeight: '600' },
});
