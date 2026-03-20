import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated, Linking, RefreshControl,
  ScrollView, StyleSheet, Text,
  TouchableOpacity, View,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, CheckCircle, Clock, MapPin, Phone, Star } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';

import { Loader } from '@/components/ui/loader';
import { orderAPI } from '@/services/api';
import { useTheme } from '@/contexts/theme-context';
import { useToast } from '@/components/toast-provider';
import { COLORS } from '@/constants/theme';

const POLL_INTERVAL = 10_000; // 10 secondes
// Note: j'aurais voulu intégrer react-native-maps pour afficher la carte
// mais ça nécessite un prebuild Expo donc j'ai gardé la timeline à la place

const STATUS_STEPS = [
  { key: 'pending',    label: 'Commande reçue',          icon: '📋' },
  { key: 'confirmed',  label: 'Confirmée',                icon: '✅' },
  { key: 'preparing',  label: 'En préparation',           icon: '👨‍🍳' },
  { key: 'ready',      label: 'Prête',                    icon: '🎁' },
  { key: 'picked_up',  label: 'Récupérée',                icon: '🏍️' },
  { key: 'delivering', label: 'En livraison',             icon: '🛵' },
  { key: 'delivered',  label: 'Livrée',                   icon: '🎉' },
];

function getStepIndex(status: string) {
  const i = STATUS_STEPS.findIndex((s) => s.key === status);
  return i === -1 ? 0 : i;
}

export default function TrackingScreen() {
  const { orderId } = useLocalSearchParams<{ orderId: string }>();
  const { colors } = useTheme();
  const toast = useToast();

  const [trackingData, setTrackingData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  // Flag pour n'afficher l'erreur qu'une seule fois (évite le spam de toasts)
  const errorShownRef = useRef(false);
  // Flag pour stopper le polling si la commande est terminée
  const stopPollingRef = useRef(false);

  // Animation de progression
  const progressAnim = useRef(new Animated.Value(0)).current;

  const loadTracking = useCallback(async () => {
    // Ne pas recharger si le polling est arrêté (commande livrée ou annulée)
    if (stopPollingRef.current) return;
    try {
      const data = await orderAPI.trackOrder(orderId);
      setTrackingData(data);
      errorShownRef.current = false; // reset si ça remarche

      // Arrêter le polling si la commande est terminée
      if (data.status === 'delivered' || data.status === 'cancelled') {
        stopPollingRef.current = true;
      }

      // Animer la barre de progression
      const stepIndex = getStepIndex(data.status);
      const progress = STATUS_STEPS.length > 1
        ? stepIndex / (STATUS_STEPS.length - 1)
        : 0;
      Animated.timing(progressAnim, {
        toValue: progress,
        duration: 600,
        useNativeDriver: false,
      }).start();
    } catch {
      // Afficher l'erreur UNE SEULE FOIS, pas à chaque poll
      if (!errorShownRef.current && !trackingData) {
        errorShownRef.current = true;
        toast.error('Impossible de charger le suivi');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [orderId]);

  useEffect(() => {
    loadTracking();
    const interval = setInterval(loadTracking, POLL_INTERVAL);
    return () => clearInterval(interval);
  }, [loadTracking]);

  const onRefresh = () => {
    setRefreshing(true);
    loadTracking();
  };

  const handleCallDriver = () => {
    const phone = trackingData?.driver?.phone;
    if (phone) Linking.openURL(`tel:${phone}`);
  };

  const handleCallRestaurant = () => {
    const phone = trackingData?.restaurant?.phone;
    if (phone) Linking.openURL(`tel:${phone}`);
  };

  if (loading) return <Loader message="Chargement du suivi..." />;

  if (!trackingData) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <Text style={{ color: colors.textSecondary, textAlign: 'center', padding: 40 }}>
          Commande introuvable
        </Text>
      </SafeAreaView>
    );
  }

  const currentStepIndex = getStepIndex(trackingData.status);
  const isDelivered = trackingData.status === 'delivered';
  const isCancelled = trackingData.status === 'cancelled';

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()}>
          <ArrowLeft size={24} color={colors.text} />
        </TouchableOpacity>
        <View>
          <Text style={[styles.title, { color: colors.text }]}>Suivi de commande</Text>
          {trackingData.orderNumber && (
            <Text style={[styles.orderNum, { color: colors.textSecondary }]}>
              #{trackingData.orderNumber}
            </Text>
          )}
        </View>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        contentContainerStyle={{ padding: 16, gap: 16 }}
      >
        {/* Statut principal */}
        <View style={[styles.statusCard, { backgroundColor: isCancelled ? '#FFEBEE' : isDelivered ? '#E8F5E9' : '#FFF4EF' }]}>
          <Text style={styles.statusEmoji}>
            {isCancelled ? '❌' : STATUS_STEPS[currentStepIndex]?.icon ?? '📋'}
          </Text>
          <Text style={[styles.statusLabel, { color: isCancelled ? COLORS.error : isDelivered ? COLORS.success : COLORS.primary }]}>
            {isCancelled ? 'Commande annulée' : STATUS_STEPS[currentStepIndex]?.label ?? trackingData.status}
          </Text>
          {trackingData.estimatedMinutes !== undefined && !isDelivered && !isCancelled && (
            <View style={styles.etaRow}>
              <Clock size={14} color={COLORS.primary} />
              <Text style={[styles.etaText, { color: COLORS.primary }]}>
                Environ {trackingData.estimatedMinutes} min
              </Text>
            </View>
          )}
        </View>

        {/* Barre de progression */}
        {!isCancelled && (
          <View style={styles.progressSection}>
            <View style={[styles.progressTrack, { backgroundColor: colors.backgroundSecondary }]}>
              <Animated.View
                style={[styles.progressFill, { width: progressWidth, backgroundColor: isDelivered ? COLORS.success : COLORS.primary }]}
              />
            </View>
            <View style={styles.stepsRow}>
              {STATUS_STEPS.map((step, i) => {
                const done = i <= currentStepIndex;
                return (
                  <View key={step.key} style={styles.stepItem}>
                    <View style={[
                      styles.stepDot,
                      { backgroundColor: done ? (isDelivered && i === STATUS_STEPS.length - 1 ? COLORS.success : COLORS.primary) : colors.border }
                    ]}>
                      {done && <CheckCircle size={10} color="#fff" />}
                    </View>
                    <Text style={[styles.stepLabel, { color: done ? colors.text : colors.textMuted }]} numberOfLines={2}>
                      {step.label}
                    </Text>
                  </View>
                );
              })}
            </View>
          </View>
        )}

        {/* Timeline */}
        {trackingData.timeline && trackingData.timeline.length > 0 && (
          <View style={[styles.card, { backgroundColor: colors.card }]}>
            <Text style={[styles.cardTitle, { color: colors.text }]}>Historique</Text>
            {[...trackingData.timeline].reverse().map((entry: any, i: number) => (
              <View key={i} style={styles.timelineItem}>
                <View style={[styles.timelineDot, { backgroundColor: i === 0 ? COLORS.primary : colors.border }]} />
                <View>
                  <Text style={[styles.timelineMsg, { color: colors.text }]}>{entry.message}</Text>
                  <Text style={[styles.timelineTime, { color: colors.textMuted }]}>
                    {new Date(entry.timestamp).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Livreur */}
        {trackingData.driver && (
          <View style={[styles.card, { backgroundColor: colors.card }]}>
            <Text style={[styles.cardTitle, { color: colors.text }]}>Votre livreur</Text>
            <View style={styles.driverRow}>
              <Image
                source={{ uri: trackingData.driver.photo ?? 'https://randomuser.me/api/portraits/men/32.jpg' }}
                style={styles.driverPhoto}
              />
              <View style={{ flex: 1 }}>
                <Text style={[styles.driverName, { color: colors.text }]}>{trackingData.driver.name}</Text>
                {trackingData.driver.vehicle && (
                  <Text style={[styles.driverVehicle, { color: colors.textSecondary }]}>
                    🏍️ {trackingData.driver.vehicle}
                  </Text>
                )}
                {trackingData.driver.rating && (
                  <View style={styles.driverRating}>
                    <Star size={12} color="#FFC107" fill="#FFC107" />
                    <Text style={[styles.driverRatingText, { color: colors.textSecondary }]}>
                      {trackingData.driver.rating}
                    </Text>
                  </View>
                )}
              </View>
              <TouchableOpacity style={styles.callBtn} onPress={handleCallDriver}>
                <Phone size={18} color="#fff" />
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Restaurant */}
        {trackingData.restaurant && (
          <View style={[styles.card, { backgroundColor: colors.card }]}>
            <Text style={[styles.cardTitle, { color: colors.text }]}>Restaurant</Text>
            <View style={styles.driverRow}>
              {trackingData.restaurant.image && (
                <Image source={{ uri: trackingData.restaurant.image }} style={styles.restImage} />
              )}
              <View style={{ flex: 1 }}>
                <Text style={[styles.driverName, { color: colors.text }]}>{trackingData.restaurant.name}</Text>
                {trackingData.restaurant.location?.address && (
                  <View style={styles.driverRating}>
                    <MapPin size={12} color={colors.textMuted} />
                    <Text style={[styles.driverRatingText, { color: colors.textSecondary }]}>
                      {trackingData.restaurant.location.address}
                    </Text>
                  </View>
                )}
              </View>
              <TouchableOpacity style={[styles.callBtn, { backgroundColor: colors.backgroundSecondary }]} onPress={handleCallRestaurant}>
                <Phone size={18} color={COLORS.primary} />
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Adresse livraison */}
        {trackingData.deliveryAddress && (
          <View style={[styles.card, { backgroundColor: colors.card }]}>
            <Text style={[styles.cardTitle, { color: colors.text }]}>Adresse de livraison</Text>
            <View style={styles.driverRating}>
              <MapPin size={16} color={COLORS.primary} />
              <Text style={[styles.driverVehicle, { color: colors.textSecondary }]}>
                {typeof trackingData.deliveryAddress === 'string'
                  ? trackingData.deliveryAddress
                  : `${trackingData.deliveryAddress.street}, ${trackingData.deliveryAddress.city}`}
              </Text>
            </View>
          </View>
        )}

        {/* Action review si livré */}
        {isDelivered && (
          <TouchableOpacity
            style={[styles.reviewBtn, { backgroundColor: COLORS.secondary }]}
            onPress={() => router.push(`/review/${orderId}`)}
          >
            <Star size={20} color="#fff" />
            <Text style={styles.reviewBtnText}>Laisser un avis</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16, borderBottomWidth: 1,
  },
  title: { fontSize: 20, fontWeight: 'bold' },
  orderNum: { fontSize: 13 },
  statusCard: {
    borderRadius: 16, padding: 20,
    alignItems: 'center', gap: 8,
  },
  statusEmoji: { fontSize: 48 },
  statusLabel: { fontSize: 20, fontWeight: '700' },
  etaRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  etaText: { fontSize: 14, fontWeight: '600' },
  progressSection: { gap: 12 },
  progressTrack: { height: 6, borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 3 },
  stepsRow: { flexDirection: 'row', justifyContent: 'space-between' },
  stepItem: { flex: 1, alignItems: 'center', gap: 4 },
  stepDot: {
    width: 20, height: 20, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
  },
  stepLabel: { fontSize: 9, textAlign: 'center', lineHeight: 12 },
  card: { borderRadius: 16, padding: 16 },
  cardTitle: { fontSize: 15, fontWeight: '700', marginBottom: 12 },
  timelineItem: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 12 },
  timelineDot: { width: 10, height: 10, borderRadius: 5, marginTop: 4 },
  timelineMsg: { fontSize: 14, fontWeight: '500' },
  timelineTime: { fontSize: 12, marginTop: 2 },
  driverRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  driverPhoto: { width: 52, height: 52, borderRadius: 26 },
  restImage: { width: 52, height: 52, borderRadius: 10 },
  driverName: { fontSize: 15, fontWeight: '700' },
  driverVehicle: { fontSize: 13, marginTop: 2 },
  driverRating: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  driverRatingText: { fontSize: 13 },
  callBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: COLORS.primary,
    alignItems: 'center', justifyContent: 'center',
  },
  reviewBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 10, borderRadius: 16, padding: 16,
  },
  reviewBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
