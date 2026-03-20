// app/(tabs)/notifications.tsx
import { Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useRouter } from 'expo-router';
import { useState } from 'react';
import * as Device from 'expo-device';
import { useNotifications } from '@/hooks/use-notifications';
import Ionicons from "@expo/vector-icons/Ionicons";
import { SafeAreaView } from 'react-native-safe-area-context';

export default function NotificationScreen() {
  const router = useRouter();
  const [testResults, setTestResults] = useState<string[]>([]);
  const isSimulator = !Device.isDevice;

  const {
    isLoading,
    hasPermission,
    initialize,
    send,
    schedule,
    badgeCount,
    setBadgeCount,
    clearBadge,
  } = useNotifications();

  const addTestResult = (message: string) => {
    setTestResults((prev) => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const handleInitialize = async () => {
    addTestResult('🔄 Initialisation...');
    const token = await initialize();
    addTestResult(token ? `✅ Token obtenu` : `❌ Echec — development build requis`);
  };

  const handleSendImmediate = async () => {
    try {
      await send('Test', 'Notification de test immédiate !');
      addTestResult(`✅ Notification envoyée`);
    } catch (error) {
      addTestResult(`❌ Erreur: ${error}`);
    }
  };

  const handleSchedule5s = async () => {
    const date = new Date();
    date.setSeconds(date.getSeconds() + 5);
    try {
      await schedule('Notification', 'Dans 5 secondes', date);
      addTestResult(`✅ Programmée pour ${date.toLocaleTimeString()}`);
    } catch (error) {
      addTestResult(`❌ Erreur: ${error}`);
    }
  };

  const handleSchedule30s = async () => {
    const date = new Date();
    date.setSeconds(date.getSeconds() + 30);
    try {
      await schedule('Rappel', 'Dans 30 secondes', date);
      addTestResult(`✅ Programmée pour ${date.toLocaleTimeString()}`);
    } catch (error) {
      addTestResult(`❌ Erreur: ${error}`);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Notifications</Text>
          <View style={styles.placeholder} />
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>

        <View style={styles.infoBox}>
          <Ionicons name="information-circle" size={20} color="#3b82f6" />
          <Text style={styles.infoText}>
            Les push notifications nécessitent un development build. Expo Go SDK 53 ne supporte plus expo-notifications pour Android.
          </Text>
        </View>

        <View style={styles.statusCard}>
          <View style={styles.statusRow}>
            <Ionicons name={isSimulator ? "phone-portrait-outline" : "phone-portrait"} size={20} color={isSimulator ? "#f59e0b" : "#10b981"} />
            <Text style={styles.statusText}>{isSimulator ? 'Simulateur' : 'Appareil physique'}</Text>
          </View>
          <View style={styles.statusRow}>
            <Ionicons name={hasPermission ? "checkmark-circle" : "close-circle"} size={20} color={hasPermission ? "#10b981" : "#ef4444"} />
            <Text style={styles.statusText}>Permissions: {hasPermission ? 'Accordées' : 'Non accordées'}</Text>
          </View>
          <Text style={styles.badgeLabel}>Badge count: {badgeCount}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Actions</Text>

          <TouchableOpacity onPress={handleInitialize} disabled={isLoading} style={[styles.button, styles.buttonPrimary]}>
            <Ionicons name="notifications-outline" size={20} color="#fff" />
            <Text style={styles.buttonText}>Initialiser</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={handleSendImmediate} style={[styles.button, styles.buttonSuccess]}>
            <Ionicons name="send-outline" size={20} color="#fff" />
            <Text style={styles.buttonText}>Notification immédiate</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={handleSchedule5s} style={[styles.button, styles.buttonInfo]}>
            <Ionicons name="time-outline" size={20} color="#fff" />
            <Text style={styles.buttonText}>Programmer (5 sec)</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={handleSchedule30s} style={[styles.button, styles.buttonInfo]}>
            <Ionicons name="calendar-outline" size={20} color="#fff" />
            <Text style={styles.buttonText}>Programmer (30 sec)</Text>
          </TouchableOpacity>

          <View style={styles.buttonRow}>
            <TouchableOpacity onPress={() => setBadgeCount(5)} style={[styles.button, styles.buttonSmall, styles.buttonWarning]}>
              <Text style={styles.buttonTextSmall}>Badge: 5</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => clearBadge()} style={[styles.button, styles.buttonSmall, styles.buttonDanger]}>
              <Text style={styles.buttonTextSmall}>Effacer badge</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Résultats</Text>
            {testResults.length > 0 && (
              <TouchableOpacity onPress={() => setTestResults([])}>
                <Text style={styles.clearButton}>Effacer</Text>
              </TouchableOpacity>
            )}
          </View>
          {testResults.length === 0 ? (
            <View style={styles.emptyResults}>
              <Ionicons name="document-text-outline" size={48} color="#9ca3af" />
              <Text style={styles.emptyText}>Aucun résultat</Text>
            </View>
          ) : (
            <View style={styles.resultsContainer}>
              {testResults.map((result, index) => (
                <View key={index} style={styles.resultItem}>
                  <Text style={styles.resultText}>{result}</Text>
                </View>
              ))}
            </View>
          )}
        </View>

        <View style={{ height: 24 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  header: { backgroundColor: '#a855f7', paddingHorizontal: 24, paddingTop: 16, paddingBottom: 24, borderBottomLeftRadius: 32, borderBottomRightRadius: 32 },
  headerTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  backButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#fff' },
  placeholder: { width: 40 },
  content: { flex: 1, padding: 24 },
  infoBox: { flexDirection: 'row', backgroundColor: '#dbeafe', borderRadius: 12, padding: 16, gap: 12, marginBottom: 16 },
  infoText: { flex: 1, fontSize: 14, color: '#1e40af', lineHeight: 20 },
  statusCard: { backgroundColor: '#fff', borderRadius: 16, padding: 20, marginBottom: 24, elevation: 2 },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  statusText: { fontSize: 14, color: '#111827', fontWeight: '500' },
  badgeLabel: { fontSize: 14, color: '#111827', fontWeight: '500' },
  section: { marginBottom: 24 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  sectionTitle: { fontSize: 20, fontWeight: 'bold', color: '#111827', marginBottom: 16 },
  button: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 14, paddingHorizontal: 20, borderRadius: 12, marginBottom: 12, gap: 8 },
  buttonPrimary: { backgroundColor: '#a855f7' },
  buttonSuccess: { backgroundColor: '#10b981' },
  buttonInfo: { backgroundColor: '#3b82f6' },
  buttonWarning: { backgroundColor: '#f59e0b' },
  buttonDanger: { backgroundColor: '#ef4444' },
  buttonSmall: { flex: 1, paddingVertical: 10, paddingHorizontal: 16 },
  buttonRow: { flexDirection: 'row', gap: 12 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  buttonTextSmall: { color: '#fff', fontSize: 14, fontWeight: '600' },
  resultsContainer: { backgroundColor: '#fff', borderRadius: 12, padding: 16, maxHeight: 300 },
  resultItem: { paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  resultText: { fontSize: 12, color: '#111827', fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' },
  emptyResults: { backgroundColor: '#fff', borderRadius: 12, padding: 32, alignItems: 'center' },
  emptyText: { fontSize: 16, color: '#6b7280', marginTop: 12, fontWeight: '500' },
  clearButton: { color: '#a855f7', fontSize: 14, fontWeight: '600' },
});