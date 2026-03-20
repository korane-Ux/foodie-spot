// =============================================================
// services/storage.ts
// Wrapper autour d'AsyncStorage pour centraliser le stockage local
// Comme ça si on change de lib de stockage plus tard, on ne
// modifie qu'ici
// =============================================================

import AsyncStorage from '@react-native-async-storage/async-storage';

export const storage = {

  // Stocke n'importe quelle valeur (objet, string, nombre...)
  // On stringify tout pour éviter les problèmes de type avec AsyncStorage
  async setItem(key: string, value: any): Promise<void> {
    try {
      const str = typeof value === 'string' ? value : JSON.stringify(value);
      await AsyncStorage.setItem(key, str);
    } catch (error) {
      console.warn('Erreur stockage:', key, error);
      throw error;
    }
  },

  async getItem<T>(key: string): Promise<T | null> {
    try {
      const value = await AsyncStorage.getItem(key);
      if (!value) return null;
      try {
        return JSON.parse(value) as T;
      } catch {
        // Si le parse échoue c'est que c'est une simple string
        return value as unknown as T;
      }
    } catch {
      return null;
    }
  },

  async removeItem(key: string): Promise<void> {
    try {
      await AsyncStorage.removeItem(key);
    } catch (error) {
      console.warn('Erreur suppression:', key, error);
      throw error;
    }
  },

  async clear(): Promise<void> {
    try {
      await AsyncStorage.clear();
    } catch (error) {
      console.warn('Erreur vidage storage:', error);
      throw error;
    }
  },

  async getAllKeys(): Promise<string[]> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      return [...keys];
    } catch {
      return [];
    }
  },
};

// Clés centralisées pour éviter les fautes de frappe partout
export const STORAGE_KEYS = {
  AUTH_TOKEN: 'authToken',
  ACCESS_TOKEN: 'auth_access_token',
  REFRESH_TOKEN: 'auth_refresh_token',
  USER: 'auth_user',
  CART: 'cart',
  FAVORITES: 'favorites',
  RECENT_SEARCHES: 'recentSearches',
  CACHED_RESTAURANTS: 'cachedRestaurants',
  OFFLINE_ORDERS: 'offlineOrders',
  THEME_MODE: 'themeMode',
  ONBOARDING_DONE: 'onboardingDone',
} as const;
