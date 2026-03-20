// =============================================================
// contexts/theme-context.tsx
// Gestion du thème clair/sombre de l'application
// L'utilisateur peut choisir manuellement ou suivre le système
// =============================================================

import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { useColorScheme as useSystemColorScheme } from 'react-native';
import { storage, STORAGE_KEYS } from '@/services/storage';
import { ThemeMode } from '@/types';
import { Colors } from '@/constants/theme';

interface ThemeContextType {
  themeMode: ThemeMode;
  isDark: boolean;
  colors: typeof Colors.light;
  setThemeMode: (mode: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // On utilise le schéma système par défaut
  const systemScheme = useSystemColorScheme();
  const [themeMode, setThemeModeState] = useState<ThemeMode>('system');

  // Au démarrage, on charge la préférence sauvegardée
  useEffect(() => {
    storage.getItem<ThemeMode>(STORAGE_KEYS.THEME_MODE).then((saved) => {
      if (saved) {
        console.log('Thème chargé depuis le stockage:', saved);
        setThemeModeState(saved);
      }
    });
  }, []);

  const setThemeMode = useCallback((mode: ThemeMode) => {
    setThemeModeState(mode);
    // On persiste le choix pour le retrouver au prochain lancement
    storage.setItem(STORAGE_KEYS.THEME_MODE, mode);
  }, []);

  // Calcul du thème effectif :
  // - 'light' → toujours clair
  // - 'dark' → toujours sombre
  // - 'system' → suit le téléphone
  const isDark =
    themeMode === 'dark' ||
    (themeMode === 'system' && systemScheme === 'dark');

  const colors = isDark ? Colors.dark : Colors.light;

  return (
    <ThemeContext.Provider value={{ themeMode, isDark, colors, setThemeMode }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme doit être utilisé dans un ThemeProvider');
  return ctx;
}
