import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { getTranslation, interpolate, Language } from '@/i18n';
import { storage, STORAGE_KEYS } from '@/services/storage';

interface I18nContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string, params?: Record<string, string>) => string;
  tArray: (key: string) => string[];
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>('fr');

  useEffect(() => {
    storage.getItem<Language>('appLanguage').then((saved) => {
      if (saved === 'fr' || saved === 'en') setLanguageState(saved);
    });
  }, []);

  const setLanguage = useCallback((lang: Language) => {
    setLanguageState(lang);
    storage.setItem('appLanguage', lang);
  }, []);

  const t = useCallback(
    (key: string, params?: Record<string, string>) => {
      const raw = getTranslation(language, key);
      return params ? interpolate(raw, params) : raw;
    },
    [language]
  );

  // Pour les tableaux (ex: onboarding slides, ratings)
  const tArray = useCallback(
    (key: string): string[] => {
      const keys = key.split('.');
      let value: any = require('@/i18n').translations[language];
      for (const k of keys) value = value?.[k];
      return Array.isArray(value) ? value : [];
    },
    [language]
  );

  return (
    <I18nContext.Provider value={{ language, setLanguage, t, tArray }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n must be used within I18nProvider');
  return ctx;
}
