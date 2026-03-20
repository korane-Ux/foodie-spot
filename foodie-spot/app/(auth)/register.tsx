import React, { useState } from 'react';
import {
  ActivityIndicator, KeyboardAvoidingView, Platform,
  ScrollView, StyleSheet, Text, TextInput,
  TouchableOpacity, View,
} from 'react-native';
import { router } from 'expo-router';
import { Eye, EyeOff, Lock, Mail, Phone, User } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuth } from '@/contexts/auth-context';
import { useTheme } from '@/contexts/theme-context';
import { useI18n } from '@/contexts/i18n-context';
import { COLORS } from '@/constants/theme';

const EMAIL_REGEX = /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/;

type Fields = 'firstName' | 'lastName' | 'email' | 'password' | 'confirmPassword';

export default function RegisterScreen() {
  const { register, isLoading, error, clearError } = useAuth();
  const { colors } = useTheme();
  const { t } = useI18n();

  const [form, setForm] = useState({
    firstName: '', lastName: '', email: '',
    phone: '', password: '', confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<Fields, string>>>({});

  const setField = (key: keyof typeof form, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (fieldErrors[key as Fields]) {
      setFieldErrors((prev) => ({ ...prev, [key]: undefined }));
    }
    clearError();
  };

  const validate = (): boolean => {
    const errors: Partial<Record<Fields, string>> = {};
    if (!form.firstName.trim()) errors.firstName = t('auth.firstNameRequired');
    if (!form.lastName.trim()) errors.lastName = t('auth.lastNameRequired');
    if (!form.email.trim()) {
      errors.email = t('auth.emailRequired');
    } else if (!EMAIL_REGEX.test(form.email.trim())) {
      errors.email = t('auth.emailInvalid');
    }
    if (!form.password) {
      errors.password = t('auth.passwordRequired');
    } else if (form.password.length < 6) {
      errors.password = t('auth.passwordTooShort');
    }
    if (form.password !== form.confirmPassword) {
      errors.confirmPassword = t('auth.passwordsNoMatch');
    }
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleRegister = async () => {
    clearError();
    if (!validate()) return;
    try {
      await register({
        email: form.email.trim(),
        password: form.password,
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        phone: form.phone.trim(),
      });
    } catch {
      // Erreur gérée par le contexte
    }
  };

  const InputField = ({
    field, icon, placeholder, secure, keyboardType, half,
  }: {
    field: Fields | 'phone';
    icon: React.ReactNode;
    placeholder: string;
    secure?: boolean;
    keyboardType?: any;
    half?: boolean;
  }) => {
    const isSecureField = secure;
    return (
      <View style={[styles.fieldGroup, half && { flex: 1 }]}>
        <View style={[
          styles.inputRow,
          { backgroundColor: colors.backgroundSecondary },
          fieldErrors[field as Fields] ? styles.inputError : null,
        ]}>
          {icon}
          <TextInput
            style={[styles.input, { color: colors.text }]}
            placeholder={placeholder}
            placeholderTextColor={colors.textMuted}
            value={form[field as keyof typeof form]}
            onChangeText={(v) => setField(field as keyof typeof form, v)}
            secureTextEntry={isSecureField && !showPassword}
            keyboardType={keyboardType ?? 'default'}
            autoCapitalize={field === 'email' ? 'none' : 'words'}
            autoCorrect={false}
            editable={!isLoading}
          />
          {isSecureField && (
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
              {showPassword
                ? <EyeOff size={18} color={colors.textMuted} />
                : <Eye size={18} color={colors.textMuted} />}
            </TouchableOpacity>
          )}
        </View>
        {fieldErrors[field as Fields] && (
          <Text style={styles.fieldError}>{fieldErrors[field as Fields]}</Text>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          {/* Logo */}
          <View style={styles.logoSection}>
            <Text style={styles.logoEmoji}>🍔</Text>
            <Text style={[styles.title, { color: COLORS.primary }]}>{t('auth.registerTitle')}</Text>
          </View>

          {/* Erreur serveur */}
          {error && (
            <View style={styles.errorBanner}>
              <Text style={styles.errorBannerText}>{error}</Text>
            </View>
          )}

          {/* Formulaire */}
          <View style={styles.form}>
            {/* Prénom + Nom en ligne */}
            <View style={styles.nameRow}>
              <InputField
                field="firstName"
                icon={<User size={18} color={fieldErrors.firstName ? COLORS.error : colors.textMuted} />}
                placeholder={t('auth.firstName')}
                half
              />
              <InputField
                field="lastName"
                icon={<></>}
                placeholder={t('auth.lastName')}
                half
              />
            </View>

            <InputField
              field="email"
              icon={<Mail size={20} color={fieldErrors.email ? COLORS.error : colors.textMuted} />}
              placeholder={t('auth.email')}
              keyboardType="email-address"
            />

            <InputField
              field="phone"
              icon={<Phone size={20} color={colors.textMuted} />}
              placeholder={t('auth.phone')}
              keyboardType="phone-pad"
            />

            <InputField
              field="password"
              icon={<Lock size={20} color={fieldErrors.password ? COLORS.error : colors.textMuted} />}
              placeholder={t('auth.password')}
              secure
            />

            <InputField
              field="confirmPassword"
              icon={<Lock size={20} color={fieldErrors.confirmPassword ? COLORS.error : colors.textMuted} />}
              placeholder={t('auth.confirmPassword')}
              secure
            />

            <TouchableOpacity
              style={[styles.submitBtn, isLoading && styles.submitDisabled]}
              onPress={handleRegister}
              disabled={isLoading}
              activeOpacity={0.85}
            >
              {isLoading
                ? <ActivityIndicator color="#fff" />
                : <Text style={styles.submitText}>{t('auth.createAccount')}</Text>}
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.switchAuth}
            onPress={() => router.back()}
            disabled={isLoading}
          >
            <Text style={[styles.switchText, { color: colors.textSecondary }]}>
              {t('auth.alreadyAccount')}{' '}
              <Text style={[styles.switchTextBold, { color: COLORS.primary }]}>
                {t('auth.login')}
              </Text>
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { flexGrow: 1, justifyContent: 'center', padding: 24 },
  logoSection: { alignItems: 'center', marginBottom: 24 },
  logoEmoji: { fontSize: 48, marginBottom: 8 },
  title: { fontSize: 26, fontWeight: 'bold' },
  errorBanner: {
    backgroundColor: '#FFEBEE', borderRadius: 12,
    padding: 12, marginBottom: 12,
  },
  errorBannerText: { color: COLORS.error, textAlign: 'center', fontSize: 14 },
  form: { gap: 0 },
  nameRow: { flexDirection: 'row', gap: 10 },
  fieldGroup: { marginBottom: 10 },
  inputRow: {
    flexDirection: 'row', alignItems: 'center',
    borderRadius: 12, paddingHorizontal: 14,
    gap: 10, borderWidth: 1.5, borderColor: 'transparent',
  },
  inputError: { borderColor: COLORS.error },
  input: { flex: 1, paddingVertical: 14, fontSize: 15 },
  fieldError: { color: COLORS.error, fontSize: 11, marginTop: 3, marginLeft: 4 },
  submitBtn: {
    backgroundColor: COLORS.primary, borderRadius: 12,
    padding: 16, alignItems: 'center', marginTop: 8,
  },
  submitDisabled: { opacity: 0.65 },
  submitText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  switchAuth: { alignItems: 'center', padding: 16, marginTop: 12 },
  switchText: { fontSize: 14 },
  switchTextBold: { fontWeight: '700' },
});
