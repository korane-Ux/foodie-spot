// =============================================================
// contexts/auth-context.tsx
// Contexte d'authentification global
// Fournit : user, isAuthenticated, login, register, logout
// =============================================================

import React, { createContext, ReactNode, useCallback, useContext, useEffect, useState } from 'react';
import { auth, LoginCredentials, RegisterData, User, AuthTokens } from '@/services/auth';
import log from '@/services/logger';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;
  login: (credentials: LoginCredentials) => Promise<{ user: User; tokens: AuthTokens }>;
  register: (data: RegisterData) => Promise<{ user: User; tokens: AuthTokens }>;
  logout: () => Promise<void>;
  refreshAuth: () => Promise<void>;
  updateUser: (updates: Partial<User>) => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Vérifie l'état auth au démarrage (tokens stockés ?)
  const checkAuth = useCallback(async () => {
    try {
      log.debug('🔍 [AuthContext] Vérification état auth...');
      setIsLoading(true);
      setError(null);
      const state = await auth.getAuthState();
      setUser(state.user);
      setIsAuthenticated(state.isAuthenticated);
      log.debug('✅ [AuthContext] État auth:', state.isAuthenticated ? 'connecté' : 'non connecté');
    } catch (err) {
      log.error('❌ [AuthContext] Erreur vérification auth:', err);
      setError(err instanceof Error ? err.message : 'Erreur de vérification');
      setIsAuthenticated(false);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const login = useCallback(async (credentials: LoginCredentials) => {
    try {
      setIsLoading(true);
      setError(null);

      // Appel API de connexion
      const result = await auth.login(credentials);

      // CORRECTION : le code original avait un setTimeout(resolve, 100) arbitraire ici
      // Ancien code :
      // await new Promise(resolve => setTimeout(resolve, 100));
      // const state = await auth.getAuthState();
      // → Causait une boucle : le guard voyait isAuthenticated=false pendant 100ms
      //   et redirectionnait vers /login alors que le login venait de réussir
      //
      // CORRECTION : on met directement l'état depuis le résultat du login
      setUser(result.user);
      setIsAuthenticated(true);

      log.info('✅ [AuthContext] Connexion réussie');
      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Échec de connexion';
      setError(message);
      setIsAuthenticated(false);
      setUser(null);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const register = useCallback(async (data: RegisterData) => {
    try {
      setIsLoading(true);
      setError(null);

      const result = await auth.register(data);

      // Même correction que pour login : pas de setTimeout arbitraire
      setUser(result.user);
      setIsAuthenticated(true);

      log.info('✅ [AuthContext] Inscription réussie');
      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Échec de l'inscription";
      setError(message);
      setIsAuthenticated(false);
      setUser(null);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      await auth.logout();
      // On remet tout à zéro
      setUser(null);
      setIsAuthenticated(false);
      log.info('✅ [AuthContext] Déconnexion réussie');
      // La navigation vers /login est gérée par le NavigationGuard dans _layout
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Échec de déconnexion';
      setError(message);
      // On déconnecte quand même côté local même si l'API échoue
      setUser(null);
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const refreshAuth = useCallback(async () => {
    await checkAuth();
  }, [checkAuth]);

  const updateUser = useCallback(async (updates: Partial<User>) => {
    try {
      const updatedUser = await auth.updateProfile(updates);
      setUser(updatedUser);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Échec de mise à jour';
      setError(message);
      throw err;
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated,
        error,
        login,
        register,
        logout,
        refreshAuth,
        updateUser,
        clearError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth doit être utilisé dans un AuthProvider');
  }
  return context;
};

export default AuthContext;
