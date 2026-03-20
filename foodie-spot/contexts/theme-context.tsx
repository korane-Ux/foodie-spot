// contexts/theme-context.tsx
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useColorScheme as useSystemColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

type ThemeMode = 'system' | 'light' | 'dark';
type ResolvedTheme = 'light' | 'dark';

type ThemeContextType = {
  themeMode: ThemeMode;       // Préférence choisie par l'user
  resolvedTheme: ResolvedTheme; // Thème réellement appliqué
  isDark: boolean;
  setThemeMode: (mode: ThemeMode) => void;
  toggleTheme: () => void;    // Bascule light ↔ dark (pour le bouton profil)
  colors: typeof lightColors;
};

export const lightColors = {
  background: '#f9fafb',
  surface: '#ffffff',
  surfaceSecondary: '#f3f4f6',
  text: '#111827',
  textSecondary: '#6b7280',
  textTertiary: '#9ca3af',
  border: '#e5e7eb',
  borderLight: '#f0f0f0',
  primary: '#FF6B35',
  primaryLight: '#FFF5F2',
  card: '#ffffff',
  shadow: '#000000',
  inputBackground: '#f9fafb',
  tabBar: '#ffffff',
  header: '#ffffff',
  placeholder: '#9ca3af',
  error: '#ef4444',
  success: '#10b981',
  warning: '#f59e0b',
};

export const darkColors: typeof lightColors = {
  background: '#0f172a',
  surface: '#1e293b',
  surfaceSecondary: '#334155',
  text: '#f1f5f9',
  textSecondary: '#94a3b8',
  textTertiary: '#64748b',
  border: '#334155',
  borderLight: '#1e293b',
  primary: '#FF6B35',
  primaryLight: '#2d1a12',
  card: '#1e293b',
  shadow: '#000000',
  inputBackground: '#0f172a',
  tabBar: '#1e293b',
  header: '#1e293b',
  placeholder: '#64748b',
  error: '#f87171',
  success: '#34d399',
  warning: '#fbbf24',
};

const STORAGE_KEY = 'theme_mode';

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const systemScheme = useSystemColorScheme();
  const [themeMode, setThemeModeState] = useState<ThemeMode>('system');

  // Charger la préférence sauvegardée
  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then(saved => {
      if (saved === 'light' || saved === 'dark' || saved === 'system') {
        setThemeModeState(saved);
      }
    });
  }, []);

  const setThemeMode = (mode: ThemeMode) => {
    setThemeModeState(mode);
    AsyncStorage.setItem(STORAGE_KEY, mode);
  };

  const toggleTheme = () => {
    const next = resolvedTheme === 'dark' ? 'light' : 'dark';
    setThemeMode(next);
  };

  const resolvedTheme: ResolvedTheme =
    themeMode === 'system'
      ? (systemScheme === 'dark' ? 'dark' : 'light')
      : themeMode;

  const isDark = resolvedTheme === 'dark';
  const colors = isDark ? darkColors : lightColors;

  return (
    <ThemeContext.Provider value={{
      themeMode,
      resolvedTheme,
      isDark,
      setThemeMode,
      toggleTheme,
      colors,
    }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within a ThemeProvider');
  return context;
}