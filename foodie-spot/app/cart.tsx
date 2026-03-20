import React, { useCallback } from 'react';
import {
  Alert, FlatList, StyleSheet, Text,
  TouchableOpacity, View,
} from 'react-native';
import { router } from 'expo-router';
import { Image } from 'expo-image';
import { ArrowLeft, Minus, Plus, Trash2 } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { EmptyState } from '@/components/ui/empty-state';
import { AppButton } from '@/components/ui/app-button';
import { useCart } from '@/contexts/cart-context';
import { useTheme } from '@/contexts/theme-context';
import { useI18n } from '@/contexts/i18n-context';
import { CartItem } from '@/types';
import { COLORS } from '@/constants/theme';

// Frais récupérés depuis l'API lors du checkout — ici affichage estimatif
const SERVICE_FEE = 0.99;

export default function CartScreen() {
  const { colors } = useTheme();
  const { t } = useI18n();
  const { items, restaurantName, subtotal, itemCount, updateQuantity, clearCart } = useCart();

  const deliveryFee = subtotal >= 25 ? 0 : 2.99;
  const total = subtotal + SERVICE_FEE + deliveryFee;

  const handleClear = () => {
    Alert.alert(
      t('cart.clearCart'),
      t('cart.clearConfirm'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        { text: t('common.confirm'), style: 'destructive', onPress: clearCart },
      ]
    );
  };

  const renderItem = useCallback(
    ({ item }: { item: CartItem }) => (
      <View style={[styles.itemRow, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <Image source={{ uri: item.dish.image }} style={styles.itemImage} contentFit="cover" />
        <View style={styles.itemInfo}>
          <Text style={[styles.itemName, { color: colors.text }]} numberOfLines={1}>{item.dish.name}</Text>
          <Text style={styles.itemPrice}>{(item.dish.price * item.quantity).toFixed(2)} €</Text>
        </View>
        <View style={styles.qtyRow}>
          <TouchableOpacity
            style={styles.qtyBtn}
            onPress={() => updateQuantity(item.dish.id, item.quantity - 1)}
            accessibilityLabel="Diminuer"
          >
            {item.quantity === 1
              ? <Trash2 size={13} color={COLORS.error} />
              : <Minus size={13} color="#fff" />}
          </TouchableOpacity>
          <Text style={[styles.qtyText, { color: colors.text }]}>{item.quantity}</Text>
          <TouchableOpacity
            style={styles.qtyBtn}
            onPress={() => updateQuantity(item.dish.id, item.quantity + 1)}
            accessibilityLabel="Augmenter"
          >
            <Plus size={13} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>
    ),
    [colors, updateQuantity]
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} accessibilityLabel={t('common.back')}>
          <ArrowLeft size={24} color={colors.text} />
        </TouchableOpacity>
        <View>
          <Text style={[styles.title, { color: colors.text }]}>{t('cart.title')}</Text>
          {restaurantName && (
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>{restaurantName}</Text>
          )}
        </View>
        {items.length > 0 && (
          <TouchableOpacity onPress={handleClear} accessibilityLabel={t('cart.clearCart')}>
            <Trash2 size={20} color={COLORS.error} />
          </TouchableOpacity>
        )}
      </View>

      {items.length === 0 ? (
        <EmptyState
          icon="🛒"
          title={t('cart.empty')}
          subtitle={t('cart.emptySubtitle')}
          actionLabel={t('cart.explore')}
          onAction={() => router.replace('/(tabs)')}
        />
      ) : (
        <>
          <FlatList
            data={items}
            keyExtractor={(i) => i.dish.id}
            renderItem={renderItem}
            contentContainerStyle={styles.listContent}
          />

          {/* Récapitulatif */}
          <View style={[styles.summary, { backgroundColor: colors.card, borderTopColor: colors.border }]}>
            <View style={styles.summaryRow}>
              <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>
                {t('cart.subtotal')} ({itemCount} {itemCount > 1 ? t('cart.articlePlural') : t('cart.article')})
              </Text>
              <Text style={[styles.summaryValue, { color: colors.text }]}>{subtotal.toFixed(2)} €</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>{t('cart.delivery')}</Text>
              <Text style={[styles.summaryValue, { color: deliveryFee === 0 ? COLORS.success : colors.text }]}>
                {deliveryFee === 0 ? t('cart.freeDelivery') : `${deliveryFee.toFixed(2)} €`}
              </Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>{t('cart.serviceFee')}</Text>
              <Text style={[styles.summaryValue, { color: colors.text }]}>{SERVICE_FEE.toFixed(2)} €</Text>
            </View>
            {deliveryFee > 0 && (
              <Text style={styles.freeHint}>
                {t('cart.freeDeliveryHint', { amount: (25 - subtotal).toFixed(2) })}
              </Text>
            )}
            <View style={[styles.totalRow, { borderTopColor: colors.border }]}>
              <Text style={[styles.totalLabel, { color: colors.text }]}>{t('cart.total')}</Text>
              <Text style={styles.totalValue}>{total.toFixed(2)} €</Text>
            </View>
            <AppButton label={t('cart.checkout')} onPress={() => router.push('/checkout')} />
          </View>
        </>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderBottomWidth: 1 },
  title: { fontSize: 22, fontWeight: 'bold' },
  subtitle: { fontSize: 13, marginTop: 2 },
  listContent: { paddingBottom: 8 },
  itemRow: { flexDirection: 'row', alignItems: 'center', padding: 14, borderBottomWidth: 1, gap: 12 },
  itemImage: { width: 64, height: 64, borderRadius: 10 },
  itemInfo: { flex: 1 },
  itemName: { fontSize: 15, fontWeight: '600', marginBottom: 4 },
  itemPrice: { fontSize: 14, fontWeight: '700', color: COLORS.primary },
  qtyRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  qtyBtn: { width: 28, height: 28, borderRadius: 14, backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center' },
  qtyText: { fontSize: 15, fontWeight: '700', minWidth: 22, textAlign: 'center' },
  summary: { padding: 16, paddingTop: 12, borderTopWidth: 1, gap: 8 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between' },
  summaryLabel: { fontSize: 14 },
  summaryValue: { fontSize: 14, fontWeight: '600' },
  freeHint: { fontSize: 12, color: COLORS.primary, fontStyle: 'italic', textAlign: 'center' },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', paddingTop: 10, marginTop: 4, borderTopWidth: 1, marginBottom: 10 },
  totalLabel: { fontSize: 18, fontWeight: '700' },
  totalValue: { fontSize: 20, fontWeight: '800', color: COLORS.primary },
});
