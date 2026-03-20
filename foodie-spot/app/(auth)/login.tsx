// =============================================================
// app/(auth)/login.tsx
// Écran de connexion
// =============================================================

import React, { useState } from 'react';
import {
  ActivityIndicator, KeyboardAvoidingView, Platform,
  ScrollView, StyleSheet, Text, TextInput,
  TouchableOpacity, View,
} from 'react-native';
import { router } from 'expo-router';
import { Eye, EyeOff, Lock, Mail } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuth } from '@/contexts/auth-context';
import { useTheme } from '@/contexts/theme-context';
import { useI18n } from '@/contexts/i18n-context';
import { COLORS } from '@/constants/theme';

// Regex basique pour valider le format email
const EMAIL_REGEX = /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/;

export default function LoginScreen() {
  const { login, isLoading, error, clearError } = useAuth();
  const { colors } = useTheme();
  const { t } = useI18n();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  // Erreurs par champ (pas juste un message global)
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({});

  // Validation avant envoi
  const validate = (): boolean => {
    const errors: { email?: string; password?: string } = {};

    if (!email.trim()) {
      errors.email = t('auth.emailRequired');
    } else if (!EMAIL_REGEX.test(email.trim())) {
      errors.email = t('auth.emailInvalid');
    }

    if (!password) {
      errors.password = t('auth.passwordRequired');
    } else if (password.length < 6) {
      errors.password = t('auth.passwordTooShort');
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleLogin = async () => {
    clearError();
    if (!validate()) return;

    try {
      await login({ email: email.trim(), password });
      // La navigation est gérée automatiquement par le NavigationGuard dans _layout
    } catch {
      // L'erreur est déjà dans le contexte auth, pas besoin de faire autre chose
      console.log('Échec de connexion');
    }
  };

  // Efface l'erreur du champ quand l'utilisateur recommence à taper
  const handleChange = (field: 'email' | 'password', value: string) => {
    if (field === 'email') setEmail(value);
    else setPassword(value);

    if (fieldErrors[field]) {
      setFieldErrors((prev) => ({ ...prev, [field]: undefined }));
    }
    clearError();
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
        >
          {/* Logo et titre */}
          <View style={styles.logoSection}>
            <Text style={styles.logoEmoji}>🍔</Text>
            <Text style={[styles.title, { color: COLORS.primary }]}>
              {t('auth.loginTitle')}
            </Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              {t('auth.loginSubtitle')}
            </Text>
          </View>

          {/* Affichage erreur serveur (ex: mauvais mdp) */}
          {error && (
            <View style={styles.errorBanner}>
              <Text style={styles.errorBannerText}>{error}</Text>
            </View>
          )}

          <View style={styles.form}>
            {/* Champ email */}
            <View style={styles.fieldGroup}>
              <View style={[
                styles.inputRow,
                { backgroundColor: colors.backgroundSecondary },
                fieldErrors.email ? styles.inputError : null,
              ]}>
                <Mail size={20} color={fieldErrors.email ? COLORS.error : colors.textMuted} />
                <TextInput
                  style={[styles.input, { color: colors.text }]}
                  placeholder={t('auth.email')}
                  placeholderTextColor={colors.textMuted}
                  value={email}
                  onChangeText={(v) => handleChange('email', v)}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!isLoading}
                />
              </View>
              {/* Message d'erreur sous le champ */}
              {fieldErrors.email && (
                <Text style={styles.fieldError}>{fieldErrors.email}</Text>
              )}
            </View>

            {/* Champ mot de passe */}
            <View style={styles.fieldGroup}>
              <View style={[
                styles.inputRow,
                { backgroundColor: colors.backgroundSecondary },
                fieldErrors.password ? styles.inputError : null,
              ]}>
                <Lock size={20} color={fieldErrors.password ? COLORS.error : colors.textMuted} />
                <TextInput
                  style={[styles.input, { color: colors.text }]}
                  placeholder={t('auth.password')}
                  placeholderTextColor={colors.textMuted}
                  value={password}
                  onChangeText={(v) => handleChange('password', v)}
                  secureTextEntry={!showPassword}
                  editable={!isLoading}
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  accessibilityLabel={showPassword ? 'Cacher le mot de passe' : 'Afficher le mot de passe'}
                >
                  {showPassword
                    ? <EyeOff size={20} color={colors.textMuted} />
                    : <Eye size={20} color={colors.textMuted} />}
                </TouchableOpacity>
              </View>
              {fieldErrors.password && (
                <Text style={styles.fieldError}>{fieldErrors.password}</Text>
              )}
            </View>

            <TouchableOpacity style={styles.forgotBtn}>
              <Text style={[styles.forgotText, { color: COLORS.primary }]}>
                {t('auth.forgotPassword')}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.submitBtn, isLoading && styles.submitDisabled]}
              onPress={handleLogin}
              disabled={isLoading}
              activeOpacity={0.85}
            >
              {isLoading
                ? <ActivityIndicator color="#fff" />
                : <Text style={styles.submitText}>{t('auth.login')}</Text>
              }
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.switchAuth}
            onPress={() => router.push('/(auth)/register')}
            disabled={isLoading}
          >
            <Text style={[styles.switchText, { color: colors.textSecondary }]}>
              {t('auth.noAccount')}{' '}
              <Text style={[styles.switchTextBold, { color: COLORS.primary }]}>
                {t('auth.register')}
              </Text>
            </Text>
          </TouchableOpacity>

          {/* Indication pour les tests - à retirer en prod */}
          <View style={[styles.demoBox, { backgroundColor: colors.backgroundSecondary }]}>
            <Text style={[styles.demoText, { color: colors.textSecondary }]}>
              {t('auth.demoHint')}
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { flexGrow: 1, justifyContent: 'center', padding: 24 },
  logoSection: { alignItems: 'center', marginBottom: 32 },
  logoEmoji: { fontSize: 64, marginBottom: 8 },
  title: { fontSize: 32, fontWeight: 'bold', marginBottom: 6 },
  subtitle: { fontSize: 16 },
  errorBanner: {
    backgroundColor: '#FFEBEE', borderRadius: 12,
    padding: 12, marginBottom: 16,
  },
  errorBannerText: { color: COLORS.error, textAlign: 'center', fontSize: 14 },
  form: { gap: 4 },
  fieldGroup: { marginBottom: 12 },
  inputRow: {
    flexDirection: 'row', alignItems: 'center',
    borderRadius: 12, paddingHorizontal: 16,
    gap: 12, borderWidth: 1.5, borderColor: 'transparent',
  },
  inputError: { borderColor: COLORS.error },
  input: { flex: 1, paddingVertical: 16, fontSize: 16 },
  fieldError: { color: COLORS.error, fontSize: 12, marginTop: 4, marginLeft: 4 },
  forgotBtn: { alignSelf: 'flex-end', marginBottom: 16, padding: 4 },
  forgotText: { fontSize: 14 },
  submitBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 12, padding: 16, alignItems: 'center',
  },
  submitDisabled: { opacity: 0.65 },
  submitText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  switchAuth: { alignItems: 'center', padding: 16, marginTop: 16 },
  switchText: { fontSize: 14 },
  switchTextBold: { fontWeight: '700' },
  demoBox: { padding: 12, borderRadius: 10, marginTop: 8 },
  demoText: { fontSize: 12, textAlign: 'center' },
});
