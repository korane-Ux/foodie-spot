import { Platform } from 'react-native';

// ─── Palette principale ───────────────────────────────────────────────────────
export const COLORS = {
  primary: '#FF6B35',
  primaryLight: '#FFE5DB',
  secondary: '#8B5CF6',
  secondaryLight: '#EDE9FE',
  success: '#4CAF50',
  error: '#F44336',
  warning: '#F59E0B',
  info: '#2196F3',
};

export const Colors = {
  light: {
    text: '#11181C',
    textSecondary: '#666',
    textMuted: '#999',
    background: '#FFFFFF',
    backgroundSecondary: '#F5F5F5',
    backgroundTertiary: '#F0F0F0',
    card: '#FFFFFF',
    border: '#E0E0E0',
    tint: COLORS.primary,
    tabIconDefault: '#687076',
    tabIconSelected: COLORS.primary,
    icon: '#687076',
    header: COLORS.primary,
    shadow: '#000000',
  },
  dark: {
    text: '#ECEDEE',
    textSecondary: '#A0A0A0',
    textMuted: '#666',
    background: '#151718',
    backgroundSecondary: '#1E2022',
    backgroundTertiary: '#2A2D2E',
    card: '#1E2022',
    border: '#2A2D2E',
    tint: COLORS.primary,
    tabIconDefault: '#9BA1A6',
    tabIconSelected: COLORS.primary,
    icon: '#9BA1A6',
    header: '#1E2022',
    shadow: '#000000',
  },
};

export const Fonts = Platform.select({
  ios: {
    sans: 'system-ui',
    serif: 'ui-serif',
    rounded: 'ui-rounded',
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, monospace",
  },
});
