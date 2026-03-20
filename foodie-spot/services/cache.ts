// =============================================================
// services/cache.ts
// Cache en mémoire locale (AsyncStorage) avec durée de validité
// Permet d'afficher des données même sans connexion internet
// =============================================================

import { storage } from './storage';

// Le cache expire après 5 minutes
// Si les données ont plus de 5min, on refait un appel API
const CACHE_DURATION = 5 * 60 * 1000; // en millisecondes

interface CachedItem<T> {
  data: T;
  timestamp: number; // quand le cache a été créé
}

export const cache = {

  async set<T>(key: string, data: T): Promise<void> {
    const cachedItem: CachedItem<T> = {
      data,
      timestamp: Date.now(),
    };
    // On préfixe avec 'cache_' pour distinguer du reste du storage
    await storage.setItem(`cache_${key}`, JSON.stringify(cachedItem));
  },

  async get<T>(key: string): Promise<T | null> {
    const cachedItem = await storage.getItem<CachedItem<T>>(`cache_${key}`);

    if (!cachedItem) return null;

    // Vérifier si le cache n'est pas expiré
    const isExpired = Date.now() - cachedItem.timestamp > CACHE_DURATION;
    if (isExpired) {
      // Cache périmé → on le supprime et on retourne null
      await storage.removeItem(`cache_${key}`);
      return null;
    }

    return cachedItem.data;
  },

  async clear(key: string): Promise<void> {
    await storage.removeItem(`cache_${key}`);
  },

  // Vide tout le cache (utilisé lors de la déconnexion)
  async clearAll(): Promise<void> {
    const keys = await storage.getAllKeys();
    const cacheKeys = keys.filter((key) => key.startsWith('cache_'));
    for (const key of cacheKeys) {
      await storage.removeItem(key);
    }
  },
};
