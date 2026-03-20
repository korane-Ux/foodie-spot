// app/(tabs)/profile.tsx
import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Alert, Image, ActivityIndicator, Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import {
  MapPin, Heart, ShoppingBag, Phone, Share2,
  Camera, ChevronRight, LogOut, Moon, Sun, Monitor,
} from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';

import { userAPI, uploadAPI, orderAPI } from '@/services/api';
import type { User } from '@/types';
import log from '@/services/logger';
import { useToast } from '@/components/toast-provider';
import { useAuth } from '@/contexts/auth-context';
import { useTheme } from '@/contexts/theme-context';

export default function ProfileScreen() {
  const toast = useToast();
  const { logout } = useAuth();
  const { colors, isDark, themeMode, setThemeMode, toggleTheme } = useTheme();

  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [orderCount, setOrderCount] = useState(0);

  useEffect(() => {
    loadUser();
    loadStats();
  }, []);

  const loadUser = async () => {
    try {
      const userData = await userAPI.getCurrentUser();
      setUser(userData ? { ...userData, favoriteRestaurants: userData.favoriteRestaurants || [] } : null);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const orders = await orderAPI.getOrders();
      setOrderCount(orders.length);
    } catch {
      setOrderCount(0);
    }
  };

  const handlePickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission requise', "Nous avons besoin d'accéder à vos photos");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled) {
      try {
        const imageUrl = await uploadAPI.uploadImage(result.assets[0].uri, 'profile');
        await userAPI.updateProfile({ photo: imageUrl });
        await loadUser();
        toast.success('Photo de profil mise à jour !');
      } catch (error) {
        log.error('Failed to upload profile photo:', error);
        Alert.alert('Erreur', 'Impossible de télécharger la photo');
      }
    }
  };

  const handleLogout = () => {
    Alert.alert('Déconnexion', 'Êtes-vous sûr de vouloir vous déconnecter ?', [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Déconnexion',
        style: 'destructive',
        onPress: async () => { await logout(); },
      },
    ]);
  };

  const handleThemeMode = () => {
    Alert.alert(
      'Apparence',
      'Choisissez le thème de l\'application',
      [
        {
          text: '☀️  Clair',
          onPress: () => setThemeMode('light'),
        },
        {
          text: '🌙  Sombre',
          onPress: () => setThemeMode('dark'),
        },
        {
          text: '📱  Système',
          onPress: () => setThemeMode('system'),
        },
        { text: 'Annuler', style: 'cancel' },
      ]
    );
  };

  const themeLabel = themeMode === 'light' ? 'Clair' : themeMode === 'dark' ? 'Sombre' : 'Système';
  const ThemeIcon = themeMode === 'light' ? Sun : themeMode === 'dark' ? Moon : Monitor;

  // — Loader —
  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
            Chargement du profil...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // — Erreur —
  if (!user) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
        <View style={styles.centered}>
          <Text style={{ fontSize: 48 }}>😕</Text>
          <Text style={[styles.errorText, { color: colors.textSecondary }]}>
            Impossible de charger le profil
          </Text>
          <TouchableOpacity
            style={[styles.retryButton, { backgroundColor: colors.primary }]}
            onPress={loadUser}
          >
            <Text style={styles.retryText}>Réessayer</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false}>

        {/* Header */}
        <View style={[styles.header, { backgroundColor: colors.surface }]}>
          <View style={styles.profileContainer}>
            <View style={styles.avatarContainer}>
              {user.photo ? (
                <Image source={{ uri: user.photo }} style={styles.avatar} />
              ) : (
                <View style={[styles.avatarPlaceholder, { backgroundColor: colors.primary }]}>
                  <Text style={styles.avatarText}>{user.name.charAt(0).toUpperCase()}</Text>
                </View>
              )}
              <TouchableOpacity style={styles.cameraButton} onPress={handlePickImage}>
                <Camera size={14} color="#fff" />
              </TouchableOpacity>
            </View>
            <Text style={[styles.name, { color: colors.text }]}>{user.name}</Text>
            <Text style={[styles.email, { color: colors.textSecondary }]}>{user.email}</Text>
            {user.phone ? (
              <Text style={[styles.phone, { color: colors.textTertiary }]}>{user.phone}</Text>
            ) : null}
          </View>
        </View>

        {/* Stats */}
        <View style={[styles.stats, { backgroundColor: colors.surfaceSecondary }]}>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: colors.primary }]}>{orderCount}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Commandes</Text>
          </View>
          <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: colors.primary }]}>
              {user.favoriteRestaurants?.length ?? 0}
            </Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Favoris</Text>
          </View>
          <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: colors.primary }]}>
              {user.addresses?.length ?? 0}
            </Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Adresses</Text>
          </View>
        </View>

        {/* Section Apparence */}
        <Text style={[styles.sectionTitle, { color: colors.textTertiary }]}>APPARENCE</Text>
        <View style={[styles.menu, { backgroundColor: colors.surface }]}>

          {/* Toggle rapide sombre/clair */}
          <View style={[styles.menuItem, { borderBottomColor: colors.borderLight }]}>
            <ThemeIcon size={20} color={colors.textSecondary} />
            <Text style={[styles.menuText, { color: colors.text }]}>Mode sombre</Text>
            <Switch
              value={isDark}
              onValueChange={toggleTheme}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor="#fff"
            />
          </View>

          {/* Choix fin : clair / sombre / système */}
          <TouchableOpacity
            style={[styles.menuItem, { borderBottomColor: colors.borderLight }]}
            onPress={handleThemeMode}
          >
            <Monitor size={20} color={colors.textSecondary} />
            <Text style={[styles.menuText, { color: colors.text }]}>Thème</Text>
            <View style={styles.menuRight}>
              <View style={[styles.themeBadge, { backgroundColor: colors.primaryLight }]}>
                <Text style={[styles.themeBadgeText, { color: colors.primary }]}>{themeLabel}</Text>
              </View>
              <ChevronRight size={18} color={colors.textTertiary} />
            </View>
          </TouchableOpacity>
        </View>

        {/* Section Mon compte */}
        <Text style={[styles.sectionTitle, { color: colors.textTertiary }]}>MON COMPTE</Text>
        <View style={[styles.menu, { backgroundColor: colors.surface }]}>

          <TouchableOpacity style={[styles.menuItem, { borderBottomColor: colors.borderLight }]}>
            <MapPin size={20} color={colors.textSecondary} />
            <Text style={[styles.menuText, { color: colors.text }]}>Mes adresses</Text>
            <View style={styles.menuRight}>
              <View style={[styles.badge, { backgroundColor: colors.primaryLight }]}>
                <Text style={[styles.badgeText, { color: colors.primary }]}>
                  {user.addresses?.length ?? 0}
                </Text>
              </View>
              <ChevronRight size={18} color={colors.textTertiary} />
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.menuItem, { borderBottomColor: colors.borderLight }]}
            onPress={() => router.push('/(tabs)/favorites')}
          >
            <Heart size={20} color={colors.textSecondary} />
            <Text style={[styles.menuText, { color: colors.text }]}>Mes favoris</Text>
            <View style={styles.menuRight}>
              <View style={[styles.badge, { backgroundColor: colors.primaryLight }]}>
                <Text style={[styles.badgeText, { color: colors.primary }]}>
                  {user.favoriteRestaurants?.length ?? 0}
                </Text>
              </View>
              <ChevronRight size={18} color={colors.textTertiary} />
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.menuItem, { borderBottomColor: colors.borderLight }]}
            onPress={() => router.push('/(tabs)/orders')}
          >
            <ShoppingBag size={20} color={colors.textSecondary} />
            <Text style={[styles.menuText, { color: colors.text }]}>Historique commandes</Text>
            <ChevronRight size={18} color={colors.textTertiary} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.menuItem, { borderBottomColor: colors.borderLight }]}
            onPress={() => Alert.alert('Support', 'Pour toute assistance, contactez notre support client.')}
          >
            <Phone size={20} color={colors.textSecondary} />
            <Text style={[styles.menuText, { color: colors.text }]}>Support</Text>
            <ChevronRight size={18} color={colors.textTertiary} />
          </TouchableOpacity>

          <TouchableOpacity style={[styles.menuItem, { borderBottomColor: colors.borderLight }]}>
            <Share2 size={20} color={colors.textSecondary} />
            <Text style={[styles.menuText, { color: colors.text }]}>Partager l'app</Text>
            <ChevronRight size={18} color={colors.textTertiary} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.menuItem, styles.logoutItem]}
            onPress={handleLogout}
          >
            <LogOut size={20} color={colors.primary} />
            <Text style={[styles.menuText, styles.logoutText, { color: colors.primary }]}>
              Déconnexion
            </Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40, gap: 12 },
  loadingText: { fontSize: 14, marginTop: 8 },
  errorText: { fontSize: 16, textAlign: 'center' },
  retryButton: { paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 },
  retryText: { color: '#fff', fontWeight: '600' },

  header: { padding: 24, alignItems: 'center' },
  profileContainer: { alignItems: 'center' },
  avatarContainer: { position: 'relative', marginBottom: 12 },
  avatar: { width: 88, height: 88, borderRadius: 44 },
  avatarPlaceholder: {
    width: 88, height: 88, borderRadius: 44,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { fontSize: 36, fontWeight: 'bold', color: '#fff' },
  cameraButton: {
    position: 'absolute', bottom: 0, right: 0,
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: '#3B82F6',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: '#fff',
  },
  name: { fontSize: 22, fontWeight: 'bold', marginBottom: 4 },
  email: { fontSize: 14, marginBottom: 2 },
  phone: { fontSize: 12 },

  stats: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 14,
    padding: 16,
  },
  statItem: { flex: 1, alignItems: 'center' },
  statDivider: { width: 1 },
  statValue: { fontSize: 24, fontWeight: 'bold', marginBottom: 4 },
  statLabel: { fontSize: 12 },

  sectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
    marginHorizontal: 16,
    marginTop: 20,
    marginBottom: 6,
  },
  menu: {
    borderRadius: 14,
    marginHorizontal: 16,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    gap: 12,
  },
  menuText: { flex: 1, fontSize: 16 },
  menuRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  badge: {
    paddingHorizontal: 8, paddingVertical: 2,
    borderRadius: 10,
  },
  badgeText: { fontSize: 12, fontWeight: '600' },
  themeBadge: {
    paddingHorizontal: 10, paddingVertical: 3,
    borderRadius: 10,
  },
  themeBadgeText: { fontSize: 12, fontWeight: '600' },
  logoutItem: { borderBottomWidth: 0 },
  logoutText: { fontWeight: '600' },
});