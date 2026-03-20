import React, { memo } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Check, CheckCircle, ChefHat, Clock, Navigation, Package, X } from 'lucide-react-native';
import { Order, OrderStatus } from '@/types';
import { useTheme } from '@/contexts/theme-context';
import { COLORS } from '@/constants/theme';

interface Props {
  order: Order;
  onPress?: () => void;
}

const STATUS_CONFIG: Record<string, { color: string; icon: React.ReactNode; label: string }> = {
  pending:      { color: '#9CA3AF', icon: <Clock size={13} color="#fff" />,         label: 'En attente' },
  confirmed:    { color: '#2196F3', icon: <CheckCircle size={13} color="#fff" />,   label: 'Confirmée' },
  preparing:    { color: '#F59E0B', icon: <ChefHat size={13} color="#fff" />,       label: 'Préparation' },
  ready:        { color: '#8B5CF6', icon: <Package size={13} color="#fff" />,       label: 'Prête' },
  picked_up:    { color: '#6366F1', icon: <Navigation size={13} color="#fff" />,    label: 'Récupérée' },
  delivering:   { color: '#8B5CF6', icon: <Navigation size={13} color="#fff" />,    label: 'En livraison' },
  'on-the-way': { color: '#8B5CF6', icon: <Navigation size={13} color="#fff" />,    label: 'En route' },
  delivered:    { color: '#4CAF50', icon: <Check size={13} color="#fff" />,         label: 'Livrée' },
  cancelled:    { color: '#F44336', icon: <X size={13} color="#fff" />,             label: 'Annulée' },
};

const OrderCardBase: React.FC<Props> = ({ order, onPress }) => {
  const { colors } = useTheme();
  const config = STATUS_CONFIG[order.status] ?? STATUS_CONFIG.pending;

  const formatDate = (d: Date | string) =>
    new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });

  const itemsDisplay = order.items
    .map((i) => `${i.quantity}× ${i.dish?.name ?? 'Plat'}`)
    .join(', ');

  return (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: colors.card }]}
      onPress={onPress}
      disabled={!onPress}
      activeOpacity={0.85}
      accessibilityLabel={`Commande ${order.restaurantName}, statut ${config.label}`}
      accessibilityRole="button"
    >
      <View style={styles.header}>
        <View>
          <Text style={[styles.restaurant, { color: colors.text }]} numberOfLines={1}>
            {order.restaurantName}
          </Text>
          {order.orderNumber && (
            <Text style={[styles.orderNum, { color: colors.textMuted }]}>#{order.orderNumber}</Text>
          )}
        </View>
        <View style={[styles.statusBadge, { backgroundColor: config.color }]}>
          {config.icon}
          <Text style={styles.statusText}>{config.label}</Text>
        </View>
      </View>

      <Text style={[styles.items, { color: colors.textSecondary }]} numberOfLines={1}>
        {itemsDisplay}
      </Text>

      <View style={styles.footer}>
        <Text style={styles.total}>{order.total?.toFixed(2)} €</Text>
        <Text style={[styles.date, { color: colors.textMuted }]}>{formatDate(order.createdAt)}</Text>
      </View>

      {onPress && ['preparing', 'confirmed', 'ready', 'picked_up', 'delivering', 'on-the-way'].includes(order.status) && (
        <View style={[styles.trackHint, { backgroundColor: COLORS.primaryLight }]}>
          <Navigation size={12} color={COLORS.primary} />
          <Text style={[styles.trackHintText, { color: COLORS.primary }]}>Suivre la livraison</Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

export const OrderCard = memo(OrderCardBase);

const styles = StyleSheet.create({
  card: {
    borderRadius: 16, padding: 14, marginBottom: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 6, elevation: 2,
  },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 },
  restaurant: { fontSize: 16, fontWeight: '700', maxWidth: 180 },
  orderNum: { fontSize: 11, marginTop: 2 },
  statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12 },
  statusText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  items: { fontSize: 13, marginBottom: 10 },
  footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  total: { fontSize: 16, fontWeight: '700', color: COLORS.primary },
  date: { fontSize: 12 },
  trackHint: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 10, padding: 8, borderRadius: 10 },
  trackHintText: { fontSize: 12, fontWeight: '600' },
});
