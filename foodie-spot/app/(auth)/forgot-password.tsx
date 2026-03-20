// =============================================================
// app/(auth)/forgot-password.tsx
// Réinitialisation du mot de passe en 3 étapes :
//   1. Saisir son email → le backend génère un code à 6 chiffres
//   2. Saisir le code reçu (affiché dans la console du backend pour les tests)
//   3. Saisir le nouveau mot de passe
// =============================================================

import React, { useState } from 'react';
import {
  ActivityIndicator, KeyboardAvoidingView, Platform,
  ScrollView, StyleSheet, Text, TextInput,
  TouchableOpacity, View,
} from 'react-native';
import { router } from 'expo-router';
import { ArrowLeft, Lock, Mail, KeyRound, CheckCircle } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { passwordAPI } from '@/services/api';
import { useTheme } from '@/contexts/theme-context';
import { COLORS } from '@/constants/theme';

type Step = 'email' | 'code' | 'newPassword' | 'success';

const EMAIL_REGEX = /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/;

export default function ForgotPasswordScreen() {
  const { colors } = useTheme();

  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  // En mode test, le backend retourne le code dans la réponse
  // On l'affiche à l'utilisateur pour qu'il puisse tester
  const [receivedCode, setReceivedCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Étape 1 : demander le code
  const handleRequestCode = async () => {
    setError('');
    if (!email.trim()) { setError('Veuillez entrer votre email'); return; }
    if (!EMAIL_REGEX.test(email.trim())) { setError('Email invalide'); return; }

    setLoading(true);
    try {
      const result = await passwordAPI.forgotPassword(email.trim());

      // Si l'email a été vraiment envoyé, on n'affiche pas le code
      // Si pas de config email (mode test), le backend retourne le code dans la réponse
      if (result.resetCode) {
        setReceivedCode(result.resetCode);
      }

      setStep('code');
    } catch (err: any) {
      // Si l'email n'existe pas, le backend répond quand même succès (sécurité)
      // mais peut renvoyer une erreur réseau
      setError(err?.response?.data?.message ?? "Erreur lors de l'envoi du code");
    } finally {
      setLoading(false);
    }
  };

  // Étape 2 : valider le code
  const handleVerifyCode = () => {
    setError('');
    if (!code.trim()) { setError('Veuillez entrer le code reçu'); return; }
    if (code.trim().length !== 6) { setError('Le code doit faire 6 chiffres'); return; }
    setStep('newPassword');
  };

  // Étape 3 : changer le mot de passe
  const handleResetPassword = async () => {
    setError('');
    if (!newPassword) { setError('Veuillez entrer un nouveau mot de passe'); return; }
    if (newPassword.length < 6) { setError('Mot de passe trop court (minimum 6 caractères)'); return; }
    if (newPassword !== confirmPassword) { setError('Les mots de passe ne correspondent pas'); return; }

    setLoading(true);
    try {
      await passwordAPI.resetPassword(email.trim(), code.trim(), newPassword);
      setStep('success');
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Code invalide ou expiré');
    } finally {
      setLoading(false);
    }
  };

  // Barre de progression en haut
  const Progress = () => (
    <View style={styles.progressRow}>
      {(['email', 'code', 'newPassword'] as Step[]).map((s, i) => (
        <View
          key={s}
          style={[
            styles.progressDot,
            {
              backgroundColor:
                step === 'success' || ['email', 'code', 'newPassword'].indexOf(step) >= i
                  ? COLORS.primary
                  : colors.border,
            },
          ]}
        />
      ))}
    </View>
  );

  // Écran de succès
  if (step === 'success') {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.successBox}>
          <CheckCircle size={80} color={COLORS.success} />
          <Text style={[styles.successTitle, { color: colors.text }]}>
            Mot de passe modifié !
          </Text>
          <Text style={[styles.successSub, { color: colors.textSecondary }]}>
            Votre mot de passe a été réinitialisé avec succès. Vous pouvez maintenant vous connecter.
          </Text>
          <TouchableOpacity
            style={styles.primaryBtn}
            onPress={() => router.replace('/login')}
          >
            <Text style={styles.primaryBtnText}>Se connecter</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

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
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity
              onPress={() => {
                if (step === 'email') router.back();
                else if (step === 'code') setStep('email');
                else if (step === 'newPassword') setStep('code');
              }}
              style={styles.backBtn}
            >
              <ArrowLeft size={24} color={colors.text} />
            </TouchableOpacity>
          </View>

          <Progress />

          {/* Icône + Titre selon l'étape */}
          <View style={styles.titleSection}>
            <View style={[styles.iconCircle, { backgroundColor: COLORS.primaryLight }]}>
              {step === 'email' && <Mail size={32} color={COLORS.primary} />}
              {step === 'code' && <KeyRound size={32} color={COLORS.primary} />}
              {step === 'newPassword' && <Lock size={32} color={COLORS.primary} />}
            </View>
            <Text style={[styles.title, { color: colors.text }]}>
              {step === 'email' && 'Mot de passe oublié ?'}
              {step === 'code' && 'Entrez le code'}
              {step === 'newPassword' && 'Nouveau mot de passe'}
            </Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              {step === 'email' &&
                'Entrez votre email pour recevoir un code de réinitialisation.'}
              {step === 'code' &&
                `Un code à 6 chiffres a été envoyé à ${email}.\n\n⚙️ Mode test : code affiché ci-dessous.`}
              {step === 'newPassword' &&
                'Choisissez un nouveau mot de passe sécurisé (minimum 6 caractères).'}
            </Text>
          </View>

          {/* Code visible si pas de config email dans le backend (mode test) */}
          {step === 'code' && receivedCode !== '' && (
            <View style={[styles.codeHint, { backgroundColor: colors.backgroundSecondary }]}>
              <Text style={[styles.codeHintLabel, { color: colors.textSecondary }]}>
                🧪 Mode test — aucun serveur email configuré.{'\n'}
                Avec EMAIL_USER + EMAIL_PASS dans le .env du backend,{'\n'}
                ce code serait envoyé par email automatiquement.
              </Text>
              <Text style={[styles.codeHintValue, { color: COLORS.primary }]}>
                {receivedCode}
              </Text>
            </View>
          )}
          {step === 'code' && receivedCode === '' && (
            <View style={[styles.codeHint, { backgroundColor: '#E8F5E9' }]}>
              <Text style={[styles.codeHintLabel, { color: '#2E7D32' }]}>
                ✉️ Email envoyé à {email}.{'\n'}Vérifiez votre boîte de réception.
              </Text>
            </View>
          )}

          {/* Erreur */}
          {error !== '' && (
            <View style={styles.errorBanner}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          {/* Formulaire étape 1 : Email */}
          {step === 'email' && (
            <View style={styles.form}>
              <View style={[styles.inputRow, { backgroundColor: colors.backgroundSecondary }]}>
                <Mail size={20} color={colors.textMuted} />
                <TextInput
                  style={[styles.input, { color: colors.text }]}
                  placeholder="Votre email"
                  placeholderTextColor={colors.textMuted}
                  value={email}
                  onChangeText={(v) => { setEmail(v); setError(''); }}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
              <TouchableOpacity
                style={[styles.primaryBtn, loading && styles.btnDisabled]}
                onPress={handleRequestCode}
                disabled={loading}
              >
                {loading
                  ? <ActivityIndicator color="#fff" />
                  : <Text style={styles.primaryBtnText}>Envoyer le code</Text>}
              </TouchableOpacity>
            </View>
          )}

          {/* Formulaire étape 2 : Code */}
          {step === 'code' && (
            <View style={styles.form}>
              <View style={[styles.inputRow, { backgroundColor: colors.backgroundSecondary }]}>
                <KeyRound size={20} color={colors.textMuted} />
                <TextInput
                  style={[styles.input, { color: colors.text, letterSpacing: 8, fontSize: 20, fontWeight: '700' }]}
                  placeholder="000000"
                  placeholderTextColor={colors.textMuted}
                  value={code}
                  onChangeText={(v) => { setCode(v.replace(/\D/g, '').slice(0, 6)); setError(''); }}
                  keyboardType="numeric"
                  maxLength={6}
                />
              </View>
              <TouchableOpacity
                style={styles.primaryBtn}
                onPress={handleVerifyCode}
              >
                <Text style={styles.primaryBtnText}>Vérifier le code</Text>
              </TouchableOpacity>
              {/* Renvoyer le code */}
              <TouchableOpacity
                style={styles.resendBtn}
                onPress={() => { setCode(''); setStep('email'); }}
              >
                <Text style={[styles.resendText, { color: COLORS.primary }]}>
                  Renvoyer un code
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Formulaire étape 3 : Nouveau mot de passe */}
          {step === 'newPassword' && (
            <View style={styles.form}>
              <View style={[styles.inputRow, { backgroundColor: colors.backgroundSecondary }]}>
                <Lock size={20} color={colors.textMuted} />
                <TextInput
                  style={[styles.input, { color: colors.text }]}
                  placeholder="Nouveau mot de passe"
                  placeholderTextColor={colors.textMuted}
                  value={newPassword}
                  onChangeText={(v) => { setNewPassword(v); setError(''); }}
                  secureTextEntry
                />
              </View>
              <View style={[styles.inputRow, { backgroundColor: colors.backgroundSecondary }]}>
                <Lock size={20} color={colors.textMuted} />
                <TextInput
                  style={[styles.input, { color: colors.text }]}
                  placeholder="Confirmer le mot de passe"
                  placeholderTextColor={colors.textMuted}
                  value={confirmPassword}
                  onChangeText={(v) => { setConfirmPassword(v); setError(''); }}
                  secureTextEntry
                />
              </View>
              <TouchableOpacity
                style={[styles.primaryBtn, loading && styles.btnDisabled]}
                onPress={handleResetPassword}
                disabled={loading}
              >
                {loading
                  ? <ActivityIndicator color="#fff" />
                  : <Text style={styles.primaryBtnText}>Réinitialiser le mot de passe</Text>}
              </TouchableOpacity>
            </View>
          )}

          <TouchableOpacity
            style={styles.loginLink}
            onPress={() => router.replace('/login')}
          >
            <Text style={[styles.loginLinkText, { color: colors.textSecondary }]}>
              Retour à la{' '}
              <Text style={{ color: COLORS.primary, fontWeight: '700' }}>connexion</Text>
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { flexGrow: 1, padding: 24 },
  header: { marginBottom: 8 },
  backBtn: { padding: 4, alignSelf: 'flex-start' },
  progressRow: {
    flexDirection: 'row', gap: 8,
    justifyContent: 'center', marginBottom: 32,
  },
  progressDot: { width: 40, height: 6, borderRadius: 3 },
  titleSection: { alignItems: 'center', marginBottom: 28, gap: 12 },
  iconCircle: {
    width: 80, height: 80, borderRadius: 40,
    alignItems: 'center', justifyContent: 'center',
  },
  title: { fontSize: 24, fontWeight: 'bold', textAlign: 'center' },
  subtitle: { fontSize: 15, textAlign: 'center', lineHeight: 22 },
  codeHint: {
    borderRadius: 12, padding: 14, marginBottom: 16,
    alignItems: 'center', gap: 6,
  },
  codeHintLabel: { fontSize: 12, textAlign: 'center' },
  codeHintValue: {
    fontSize: 28, fontWeight: '800', letterSpacing: 8,
  },
  errorBanner: {
    backgroundColor: '#FFEBEE', borderRadius: 12,
    padding: 12, marginBottom: 16,
  },
  errorText: { color: COLORS.error, textAlign: 'center', fontSize: 14 },
  form: { gap: 14 },
  inputRow: {
    flexDirection: 'row', alignItems: 'center',
    borderRadius: 12, paddingHorizontal: 16, gap: 12,
  },
  input: { flex: 1, paddingVertical: 16, fontSize: 16 },
  primaryBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 12, padding: 16, alignItems: 'center',
  },
  btnDisabled: { opacity: 0.65 },
  primaryBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  resendBtn: { alignItems: 'center', padding: 8 },
  resendText: { fontSize: 14, fontWeight: '600' },
  loginLink: { alignItems: 'center', padding: 16, marginTop: 24 },
  loginLinkText: { fontSize: 14 },
  successBox: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    gap: 14, padding: 32,
  },
  successTitle: { fontSize: 26, fontWeight: 'bold', textAlign: 'center' },
  successSub: { fontSize: 15, textAlign: 'center', lineHeight: 22 },
});
