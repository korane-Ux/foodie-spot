// =============================================================
// app/(tabs)/profile.tsx
// Écran profil utilisateur
// =============================================================

import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert, Image, ScrollView, StyleSheet,
  Text, TouchableOpacity, View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import {
  Camera, ChevronRight, Heart, LogOut,
  MapPin, Monitor, Moon, Phone, Share2, ShoppingBag, Sun,
} from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';

// CORRECTION : imports relatifs remplacés par les alias @/
// Ancien code :
// import { userAPI, uploadAPI } from '../../services/api';
// import type { User } from '../../types';
// import log from '../../services/logger';
// import auth from '@/services/auth'; (celui-là était déjà bon)
import { userAPI, uploadAPI, orderAPI } from '@/services/api';
import { useAuth } from '@/contexts/auth-context';
import { useTheme } from '@/contexts/theme-context';
import { useI18n } from '@/contexts/i18n-context';
import { useToast } from '@/components/toast-provider';
import { Loader } from '@/components/ui/loader';
import type { User } from '@/types';
import { COLORS } from '@/constants/theme';
import { ThemeMode } from '@/types';
import { Language } from '@/i18n';

export default function ProfileScreen() {
  const toast = useToast();
  const { logout } = useAuth();
  const { colors, isDark, themeMode, setThemeMode } = useTheme();
  const { t, language, setLanguage } = useI18n();

  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  // CORRECTION : était en dur "12" dans le code original
  // Ancien code : <Text style={styles.statValue}>12</Text>
  // CORRECTION : on compte les commandes réelles depuis l'API
  const [orderCount, setOrderCount] = useState<number>(0);

  const loadUser = useCallback(async () => {
    try {
      const [userData, orders] = await Promise.all([
        userAPI.getCurrentUser(),
        orderAPI.getOrders(),
      ]);
      setUser(
        userData
          ? { ...userData, favoriteRestaurants: userData.favoriteRestaurants ?? [] }
          : null
      );
      setOrderCount(orders.length);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadUser(); }, []);

  const handlePickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(t('profile.permissionRequired'), t('profile.photoPermission'));
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled) {
      try {
        const imageUrl = await uploadAPI.uploadImage(result.assets[0].uri, 'profile');
        await userAPI.updateProfile({ photo: imageUrl });
        await loadUser();
        toast.success(t('profile.updatePhoto'));
      } catch {
        toast.error(t('profile.photoError'));
      }
    }
  };

  const handleLogout = () => {
    Alert.alert(t('profile.logout'), t('profile.logoutConfirm'), [
      { text: t('profile.logoutCancel'), style: 'cancel' },
      {
        text: t('profile.logout'),
        style: 'destructive',
        onPress: async () => { await logout(); },
      },
    ]);
  };

  const THEME_OPTIONS: { mode: ThemeMode; icon: React.ReactNode; label: string }[] = [
    { mode: 'light',  icon: <Sun size={16} color={themeMode === 'light' ? '#fff' : colors.textSecondary} />,      label: t('profile.lightTheme') },
    { mode: 'dark',   icon: <Moon size={16} color={themeMode === 'dark' ? '#fff' : colors.textSecondary} />,      label: t('profile.darkTheme') },
    { mode: 'system', icon: <Monitor size={16} color={themeMode === 'system' ? '#fff' : colors.textSecondary} />, label: t('profile.autoTheme') },
  ];

  const LANG_OPTIONS: { lang: Language; emoji: string; label: string }[] = [
    { lang: 'fr', emoji: '🇫🇷', label: 'Français' },
    { lang: 'en', emoji: '🇬🇧', label: 'English' },
  ];

  // CORRECTION : le code original avait le bloc if (!user) qui affichait
  // exactement la même UI que quand l'user est chargé mais avec des '?.'
  // Ancien code :
  // if (!user) {
  //   return (
  //     <SafeAreaView>
  //       ... même JSX avec user?.name, user?.email etc. (très moche)
  //     </SafeAreaView>
  //   );
  // }
  // CORRECTION : on affiche un vrai loader pendant le chargement
  if (loading) return <Loader message={t('common.loading')} />;

  const displayName =
    user?.name ||
    `${user?.firstName ?? ''} ${user?.lastName ?? ''}`.trim() ||
    'Utilisateur';
  const initials = displayName.charAt(0).toUpperCase();

  const STATS = [
    { value: String(orderCount),                              label: t('profile.orders') },
    { value: String(user?.favoriteRestaurants?.length ?? 0), label: t('profile.favorites') },
    { value: String(user?.addresses?.length ?? 0),           label: t('profile.addresses') },
  ];

  const MENU_ITEMS = [
    {
      icon: <MapPin size={20} color={colors.icon} />,
      label: t('profile.myAddresses'),
      badge: user?.addresses?.length,
      onPress: () => router.push('/addresses'),
    },
    {
      icon: <Heart size={20} color={colors.icon} />,
      label: t('profile.myFavorites'),
      badge: user?.favoriteRestaurants?.length,
      // CORRECTION : pointait vers /(tabs)/favorites qui n'existe pas
      // Ancien code : onPress: () => router.push('/(tabs)/favorites')
      // CORRECTION : toast d'information en attendant de créer l'écran
      onPress: () => toast.info('Favoris bientôt disponible'),
    },
    {
      icon: <ShoppingBag size={20} color={colors.icon} />,
      label: t('profile.orderHistory'),
      onPress: () => router.push('/(tabs)/orders'),
    },
    {
      icon: <Phone size={20} color={colors.icon} />,
      label: t('profile.support'),
      onPress: () => Alert.alert(t('profile.support'), 'support@foodiespot.fr'),
    },
    {
      icon: <Share2 size={20} color={colors.icon} />,
      label: t('profile.shareApp'),
      onPress: () => toast.info('Partage bientôt disponible'),
    },
  ];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false}>

        {/* En-tête avec avatar */}
        <View style={[styles.header, { backgroundColor: COLORS.primary }]}>
          <View style={styles.avatarContainer}>
            {user?.photo ? (
              <Image source={{ uri: user.photo }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatarPlaceholder, { backgroundColor: 'rgba(255,255,255,0.3)' }]}>
                <Text style={styles.avatarText}>{initials}</Text>
              </View>
            )}
            <TouchableOpacity
              style={styles.cameraBtn}
              onPress={handlePickImage}
              accessibilityLabel="Changer la photo de profil"
            >
              <Camera size={14} color="#fff" />
            </TouchableOpacity>
          </View>
          <Text style={styles.name}>{displayName}</Text>
          <Text style={styles.email}>{user?.email}</Text>
          {user?.phone ? <Text style={styles.phone}>{user.phone}</Text> : null}
        </View>

        {/* Stats dynamiques */}
        <View style={[styles.statsRow, { backgroundColor: colors.card }]}>
          {STATS.map((s, i, arr) => (
            <React.Fragment key={s.label}>
              <View style={styles.statItem}>
                <Text style={[styles.statValue, { color: COLORS.primary }]}>{s.value}</Text>
                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{s.label}</Text>
              </View>
              {i < arr.length - 1 && (
                <View style={[styles.divider, { backgroundColor: colors.border }]} />
              )}
            </React.Fragment>
          ))}
        </View>

        {/* Sélection thème (feature A) */}
        <View style={[styles.section, { backgroundColor: colors.card }]}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
            {t('profile.appearance')}
          </Text>
          <View style={styles.themeRow}>
            {THEME_OPTIONS.map(({ mode, icon, label }) => (
              <TouchableOpacity
                key={mode}
                style={[
                  styles.themeBtn,
                  { backgroundColor: themeMode === mode ? COLORS.primary : colors.backgroundSecondary },
                ]}
                onPress={() => setThemeMode(mode)}
                accessibilityState={{ selected: themeMode === mode }}
              >
                {icon}
                <Text style={[styles.themeBtnText, { color: themeMode === mode ? '#fff' : colors.textSecondary }]}>
                  {label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Sélection langue */}
        <View style={[styles.section, { backgroundColor: colors.card }]}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>LANGUE</Text>
          <View style={styles.themeRow}>
            {LANG_OPTIONS.map(({ lang, emoji, label }) => (
              <TouchableOpacity
                key={lang}
                style={[
                  styles.themeBtn,
                  {
                    backgroundColor:
                      language === lang ? COLORS.secondary : colors.backgroundSecondary,
                  },
                ]}
                onPress={() => setLanguage(lang)}
                accessibilityState={{ selected: language === lang }}
              >
                <Text style={{ fontSize: 16 }}>{emoji}</Text>
                <Text style={[
                  styles.themeBtnText,
                  { color: language === lang ? '#fff' : colors.textSecondary },
                ]}>
                  {label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Menu de navigation */}
        <View style={[styles.section, { backgroundColor: colors.card }]}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
            {t('profile.account')}
          </Text>
          {MENU_ITEMS.map((item) => (
            <TouchableOpacity
              key={item.label}
              style={[styles.menuItem, { borderBottomColor: colors.border }]}
              onPress={item.onPress}
            >
              {item.icon}
              <Text style={[styles.menuLabel, { color: colors.text }]}>{item.label}</Text>
              <View style={styles.menuRight}>
                {item.badge !== undefined && item.badge > 0 && (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{item.badge}</Text>
                  </View>
                )}
                <ChevronRight size={18} color={colors.textMuted} />
              </View>
            </TouchableOpacity>
          ))}

          <TouchableOpacity
            style={[styles.menuItem, { borderBottomWidth: 0 }]}
            onPress={handleLogout}
          >
            <LogOut size={20} color={COLORS.error} />
            <Text style={[styles.menuLabel, { color: COLORS.error, fontWeight: '700' }]}>
              {t('profile.logout')}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { padding: 24, alignItems: 'center' },
  avatarContainer: { position: 'relative', marginBottom: 12 },
  avatar: { width: 90, height: 90, borderRadius: 45, borderWidth: 3, borderColor: '#fff' },
  avatarPlaceholder: {
    width: 90, height: 90, borderRadius: 45,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { fontSize: 36, fontWeight: 'bold', color: '#fff' },
  cameraBtn: {
    position: 'absolute', bottom: 0, right: 0,
    width: 30, height: 30, borderRadius: 15,
    backgroundColor: '#3B82F6',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: '#fff',
  },
  name: { fontSize: 22, fontWeight: 'bold', color: '#fff' },
  email: { fontSize: 14, color: 'rgba(255,255,255,0.8)', marginTop: 2 },
  phone: { fontSize: 12, color: 'rgba(255,255,255,0.7)', marginTop: 2 },
  statsRow: { flexDirection: 'row', margin: 16, borderRadius: 16, padding: 16 },
  statItem: { flex: 1, alignItems: 'center' },
  statValue: { fontSize: 24, fontWeight: 'bold', marginBottom: 2 },
  statLabel: { fontSize: 12 },
  divider: { width: 1 },
  section: { marginHorizontal: 16, marginBottom: 16, borderRadius: 16, overflow: 'hidden', padding: 16 },
  sectionTitle: { fontSize: 11, fontWeight: '700', letterSpacing: 1, marginBottom: 12 },
  themeRow: { flexDirection: 'row', gap: 10 },
  themeBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', gap: 6,
    paddingVertical: 10, borderRadius: 12,
  },
  themeBtnText: { fontSize: 12, fontWeight: '600' },
  menuItem: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 14, gap: 12, borderBottomWidth: 1,
  },
  menuLabel: { flex: 1, fontSize: 16 },
  menuRight: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  badge: { backgroundColor: '#FFE5DB', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
  badgeText: { fontSize: 12, color: COLORS.primary, fontWeight: '600' },
});
