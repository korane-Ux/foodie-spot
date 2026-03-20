// =============================================================
// app/(tabs)/notifications.tsx
// Écran de test des notifications
// =============================================================

import React, { useEffect, useState } from 'react';
import { Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Device from 'expo-device';
import Ionicons from '@expo/vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';

import { useNotifications } from '@/hooks/use-notifications';
import { useTheme } from '@/contexts/theme-context';
import { useI18n } from '@/contexts/i18n-context';
import { COLORS } from '@/constants/theme';

export default function NotificationScreen() {
  const { colors } = useTheme();
  const { t } = useI18n();
  const isSimulator = !Device.isDevice;
  // Expo Go ne supporte pas les push tokens distants depuis SDK 53
  // Les notifications locales fonctionnent dans tous les cas
  const isExpoGo = require('expo-constants').default.appOwnership === 'expo';
  const isLimited = isSimulator || isExpoGo;
  const [testResults, setTestResults] = useState<string[]>([]);

  const {
    pushToken, isLoading, hasPermission,
    initialize, send, schedule,
    badgeCount, setBadgeCount, clearBadge,
    refreshScheduled, scheduled,
  } = useNotifications(
    (n) => addResult(`✅ ${n.request.content.title}`),
    (data) => addResult(`👆 ${JSON.stringify(data)}`)
  );

  // CORRECTION : le code original avait un useEffect sans tableau de dépendances
  // Ancien code (bugué) :
  // useEffect(() => {
  //   refreshScheduled();
  // });
  // → Appelait refreshScheduled() à CHAQUE render = boucle infinie !
  //
  // CORRECTION : tableau vide [] = exécuté une seule fois au montage
  useEffect(() => {
    refreshScheduled();
  }, []);

  const addResult = (msg: string) => {
    setTestResults((prev) => [`${new Date().toLocaleTimeString()}: ${msg}`, ...prev].slice(0, 20));
  };

  const handleInit = async () => {
    addResult('🔄 Initialisation...');
    const token = await initialize();
    if (token) {
      addResult(`✅ Token: ${token.token.substring(0, 20)}...`);
      addResult(`📱 ${token.platform}`);
    } else {
      addResult("❌ Échec de l'initialisation");
    }
  };

  const handleSendNow = async () => {
    try {
      const id = await send('FoodieSpot 🍔', 'Notification de test immédiate !');
      addResult(`✅ Envoyée (ID: ${id.substring(0, 8)}...)`);
    } catch (e) {
      addResult(`❌ ${e}`);
    }
  };

  const handleSchedule = async (seconds: number) => {
    const date = new Date(Date.now() + seconds * 1000);
    try {
      await schedule(
        seconds === 5 ? '⏱ Test 5s' : '📅 Test 30s',
        `Programmée pour ${seconds} secondes`,
        date
      );
      addResult(`✅ Programmée à ${date.toLocaleTimeString()}`);
    } catch (e) {
      addResult(`❌ ${e}`);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <LinearGradient colors={[COLORS.secondary, '#ec4899']} style={styles.gradientHeader}>
        <View style={styles.headerRow}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => router.back()}
            accessibilityLabel={t('common.back')}
          >
            <Ionicons name="arrow-back" size={22} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t('notifications.title')}</Text>
          <View style={{ width: 40 }} />
        </View>
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Statut */}
        <View style={[styles.card, { backgroundColor: colors.card }]}>
          <View style={styles.statusRow}>
            <Ionicons
              name={isSimulator ? 'phone-portrait-outline' : 'phone-portrait'}
              size={18}
              color={isLimited ? COLORS.warning : COLORS.success}
            />
            <Text style={[styles.statusText, { color: colors.text }]}>
              {isSimulator
                ? t('notifications.simulator')
                : isExpoGo
                  ? '📱 Expo Go (push distants non supportés, local OK)'
                  : t('notifications.device')}
            </Text>
          </View>
          <View style={styles.statusRow}>
            <Ionicons
              name={hasPermission ? 'checkmark-circle' : 'close-circle'}
              size={18}
              color={hasPermission ? COLORS.success : COLORS.error}
            />
            <Text style={[styles.statusText, { color: colors.text }]}>
              {hasPermission
                ? t('notifications.permissionsGranted')
                : t('notifications.permissionsDenied')}
            </Text>
          </View>
          {pushToken && (
            <View style={[styles.tokenRow, { borderTopColor: colors.border }]}>
              <Text style={[styles.tokenLabel, { color: colors.textSecondary }]}>
                {t('notifications.token')}
              </Text>
              <Text style={[styles.tokenValue, { color: colors.text }]} numberOfLines={1}>
                {pushToken.token}
              </Text>
            </View>
          )}
          <View style={[styles.badgeRow, { borderTopColor: colors.border }]}>
            <Text style={[styles.badgeLabel, { color: colors.text }]}>
              {t('notifications.badge')}{badgeCount}
            </Text>
            <Text style={[styles.scheduledLabel, { color: colors.textSecondary }]}>
              {t('notifications.scheduled')}{scheduled.length}
            </Text>
          </View>
        </View>

        {/* Boutons d'action */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            {t('notifications.actions')}
          </Text>
          {[
            { icon: 'notifications-outline' as const, label: t('notifications.initialize'), color: COLORS.secondary, onPress: handleInit, disabled: isLoading },
            { icon: 'send-outline' as const, label: t('notifications.sendNow'), color: COLORS.success, onPress: handleSendNow },
            { icon: 'time-outline' as const, label: t('notifications.schedule5'), color: COLORS.info, onPress: () => handleSchedule(5) },
            { icon: 'calendar-outline' as const, label: t('notifications.schedule30'), color: COLORS.info, onPress: () => handleSchedule(30) },
          ].map((btn) => (
            <TouchableOpacity
              key={btn.label}
              style={[styles.actionBtn, { backgroundColor: btn.color }, btn.disabled && styles.actionBtnDisabled]}
              onPress={btn.onPress}
              disabled={btn.disabled}
              accessibilityLabel={btn.label}
            >
              <Ionicons name={btn.icon} size={18} color="#fff" />
              <Text style={styles.actionBtnText}>{btn.label}</Text>
            </TouchableOpacity>
          ))}
          <View style={styles.badgeBtnRow}>
            {[
              {
                icon: 'ellipse' as const,
                label: t('notifications.setBadge'),
                color: COLORS.warning,
                onPress: async () => { await setBadgeCount(5); addResult('✅ Badge: 5'); },
              },
              {
                icon: 'close-circle-outline' as const,
                label: t('notifications.clearBadge'),
                color: COLORS.error,
                onPress: async () => { await clearBadge(); addResult('✅ Badge effacé'); },
              },
            ].map((btn) => (
              <TouchableOpacity
                key={btn.label}
                style={[styles.actionBtn, styles.actionBtnHalf, { backgroundColor: btn.color }]}
                onPress={btn.onPress}
                accessibilityLabel={btn.label}
              >
                <Ionicons name={btn.icon} size={16} color="#fff" />
                <Text style={styles.actionBtnTextSm}>{btn.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Résultats des tests */}
        <View style={styles.section}>
          <View style={styles.resultsHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              {t('notifications.results')}
            </Text>
            {testResults.length > 0 && (
              <TouchableOpacity onPress={() => setTestResults([])}>
                <Text style={[styles.clearBtn, { color: COLORS.secondary }]}>
                  {t('notifications.clearResults')}
                </Text>
              </TouchableOpacity>
            )}
          </View>
          <View style={[styles.resultsBox, { backgroundColor: colors.backgroundSecondary }]}>
            {testResults.length === 0 ? (
              <Text style={[styles.emptyResults, { color: colors.textMuted }]}>
                {t('notifications.noResults')}
              </Text>
            ) : (
              testResults.map((r, i) => (
                <Text
                  key={i}
                  style={[styles.resultLine, { color: colors.text, borderBottomColor: colors.border }]}
                >
                  {r}
                </Text>
              ))
            )}
          </View>
        </View>

        {isLimited && (
          <View style={styles.infoBox}>
            <Ionicons name="information-circle" size={18} color="#3B82F6" />
            <Text style={styles.infoText}>
              {isSimulator
                ? t('notifications.simulatorInfo')
                : 'Expo Go : les notifications locales (programmées, immédiates, badge) fonctionnent. Les push tokens distants nécessitent un Development Build.'}
            </Text>
          </View>
        )}
        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  gradientHeader: {
    paddingHorizontal: 20, paddingTop: 16, paddingBottom: 20,
    borderBottomLeftRadius: 24, borderBottomRightRadius: 24,
  },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  backBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#fff' },
  content: { flex: 1, padding: 16 },
  card: { borderRadius: 16, padding: 16, marginBottom: 16, gap: 10 },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  statusText: { fontSize: 14, fontWeight: '500' },
  tokenRow: {
    flexDirection: 'row', alignItems: 'center',
    gap: 8, paddingTop: 10, borderTopWidth: 1,
  },
  tokenLabel: { fontSize: 12 },
  tokenValue: {
    flex: 1, fontSize: 11,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  badgeRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    paddingTop: 10, borderTopWidth: 1,
  },
  badgeLabel: { fontSize: 13, fontWeight: '600' },
  scheduledLabel: { fontSize: 13 },
  section: { marginBottom: 20 },
  sectionTitle: { fontSize: 17, fontWeight: '700', marginBottom: 12 },
  actionBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, borderRadius: 12,
    paddingVertical: 13, paddingHorizontal: 16, marginBottom: 10,
  },
  actionBtnDisabled: { opacity: 0.6 },
  actionBtnHalf: { flex: 1, paddingVertical: 10 },
  actionBtnText: { color: '#fff', fontSize: 15, fontWeight: '600' },
  actionBtnTextSm: { color: '#fff', fontSize: 13, fontWeight: '600' },
  badgeBtnRow: { flexDirection: 'row', gap: 10 },
  resultsHeader: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 10,
  },
  clearBtn: { fontSize: 13, fontWeight: '600' },
  resultsBox: { borderRadius: 12, padding: 14, minHeight: 80 },
  resultLine: {
    fontSize: 12,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    paddingVertical: 5, borderBottomWidth: 1,
  },
  emptyResults: { fontSize: 14, textAlign: 'center', padding: 16 },
  infoBox: {
    flexDirection: 'row', gap: 10,
    backgroundColor: '#DBEAFE', borderRadius: 12,
    padding: 14, marginBottom: 16,
  },
  infoText: { flex: 1, fontSize: 13, color: '#1E40AF', lineHeight: 18 },
});
