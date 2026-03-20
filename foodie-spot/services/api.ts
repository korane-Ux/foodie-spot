// =============================================================
// services/api.ts
// Service principal pour tous les appels réseau de l'application
// J'ai centralisé ici tous les appels API pour éviter d'avoir
// des fetch() dispersés dans les composants (mauvaise pratique)
// =============================================================

import { cache } from '@/services/cache';
import NetInfo from '@react-native-community/netinfo';
import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

import { storage, STORAGE_KEYS } from '@/services/storage';
import {
  Category,
  DeliveryEstimate,
  Dish,
  MenuCategory,
  Order,
  PromoResult,
  Restaurant,
  Review,
  SearchFilters,
  User,
} from '@/types';
import log from './logger';
import config from '@/constants/config';

// Instance axios avec timeout réduit à 5s pour les écrans restaurant
// (les utilisateurs ne doivent pas attendre plus de 5s)
const apiRestaurant = axios.create({
  baseURL: config.API_URL,
  timeout: 5000, // 5 secondes max pour les détails restaurant
  headers: { 'Content-Type': 'application/json' },
});

// Instance principale pour les autres appels (10s)
const api = axios.create({
  baseURL: config.API_URL,
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
});

// Intercepteur requête : on ajoute le token JWT automatiquement
// CORRECTION du require cycle : on lit le token directement depuis SecureStore
// au lieu d'importer auth.ts (qui importe api.ts → cycle)
api.interceptors.request.use(
  async (requestConfig) => {
    let token: string | null = null;
    try {
      // Lecture directe dans SecureStore sans passer par auth.ts
      token = await SecureStore.getItemAsync(STORAGE_KEYS.ACCESS_TOKEN);
    } catch {
      // Fallback AsyncStorage si SecureStore échoue (rare)
      token = await storage.getItem<string>(STORAGE_KEYS.AUTH_TOKEN);
    }
    if (token) {
      requestConfig.headers.Authorization = `Bearer ${token}`;
    }
    return requestConfig;
  },
  (error) => Promise.reject(error)
);

// Intercepteur réponse : si 401, on nettoie les tokens
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Token expiré ou invalide → on nettoie tout
      await storage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
      try {
        await SecureStore.deleteItemAsync(STORAGE_KEYS.ACCESS_TOKEN);
        await SecureStore.deleteItemAsync(STORAGE_KEYS.REFRESH_TOKEN);
        await SecureStore.deleteItemAsync(STORAGE_KEYS.USER);
      } catch { /* ignore */ }
    }
    return Promise.reject(error);
  }
);

// Mêmes interceptors sur apiRestaurant (timeout 5s)
apiRestaurant.interceptors.request.use(
  async (requestConfig) => {
    let token: string | null = null;
    try { token = await SecureStore.getItemAsync(STORAGE_KEYS.ACCESS_TOKEN); } catch {
      token = await storage.getItem<string>(STORAGE_KEYS.AUTH_TOKEN);
    }
    if (token) requestConfig.headers.Authorization = `Bearer ${token}`;
    return requestConfig;
  },
  (error) => Promise.reject(error)
);
apiRestaurant.interceptors.response.use(
  (response) => response,
  (error) => Promise.reject(error)
);

// Petit helper pour vérifier la connexion avant d'appeler l'API
const checkConnection = async (): Promise<boolean> => {
  const state = await NetInfo.fetch();
  return state.isConnected ?? false;
};

export default api;



export const restaurantAPI = {

  // Récupère la liste des restaurants avec filtres optionnels
  // Si hors ligne, on utilise le cache (5 minutes de validité)
  async getRestaurants(filters?: SearchFilters): Promise<Restaurant[]> {
    const isConnected = await checkConnection();

    if (!isConnected) {
      log.warn('Pas de connexion - chargement depuis le cache');
      const cached = await cache.get<Restaurant[]>('restaurants');
      return cached ?? [];
    }

    try {
      const response = await api.get('/restaurants', { params: filters });
      const restaurants: Restaurant[] = response.data?.data ?? [];
      // On met en cache pour le mode hors-ligne
      await cache.set('restaurants', restaurants);
      return restaurants;
    } catch (error) {
      log.error('Erreur chargement restaurants', error);
      // En cas d'erreur réseau, on essaie quand même le cache
      return (await cache.get<Restaurant[]>('restaurants')) ?? [];
    }
  },

  async searchRestaurants(query: string): Promise<Restaurant[]> {
    try {
      const response = await api.get('/restaurants/search', { params: { q: query } });
      return response.data?.data ?? [];
    } catch (error) {
      log.error('Erreur recherche restaurants', error);
      return [];
    }
  },

  async getRestaurantById(id: string): Promise<Restaurant | null> {
    const isConnected = await checkConnection();
    if (!isConnected) {
      return (await cache.get<Restaurant>(`restaurant_${id}`)) ?? null;
    }
    try {
      const response = await apiRestaurant.get(`/restaurants/${id}`);
      const restaurant: Restaurant = response.data?.data ?? null;
      if (restaurant) await cache.set(`restaurant_${id}`, restaurant);
      return restaurant;
    } catch (error) {
      log.error(`Erreur chargement restaurant ${id}`, error);
      return (await cache.get<Restaurant>(`restaurant_${id}`)) ?? null;
    }
  },

  // Récupère le menu et aplatit les catégories en liste de plats
  async getMenu(restaurantId: string): Promise<Dish[]> {
    const isConnected = await checkConnection();
    if (!isConnected) {
      return (await cache.get<Dish[]>(`menu_${restaurantId}`)) ?? [];
    }
    try {
      const response = await apiRestaurant.get(`/restaurants/${restaurantId}/menu`);
      const menuData: MenuCategory[] = response.data?.data ?? [];
      // On ajoute le restaurantId à chaque plat car l'API ne le renvoie pas
      const dishes = menuData.flatMap((cat) =>
        (cat.items ?? []).map((item) => ({ ...item, restaurantId }))
      );
      await cache.set(`menu_${restaurantId}`, dishes);
      return dishes;
    } catch (error) {
      log.error(`Erreur chargement menu ${restaurantId}`, error);
      return (await cache.get<Dish[]>(`menu_${restaurantId}`)) ?? [];
    }
  },

  // Version qui garde la structure par catégories (pour l'écran restaurant)
  // On vérifie le cache d'abord pour un chargement instantané
  async getMenuCategories(restaurantId: string): Promise<MenuCategory[]> {
    // Essayer le cache d'abord pour un affichage rapide
    const cached = await cache.get<MenuCategory[]>(`menuCats_${restaurantId}`);
    if (cached) return cached;

    try {
      const response = await apiRestaurant.get(`/restaurants/${restaurantId}/menu`);
      const menuData: MenuCategory[] = response.data?.data ?? [];
      const result = menuData.map((cat) => ({
        ...cat,
        items: cat.items.map((item) => ({ ...item, restaurantId })),
      }));
      await cache.set(`menuCats_${restaurantId}`, result);
      return result;
    } catch (error) {
      log.error(`Erreur chargement catégories menu ${restaurantId}`, error);
      return [];
    }
  },

  async getCategories(): Promise<Category[]> {
    try {
      // On met en cache les catégories car elles changent rarement
      const cached = await cache.get<Category[]>('categories');
      if (cached) return cached;

      const response = await api.get('/categories');
      const categories: Category[] = response.data?.data ?? [];
      await cache.set('categories', categories);
      return categories;
    } catch (error) {
      log.error('Erreur chargement catégories', error);
      return [];
    }
  },

  async getReviews(restaurantId: string, page = 1): Promise<Review[]> {
    try {
      const response = await apiRestaurant.get(`/restaurants/${restaurantId}/reviews`, {
        params: { page, limit: 10 },
      });
      return response.data?.data ?? [];
    } catch (error) {
      log.error(`Erreur chargement avis ${restaurantId}`, error);
      return [];
    }
  },

  // Estimation livraison basée sur la position GPS de l'utilisateur
  async getDeliveryEstimate(
    restaurantId: string,
    lat?: number,
    lng?: number
  ): Promise<DeliveryEstimate | null> {
    try {
      const response = await apiRestaurant.get(`/restaurants/${restaurantId}/delivery-estimate`, {
        params: { lat, lng },
      });
      return response.data?.data ?? null;
    } catch (error) {
      log.error(`Erreur estimation livraison ${restaurantId}`, error);
      return null;
    }
  },

  async getNearby(lat: number, lng: number, radius = 5): Promise<Restaurant[]> {
    try {
      const response = await api.get('/restaurants/nearby', {
        params: { lat, lng, radius },
      });
      return response.data?.data ?? [];
    } catch (error) {
      log.error('Erreur restaurants proches', error);
      return [];
    }
  },
};



export const userAPI = {

  async login(email: string, password: string): Promise<{ user: User; token: string }> {
    try {
      const response = await api.post('/auth/login', { email, password });
      const { user, token } = response.data;
      await storage.setItem(STORAGE_KEYS.USER, user);
      await storage.setItem(STORAGE_KEYS.AUTH_TOKEN, token);
      return { user, token };
    } catch (error) {
      log.error('Erreur connexion', error);
      throw error;
    }
  },

  async getCurrentUser(): Promise<User | null> {
    // On cherche d'abord dans SecureStore (stocké par auth.ts lors du login)
    // puis dans AsyncStorage (fallback)
    try {
      const { auth } = await import('./auth');
      const user = await auth.getStoredUser();
      if (user) return user;
    } catch { /* ignore */ }
    return storage.getItem<User>(STORAGE_KEYS.USER);
  },

  async toggleFavorite(restaurantId: string): Promise<void> {
    try {
      await api.post(`/user/favorites/${restaurantId}`);
    } catch (error) {
      log.error('Erreur toggle favori', error);
      throw error;
    }
  },

  async getFavorites(): Promise<Restaurant[]> {
    try {
      const response = await api.get('/user/favorites');
      return response.data?.data ?? [];
    } catch (error) {
      log.error('Erreur chargement favoris', error);
      return [];
    }
  },

  async updateProfile(updates: Partial<User>): Promise<User> {
    try {
      const response = await api.patch('/user/profile', updates);
      const user = response.data?.data ?? response.data;
      await storage.setItem(STORAGE_KEYS.USER, user);
      return user;
    } catch (error) {
      log.error('Erreur mise à jour profil', error);
      throw error;
    }
  },

  async logout(): Promise<void> {
    await storage.removeItem(STORAGE_KEYS.USER);
    await storage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
    await cache.clearAll();
    log.info('Déconnexion - cache vidé');
  },

  async addAddress(
    addressData: Omit<import('@/types').Address, 'id'>
  ): Promise<import('@/types').Address> {
    const response = await api.post('/users/addresses', addressData);
    return response.data?.data;
  },

  async updateAddress(
    id: string,
    data: Partial<import('@/types').Address>
  ): Promise<import('@/types').Address> {
    const response = await api.put(`/users/addresses/${id}`, data);
    return response.data?.data;
  },

  async deleteAddress(id: string): Promise<void> {
    await api.delete(`/users/addresses/${id}`);
  },

  async getAddresses(): Promise<import('@/types').Address[]> {
    try {
      const response = await api.get('/users/addresses');
      return response.data?.data ?? [];
    } catch {
      return [];
    }
  },
};



export const orderAPI = {

  async getOrders(): Promise<Order[]> {
    const isConnected = await checkConnection();
    if (!isConnected) {
      return (await cache.get<Order[]>('orders')) ?? [];
    }
    try {
      const response = await api.get('/orders');
      const orders: Order[] = response.data?.data ?? [];
      await cache.set('orders', orders);
      return orders;
    } catch {
      // Pas de toast ici, l'écran gère l'erreur
      return (await cache.get<Order[]>('orders')) ?? [];
    }
  },

  async getOrderById(id: string): Promise<Order | null> {
    const isConnected = await checkConnection();
    if (!isConnected) {
      return (await cache.get<Order>(`order_${id}`)) ?? null;
    }
    try {
      const response = await api.get(`/orders/${id}`);
      const order: Order = response.data?.data ?? null;
      if (order) await cache.set(`order_${id}`, order);
      return order;
    } catch {
      return (await cache.get<Order>(`order_${id}`)) ?? null;
    }
  },

  async createOrder(payload: {
    restaurantId: string;
    items: { menuItemId: string; quantity: number }[];
    deliveryAddress: Partial<import('@/types').Address>;
    paymentMethod: string;
    tip?: number;
    promoCode?: string;
  }): Promise<Order> {
    const response = await api.post('/orders', payload);
    return response.data?.data;
  },

  async cancelOrder(id: string, reason?: string): Promise<Order> {
    const response = await api.post(`/orders/${id}/cancel`, { reason });
    return response.data?.data;
  },

  // Polling utilisé pour le suivi en temps réel (appelé toutes les 10s)
  async trackOrder(id: string): Promise<any> {
    const response = await api.get(`/orders/${id}/track`);
    return response.data?.data;
  },

  // Synchronise les commandes passées hors-ligne quand on retrouve la connexion
  async syncOfflineOrders(): Promise<void> {
    const offlineOrders = await storage.getItem<any[]>(STORAGE_KEYS.OFFLINE_ORDERS);
    if (!offlineOrders?.length) return;
    try {
      await api.post('/sync/orders', { offlineOrders });
      await storage.removeItem(STORAGE_KEYS.OFFLINE_ORDERS);
      log.info('Commandes hors-ligne synchronisées');
    } catch (error) {
      log.error('Erreur sync commandes hors-ligne', error);
      throw error;
    }
  },
};



export const uploadAPI = {
  // FormData natif React Native - format spécial pour les fichiers
  async uploadImage(uri: string, type: 'profile' | 'review'): Promise<string> {
    try {
      const formData = new FormData();
      formData.append('image', {
        uri,
        name: `${type}_${Date.now()}.jpg`,
        type: 'image/jpeg',
      } as any);

      const response = await api.post('/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return response.data?.url ?? response.data?.data?.url;
    } catch (error) {
      log.error('Erreur upload image', error);
      throw error;
    }
  },
};



export const promoAPI = {
  // Validation en temps réel - appelée quand l'utilisateur tape le code
  async validate(code: string, subtotal?: number): Promise<PromoResult> {
    const response = await api.post('/promos/validate', { code, subtotal });
    return response.data?.data;
  },

  async getAvailable(): Promise<PromoResult[]> {
    try {
      const response = await api.get('/promos/available');
      return response.data?.data ?? [];
    } catch {
      // Pas critique si les promos ne chargent pas
      return [];
    }
  },
};



export const reviewAPI = {
  // FormData car on peut envoyer des photos avec l'avis
  async createReview(data: FormData): Promise<Review> {
    const response = await api.post('/reviews', data, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data?.data;
  },
};



export const searchAPI = {
  async getSuggestions(q: string): Promise<any[]> {
    try {
      const response = await api.get('/search/suggestions', { params: { q } });
      return response.data?.data ?? [];
    } catch {
      return [];
    }
  },

  async getPopular(): Promise<any[]> {
    try {
      const response = await api.get('/search/popular');
      return response.data?.data ?? [];
    } catch {
      return [];
    }
  },
};



export const passwordAPI = {

  // Étape 1 : demander un code de réinitialisation
  // Le backend génère un code à 6 chiffres et le retourne (en prod, il l'enverrait par email)
  async forgotPassword(email: string): Promise<{ resetCode: string; message: string }> {
    const response = await api.post('/auth/forgot-password', { email });
    return response.data;
  },

  // Étape 2 : réinitialiser le mot de passe avec le code reçu
  async resetPassword(email: string, code: string, newPassword: string): Promise<void> {
    await api.post('/auth/reset-password', { email, code, newPassword });
  },
};
