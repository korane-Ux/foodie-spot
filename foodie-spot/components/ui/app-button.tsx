import React from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, ViewStyle } from 'react-native';
import { COLORS } from '@/constants/theme';

interface Props {
  label: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'outline';
  style?: ViewStyle;
}

export function AppButton({ label, onPress, loading, disabled, variant = 'primary', style }: Props) {
  const isPrimary = variant === 'primary';
  const isSecondary = variant === 'secondary';
  return (
    <TouchableOpacity
      style={[
        styles.base,
        isPrimary && styles.primary,
        isSecondary && styles.secondary,
        variant === 'outline' && styles.outline,
        (disabled || loading) && styles.disabled,
        style,
      ]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
    >
      {loading ? (
        <ActivityIndicator color={isPrimary ? '#fff' : COLORS.primary} />
      ) : (
        <Text style={[styles.text, !isPrimary && styles.textDark]}>{label}</Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: { borderRadius: 12, padding: 16, alignItems: 'center', justifyContent: 'center' },
  primary: { backgroundColor: COLORS.primary },
  secondary: { backgroundColor: '#F5F5F5' },
  outline: { borderWidth: 1.5, borderColor: COLORS.primary, backgroundColor: 'transparent' },
  disabled: { opacity: 0.6 },
  text: { color: '#fff', fontSize: 16, fontWeight: '600' },
  textDark: { color: COLORS.primary },
});
