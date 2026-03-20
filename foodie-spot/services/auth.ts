// Auth service - gère les tokens JWT dans SecureStore

import * as SecureStore from 'expo-secure-store';
import axios from 'axios';
import log from './logger';
import { STORAGE_KEYS } from './storage';
import { cache } from './cache';
import config from '@/constants/config';

// Instance axios séparée pour login/register (évite le cycle d'import avec api.ts)
const authAxios = axios.create({
  baseURL: config.API_URL,
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
});

export interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  name?: string;
  phone?: string;
  avatar?: string;
  addresses: Address[];
  favoriteRestaurants: string[];
  notificationsEnabled?: boolean;
  createdAt?: string;
}

export interface Address {
  id: string;
  label: string;
  street: string;
  apartment?: string;
  city: string;
  postalCode: string;
  country: string;
  latitude?: number;
  longitude?: number;
  isDefault: boolean;
  instructions?: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken?: string;
  expiresIn: number;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
}

// ============================================
// AuthService
// ============================================
class AuthService {

  // --- Gestion des tokens dans SecureStore ---

  async getAccessToken(): Promise<string | null> {
    try {
      return await SecureStore.getItemAsync(STORAGE_KEYS.ACCESS_TOKEN);
    } catch (error) {
      log.error('Erreur lecture access token:', error);
      return null;
    }
  }

  async setAccessToken(token: string): Promise<void> {
    try {
      await SecureStore.setItemAsync(STORAGE_KEYS.ACCESS_TOKEN, token);
    } catch (error) {
      log.error('Erreur sauvegarde access token:', error);
      throw error;
    }
  }

  async getRefreshToken(): Promise<string | null> {
    try {
      return await SecureStore.getItemAsync(STORAGE_KEYS.REFRESH_TOKEN);
    } catch (error) {
      log.error('Erreur lecture refresh token:', error);
      return null;
    }
  }

  async setRefreshToken(token: string): Promise<void> {
    try {
      await SecureStore.setItemAsync(STORAGE_KEYS.REFRESH_TOKEN, token);
    } catch (error) {
      log.error('Erreur sauvegarde refresh token:', error);
      throw error;
    }
  }

  async clearTokens(): Promise<void> {
    try {
      await SecureStore.deleteItemAsync(STORAGE_KEYS.ACCESS_TOKEN);
      await SecureStore.deleteItemAsync(STORAGE_KEYS.REFRESH_TOKEN);
      await SecureStore.deleteItemAsync(STORAGE_KEYS.USER);
    } catch (error) {
      log.error('Erreur suppression tokens:', error);
    }
  }

  async getStoredUser(): Promise<User | null> {
    try {
      const userJson = await SecureStore.getItemAsync(STORAGE_KEYS.USER);
      if (userJson) return JSON.parse(userJson);
      return null;
    } catch (error) {
      log.error('Erreur lecture user stocké:', error);
      return null;
    }
  }

  async setStoredUser(user: User): Promise<void> {
    try {
      await SecureStore.setItemAsync(STORAGE_KEYS.USER, JSON.stringify(user));
    } catch (error) {
      log.error('Erreur sauvegarde user:', error);
      throw error;
    }
  }

  async getAuthState(): Promise<AuthState> {
    try {
      const [token, user] = await Promise.all([
        this.getAccessToken(),
        this.getStoredUser(),
      ]);
      const isAuthenticated = !!token && !!user;
      return { user: isAuthenticated ? user : null, isAuthenticated };
    } catch (error) {
      log.error('Erreur lecture état auth:', error);
      return { user: null, isAuthenticated: false };
    }
  }

  // --- Appels API d'authentification ---
  // On utilise authAxios (sans intercepteur de token) pour ces endpoints

  async login(credentials: LoginCredentials): Promise<{ user: User; tokens: AuthTokens }> {
    try {
      log.info('🔐 [Auth] Tentative de connexion pour:', credentials.email);

      const response = await authAxios.post('/auth/login', credentials);
      const data = response.data.data || response.data;

      const user: User = {
        ...data.user,
        name: data.user.name || `${data.user.firstName || ''} ${data.user.lastName || ''}`.trim(),
        addresses: data.user.addresses || [],
        favoriteRestaurants: data.user.favoriteRestaurants || [],
      };

      const tokens: AuthTokens = {
        accessToken: data.accessToken || data.token,
        refreshToken: data.refreshToken,
        expiresIn: data.expiresIn || 3600,
      };

      // Sauvegarder les tokens de manière sécurisée
      await this.setAccessToken(tokens.accessToken);
      if (tokens.refreshToken) {
        await this.setRefreshToken(tokens.refreshToken);
      }
      await this.setStoredUser(user);

      log.info('✅ [Auth] Connexion réussie pour:', user.email);
      return { user, tokens };
    } catch (error: any) {
      log.error('❌ [Auth] Échec connexion:', error.message);
      // On utilise le message du backend s'il existe (ex: "Aucun compte trouvé avec cet email")
      const serverMessage = error.response?.data?.message;
      if (serverMessage) {
        throw new Error(serverMessage);
      }
      if (error.response?.status === 401) {
        throw new Error('Email ou mot de passe incorrect');
      }
      throw new Error('Erreur de connexion. Vérifiez votre connexion internet.');
    }
  }

  async register(data: RegisterData): Promise<{ user: User; tokens: AuthTokens }> {
    try {
      log.info('📝 [Auth] Tentative d\'inscription pour:', data.email);

      const response = await authAxios.post('/auth/register', {
        email: data.email,
        password: data.password,
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone || '',
      });

      const resData = response.data.data || response.data;

      const user: User = {
        ...resData.user,
        name: resData.user.name || `${resData.user.firstName || ''} ${resData.user.lastName || ''}`.trim(),
        addresses: resData.user.addresses || [],
        favoriteRestaurants: resData.user.favoriteRestaurants || [],
      };

      const tokens: AuthTokens = {
        accessToken: resData.accessToken || resData.token,
        refreshToken: resData.refreshToken,
        expiresIn: resData.expiresIn || 3600,
      };

      await this.setAccessToken(tokens.accessToken);
      if (tokens.refreshToken) {
        await this.setRefreshToken(tokens.refreshToken);
      }
      await this.setStoredUser(user);

      log.info('✅ [Auth] Inscription réussie pour:', user.email);
      return { user, tokens };
    } catch (error: any) {
      log.error('❌ [Auth] Échec inscription:', error.message);
      if (error.response?.status === 409) {
        throw new Error('Cet email est déjà utilisé');
      }
      throw new Error('Erreur lors de l\'inscription. Vérifiez votre connexion internet.');
    }
  }

  async logout(): Promise<void> {
    try {
      log.info('🚪 [Auth] Déconnexion...');
      // On essaie d'appeler l'API logout mais ce n'est pas bloquant
      try {
        await authAxios.post('/auth/logout');
      } catch {
        log.warn('⚠️ [Auth] Appel API logout échoué (ignoré)');
      }
      await this.clearTokens();
      cache.clearAll();
      log.info('✅ [Auth] Déconnexion réussie');
    } catch (error) {
      log.error('❌ [Auth] Erreur déconnexion:', error);
      await this.clearTokens();
    }
  }

  async updateProfile(updates: Partial<User>): Promise<User> {
    try {
      // Pour updateProfile on a besoin du token → on utilise l'instance principale
      // Import dynamique pour éviter le cycle au module level
      const { default: api } = await import('./api');
      const response = await api.patch('/user/profile', updates);
      const user = response.data.data || response.data;
      const currentUser = await this.getStoredUser();
      const updatedUser = { ...currentUser, ...user };
      await this.setStoredUser(updatedUser);
      return updatedUser;
    } catch (error) {
      log.error('Erreur mise à jour profil:', error);
      throw error;
    }
  }
}

export const auth = new AuthService();
export default auth;
