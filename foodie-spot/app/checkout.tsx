import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator, Alert, KeyboardAvoidingView,
  Platform, ScrollView, StyleSheet, Text,
  TextInput, TouchableOpacity, View,
} from 'react-native';
import { router } from 'expo-router';
import { ArrowLeft, CheckCircle, CreditCard, MapPin, Tag, Truck } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppButton } from '@/components/ui/app-button';
import { Loader } from '@/components/ui/loader';
import { orderAPI, promoAPI, userAPI, restaurantAPI } from '@/services/api';
import { useCart } from '@/contexts/cart-context';
import { useAuth } from '@/contexts/auth-context';
import { useTheme } from '@/contexts/theme-context';
import { useI18n } from '@/contexts/i18n-context';
import { useToast } from '@/components/toast-provider';
import { Address, DeliveryEstimate, PromoResult } from '@/types';
import { COLORS } from '@/constants/theme';

const PAYMENT_METHODS = [
  { id: 'card',   labelKey: 'checkout.card',   icon: '💳' },
  { id: 'cash',   labelKey: 'checkout.cash',   icon: '💵' },
  { id: 'paypal', labelKey: 'checkout.paypal', icon: '🅿️' },
];

export default function CheckoutScreen() {
  const { colors } = useTheme();
  const { t } = useI18n();
  const toast = useToast();
  const { user } = useAuth();
  const { items, restaurantId, restaurantName, subtotal, clearCart } = useCart();

  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddress, setSelectedAddress] = useState<Address | null>(null);
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [promoCode, setPromoCode] = useState('');
  const [promo, setPromo] = useState<PromoResult | null>(null);
  const [promoLoading, setPromoLoading] = useState(false);
  const [promoError, setPromoError] = useState('');
  const [placing, setPlacing] = useState(false);
  const [success, setSuccess] = useState(false);
  const [orderId, setOrderId] = useState<string | null>(null);
  // Frais depuis l'API — plus de valeurs hardcodées
  const [estimate, setEstimate] = useState<DeliveryEstimate | null>(null);
  const [estimateLoading, setEstimateLoading] = useState(true);

  const serviceFee = estimate?.serviceFee ?? 0.99;
  const freeThreshold = estimate?.freeDeliveryThreshold ?? 25;
  const baseDeliveryFee = estimate?.deliveryFee ?? 2.99;
  const deliveryFee = promo?.type === 'delivery' ? 0 : (subtotal >= freeThreshold ? 0 : baseDeliveryFee);
  const discount = promo && promo.type !== 'delivery' && typeof promo.discount === 'number' ? promo.discount : 0;
  const total = Math.max(0, subtotal + deliveryFee + serviceFee - discount);

  useEffect(() => {
    loadAddresses();
    loadEstimate();
  }, []);

  const loadAddresses = async () => {
    try {
      const addrs = await userAPI.getAddresses();
      setAddresses(addrs);
      setSelectedAddress(addrs.find((a) => a.isDefault) ?? addrs[0] ?? null);
    } catch { /* pas bloquant */ }
  };

  const loadEstimate = async () => {
    if (!restaurantId) return;
    try {
      const est = await restaurantAPI.getDeliveryEstimate(restaurantId);
      setEstimate(est);
    } finally {
      setEstimateLoading(false);
    }
  };

  const handleValidatePromo = async () => {
    if (!promoCode.trim()) return;
    setPromoLoading(true);
    setPromoError('');
    setPromo(null);
    try {
      const result = await promoAPI.validate(promoCode.trim(), subtotal);
      setPromo(result);
      toast.success(`✅ ${result.message}`);
    } catch (err: any) {
      setPromoError(err?.response?.data?.message ?? 'Code promo invalide');
    } finally {
      setPromoLoading(false);
    }
  };

  const handlePlaceOrder = async () => {
    if (!selectedAddress) { toast.error(t('checkout.selectAddress')); return; }
    if (!restaurantId || items.length === 0) { toast.error(t('checkout.emptyCart')); return; }
    setPlacing(true);
    try {
      const order = await orderAPI.createOrder({
        restaurantId,
        items: items.map((i) => ({ menuItemId: i.dish.id, quantity: i.quantity })),
        deliveryAddress: selectedAddress,
        paymentMethod,
        promoCode: promo?.code,
      });
      setOrderId(order.id);
      setSuccess(true);
      clearCart();
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? t('common.error'));
    } finally {
      setPlacing(false);
    }
  };

  if (success && orderId) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.successBox}>
          <CheckCircle size={80} color={COLORS.success} />
          <Text style={[styles.successTitle, { color: colors.text }]}>{t('checkout.successTitle')}</Text>
          <Text style={[styles.successSub, { color: colors.textSecondary }]}>
            {t('checkout.successSubtitle', { restaurant: restaurantName ?? '' })}
          </Text>
          <AppButton label={t('checkout.trackOrder')} onPress={() => router.replace(`/tracking/${orderId}`)} style={{ marginTop: 24, width: '100%' }} />
          <AppButton label={t('checkout.backHome')} variant="outline" onPress={() => router.replace('/(tabs)')} style={{ marginTop: 12, width: '100%' }} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={() => router.back()} accessibilityLabel={t('common.back')}>
            <ArrowLeft size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: colors.text }]}>{t('checkout.title')}</Text>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          {/* Adresse */}
          <SectionCard title={t('checkout.deliveryAddress')} icon={<MapPin size={18} color={COLORS.primary} />} colors={colors}>
            {addresses.length === 0 ? (
              <TouchableOpacity
                style={[styles.addAddressBtn, { borderColor: COLORS.primary }]}
                onPress={() => router.push('/addresses')}
              >
                <Text style={{ color: COLORS.primary, fontWeight: '600' }}>{t('checkout.addAddress')}</Text>
              </TouchableOpacity>
            ) : (
              addresses.map((addr) => (
                <TouchableOpacity
                  key={addr.id}
                  style={[styles.addressRow, { borderColor: selectedAddress?.id === addr.id ? COLORS.primary : colors.border }, selectedAddress?.id === addr.id && styles.addressSelected]}
                  onPress={() => setSelectedAddress(addr)}
                  accessibilityState={{ selected: selectedAddress?.id === addr.id }}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.addressLabel, { color: colors.text }]}>{addr.label}</Text>
                    <Text style={[styles.addressText, { color: colors.textSecondary }]}>{addr.street}, {addr.city}</Text>
                  </View>
                  {selectedAddress?.id === addr.id && <CheckCircle size={20} color={COLORS.primary} />}
                </TouchableOpacity>
              ))
            )}
          </SectionCard>

          {/* Paiement */}
          <SectionCard title={t('checkout.payment')} icon={<CreditCard size={18} color={COLORS.primary} />} colors={colors}>
            {PAYMENT_METHODS.map((pm) => (
              <TouchableOpacity
                key={pm.id}
                style={[styles.paymentRow, { borderColor: paymentMethod === pm.id ? COLORS.primary : colors.border }, paymentMethod === pm.id && styles.paymentSelected]}
                onPress={() => setPaymentMethod(pm.id)}
                accessibilityState={{ selected: paymentMethod === pm.id }}
              >
                <Text style={styles.paymentIcon}>{pm.icon}</Text>
                <Text style={[styles.paymentLabel, { color: colors.text }]}>{t(pm.labelKey)}</Text>
                {paymentMethod === pm.id && <CheckCircle size={18} color={COLORS.primary} />}
              </TouchableOpacity>
            ))}
          </SectionCard>

          {/* Code promo */}
          <SectionCard title={t('checkout.promoCode')} icon={<Tag size={18} color={COLORS.primary} />} colors={colors}>
            <View style={styles.promoRow}>
              <TextInput
                style={[styles.promoInput, { backgroundColor: colors.backgroundSecondary, color: colors.text, borderColor: promoError ? COLORS.error : promo ? COLORS.success : colors.border }]}
                placeholder={t('checkout.promoPlaceholder')}
                placeholderTextColor={colors.textMuted}
                value={promoCode}
                onChangeText={(v) => { setPromoCode(v.toUpperCase()); setPromoError(''); setPromo(null); }}
                autoCapitalize="characters"
                editable={!promo}
              />
              <TouchableOpacity
                style={[styles.promoBtn, { backgroundColor: promo ? COLORS.success : COLORS.primary }]}
                onPress={promo ? () => { setPromo(null); setPromoCode(''); } : handleValidatePromo}
                disabled={promoLoading}
                accessibilityLabel={promo ? t('common.cancel') : t('checkout.applyPromo')}
              >
                {promoLoading
                  ? <ActivityIndicator color="#fff" size="small" />
                  : <Text style={styles.promoBtnText}>{promo ? '✕' : t('checkout.applyPromo')}</Text>}
              </TouchableOpacity>
            </View>
            {promoError ? <Text style={styles.promoError}>{promoError}</Text> : null}
            {promo && (
              <View style={styles.promoSuccessRow}>
                <CheckCircle size={14} color={COLORS.success} />
                <Text style={styles.promoSuccessText}>{promo.message} — {promo.description}</Text>
              </View>
            )}
            <Text style={[styles.promoHint, { color: colors.textMuted }]}>{t('checkout.promoCodes')}</Text>
          </SectionCard>

          {/* Récapitulatif — frais depuis l'API */}
          <SectionCard title={t('checkout.summary')} icon={<Truck size={18} color={COLORS.primary} />} colors={colors}>
            {items.map((item) => (
              <View key={item.dish.id} style={styles.orderItemRow}>
                <Text style={[styles.orderItemQty, { color: COLORS.primary }]}>{item.quantity}×</Text>
                <Text style={[styles.orderItemName, { color: colors.text }]} numberOfLines={1}>{item.dish.name}</Text>
                <Text style={[styles.orderItemPrice, { color: colors.text }]}>{(item.dish.price * item.quantity).toFixed(2)} €</Text>
              </View>
            ))}
            <View style={[styles.separator, { backgroundColor: colors.border }]} />
            <LineItem label={t('cart.subtotal')} value={`${subtotal.toFixed(2)} €`} colors={colors} />
            {estimateLoading ? (
              <LineItem label={t('cart.delivery')} value="..." colors={colors} />
            ) : (
              <LineItem label={t('cart.delivery')} value={deliveryFee === 0 ? `${t('cart.freeDelivery')}` : `${deliveryFee.toFixed(2)} €`} valueColor={deliveryFee === 0 ? COLORS.success : undefined} colors={colors} />
            )}
            <LineItem label={t('cart.serviceFee')} value={`${serviceFee.toFixed(2)} €`} colors={colors} />
            {discount > 0 && <LineItem label={t('checkout.discount')} value={`-${discount.toFixed(2)} €`} valueColor={COLORS.success} colors={colors} />}
            <View style={[styles.separator, { backgroundColor: colors.border }]} />
            <View style={styles.totalRow}>
              <Text style={[styles.totalLabel, { color: colors.text }]}>{t('cart.total')}</Text>
              <Text style={styles.totalValue}>{total.toFixed(2)} €</Text>
            </View>
          </SectionCard>
        </ScrollView>

        <View style={[styles.footer, { backgroundColor: colors.background, borderTopColor: colors.border }]}>
          <AppButton
            label={t('checkout.placeOrder', { total: total.toFixed(2) })}
            onPress={handlePlaceOrder}
            loading={placing}
            disabled={placing || items.length === 0}
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function SectionCard({ title, icon, children, colors }: any) {
  return (
    <View style={[sStyles.card, { backgroundColor: colors.card }]}>
      <View style={sStyles.header}>{icon}<Text style={[sStyles.title, { color: colors.text }]}>{title}</Text></View>
      {children}
    </View>
  );
}

function LineItem({ label, value, valueColor, colors }: any) {
  return (
    <View style={sStyles.lineRow}>
      <Text style={[sStyles.lineLabel, { color: colors.textSecondary }]}>{label}</Text>
      <Text style={[sStyles.lineValue, { color: valueColor ?? colors.text }]}>{value}</Text>
    </View>
  );
}

const sStyles = StyleSheet.create({
  card: { borderRadius: 16, padding: 16, gap: 10 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  title: { fontSize: 16, fontWeight: '700' },
  lineRow: { flexDirection: 'row', justifyContent: 'space-between' },
  lineLabel: { fontSize: 14 },
  lineValue: { fontSize: 14, fontWeight: '600' },
});

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderBottomWidth: 1 },
  title: { fontSize: 20, fontWeight: 'bold' },
  scrollContent: { padding: 16, gap: 16 },
  addAddressBtn: { borderWidth: 1.5, borderStyle: 'dashed', borderRadius: 12, padding: 14, alignItems: 'center' },
  addressRow: { flexDirection: 'row', alignItems: 'center', borderWidth: 1.5, borderRadius: 12, padding: 12 },
  addressSelected: { backgroundColor: '#FFF4EF' },
  addressLabel: { fontSize: 14, fontWeight: '600', marginBottom: 2 },
  addressText: { fontSize: 13 },
  paymentRow: { flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1.5, borderRadius: 12, padding: 12 },
  paymentSelected: { backgroundColor: '#FFF4EF' },
  paymentIcon: { fontSize: 22 },
  paymentLabel: { flex: 1, fontSize: 15 },
  promoRow: { flexDirection: 'row', gap: 10 },
  promoInput: { flex: 1, borderRadius: 12, borderWidth: 1.5, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, fontWeight: '700', letterSpacing: 1 },
  promoBtn: { paddingHorizontal: 16, paddingVertical: 12, borderRadius: 12, alignItems: 'center', justifyContent: 'center', minWidth: 90 },
  promoBtnText: { color: '#fff', fontWeight: '700' },
  promoError: { color: COLORS.error, fontSize: 13 },
  promoSuccessRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  promoSuccessText: { color: COLORS.success, fontSize: 13, fontWeight: '600' },
  promoHint: { fontSize: 11, fontStyle: 'italic' },
  orderItemRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  orderItemQty: { fontWeight: '700', width: 28 },
  orderItemName: { flex: 1, fontSize: 14 },
  orderItemPrice: { fontSize: 14, fontWeight: '600' },
  separator: { height: 1, marginVertical: 6 },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  totalLabel: { fontSize: 17, fontWeight: '700' },
  totalValue: { fontSize: 20, fontWeight: '800', color: COLORS.primary },
  footer: { padding: 16, paddingBottom: 20, borderTopWidth: 1 },
  successBox: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 12 },
  successTitle: { fontSize: 26, fontWeight: 'bold', marginTop: 12 },
  successSub: { fontSize: 15, textAlign: 'center', lineHeight: 22 },
});
