import fr from './fr';
import en from './en';

export type Language = 'fr' | 'en';
export type Translations = typeof fr;

const translations: Record<Language, Translations> = { fr, en };

// Accès sécurisé par chemin pointé : t('auth.loginTitle')
export function getTranslation(lang: Language, key: string): string {
  const keys = key.split('.');
  let value: any = translations[lang];
  for (const k of keys) {
    value = value?.[k];
    if (value === undefined) break;
  }
  // Fallback sur FR si clé manquante en EN
  if (value === undefined) {
    let fallback: any = translations['fr'];
    for (const k of keys) fallback = fallback?.[k];
    return typeof fallback === 'string' ? fallback : key;
  }
  return typeof value === 'string' ? value : key;
}

// Interpolation simple : t('cart.freeDeliveryHint', { amount: '3.00' })
export function interpolate(str: string, params?: Record<string, string>): string {
  if (!params) return str;
  return Object.entries(params).reduce(
    (acc, [k, v]) => acc.replace(new RegExp(`{{${k}}}`, 'g'), v),
    str
  );
}

export { translations };
export default translations;
