// app/checkout.tsx
import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, TextInput, Alert, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { MapPin, CreditCard, Tag, ShoppingBag } from 'lucide-react-native';
import api from '@/services/api';
import { useCart } from '@/contexts/cart-context';
import { useTheme } from '@/contexts/theme-context';

export default function CheckoutScreen() {
  const { items, total, clearCart, itemCount } = useCart();
  const { colors } = useTheme();

  const [address, setAddress] = useState('');
  const [promoCode, setPromoCode] = useState('');
  const [promoDiscount, setPromoDiscount] = useState<number | null>(null);
  const [promoError, setPromoError] = useState('');
  const [promoLoading, setPromoLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'cash'>('card');
  const [loading, setLoading] = useState(false);

  const deliveryFee = 2.99;
  const discount = promoDiscount ? total * promoDiscount : 0;
  const finalTotal = total + deliveryFee - discount;

  // Rediriger vers le panier si vide
  if (items.length === 0) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
        <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.borderLight }]}>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={[styles.backText, { color: colors.primary }]}>← Retour</Text>
          </TouchableOpacity>
          <Text style={[styles.title, { color: colors.text }]}>Validation</Text>
        </View>
        <View style={styles.centered}>
          <ShoppingBag size={64} color={colors.border} />
          <Text style={[styles.emptyText, { color: colors.text }]}>Panier vide</Text>
          <Text style={[styles.emptySubText, { color: colors.textTertiary }]}>
            Ajoutez des plats avant de commander
          </Text>
          <TouchableOpacity
            style={[styles.goBackButton, { backgroundColor: colors.primary }]}
            onPress={() => router.push('/(tabs)')}
          >
            <Text style={styles.goBackText}>Retour à l'accueil</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const validatePromo = async () => {
    if (!promoCode.trim()) return;
    setPromoLoading(true);
    setPromoError('');
    try {
      const response = await api.post('/promos/validate', {
        code: promoCode.trim().toUpperCase(),
        orderAmount: total,
      });
      const data = response.data?.data || response.data;
      const discountRate = data.discount ?? 0.1;
      setPromoDiscount(discountRate);
      Alert.alert(
        '✅ Code valide !',
        `Réduction de ${(discountRate * 100).toFixed(0)}% appliquée — vous économisez ${(total * discountRate).toFixed(2)} €`
      );
    } catch (error: any) {
      const msg = error?.response?.data?.message || 'Code invalide ou expiré';
      setPromoError(msg);
      setPromoDiscount(null);
    } finally {
      setPromoLoading(false);
    }
  };

  const handleOrder = async () => {
    if (!address.trim()) {
      Alert.alert('Adresse requise', 'Veuillez entrer une adresse de livraison');
      return;
    }
    setLoading(true);
    try {
      await api.post('/orders', {
        items: items.map(i => ({ dishId: i.dishId, quantity: i.quantity })),
        restaurantId: items[0].restaurantId,
        address: address.trim(),
        paymentMethod,
        promoCode: promoDiscount ? promoCode : undefined,
        total: finalTotal,
      });
      clearCart();
      Alert.alert('Commande confirmée ! 🎉', 'Votre commande a été passée avec succès', [
        { text: 'Suivre ma commande', onPress: () => router.push('/(tabs)/orders') },
      ]);
    } catch {
      Alert.alert('Erreur', 'Impossible de passer la commande. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.borderLight }]}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={[styles.backText, { color: colors.primary }]}>← Retour</Text>
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>Validation</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>

        {/* Récap articles */}
        <View style={[styles.section, { backgroundColor: colors.surface }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            {itemCount} article{itemCount > 1 ? 's' : ''} — {items[0]?.restaurantName}
          </Text>
          {items.map(item => (
            <View key={item.dishId} style={styles.recapRow}>
              <Text style={[styles.recapName, { color: colors.textSecondary }]}>
                {item.quantity}× {item.name}
              </Text>
              <Text style={[styles.recapPrice, { color: colors.text }]}>
                {(item.price * item.quantity).toFixed(2)} €
              </Text>
            </View>
          ))}
        </View>

        {/* Adresse livraison */}
        <View style={[styles.section, { backgroundColor: colors.surface }]}>
          <View style={styles.sectionHeader}>
            <MapPin size={20} color={colors.primary} />
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Adresse de livraison</Text>
          </View>
          <TextInput
            style={[styles.input, {
              backgroundColor: colors.inputBackground,
              borderColor: colors.border,
              color: colors.text,
            }]}
            placeholder="Ex: 15 rue de la Paix, Paris"
            placeholderTextColor={colors.placeholder}
            value={address}
            onChangeText={setAddress}
            multiline
          />
        </View>

        {/* Mode de paiement */}
        <View style={[styles.section, { backgroundColor: colors.surface }]}>
          <View style={styles.sectionHeader}>
            <CreditCard size={20} color={colors.primary} />
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Mode de paiement</Text>
          </View>
          <View style={styles.paymentOptions}>
            {(['card', 'cash'] as const).map(method => (
              <TouchableOpacity
                key={method}
                style={[
                  styles.paymentOption,
                  { borderColor: colors.border },
                  paymentMethod === method && {
                    borderColor: colors.primary,
                    backgroundColor: colors.primaryLight,
                  },
                ]}
                onPress={() => setPaymentMethod(method)}
              >
                <Text style={[
                  styles.paymentText,
                  { color: colors.textSecondary },
                  paymentMethod === method && { color: colors.primary, fontWeight: '600' },
                ]}>
                  {method === 'card' ? '💳 Carte bancaire' : '💵 Espèces'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Code promo */}
        <View style={[styles.section, { backgroundColor: colors.surface }]}>
          <View style={styles.sectionHeader}>
            <Tag size={20} color={colors.primary} />
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Code promo</Text>
          </View>
          <View style={styles.promoRow}>
            <TextInput
              style={[styles.input, styles.promoInput, {
                backgroundColor: colors.inputBackground,
                borderColor: promoDiscount ? colors.success : colors.border,
                color: colors.text,
              }]}
              placeholder="Ex: FOODIE30"
              placeholderTextColor={colors.placeholder}
              value={promoCode}
              onChangeText={(t) => { setPromoCode(t); setPromoError(''); setPromoDiscount(null); }}
              autoCapitalize="characters"
              editable={!promoDiscount}
            />
            <TouchableOpacity
              style={[styles.promoButton, {
                backgroundColor: promoDiscount ? colors.success : colors.primary,
                opacity: promoLoading ? 0.7 : 1,
              }]}
              onPress={promoDiscount ? () => { setPromoDiscount(null); setPromoCode(''); } : validatePromo}
              disabled={promoLoading}
            >
              {promoLoading
                ? <ActivityIndicator size="small" color="#fff" />
                : <Text style={styles.promoButtonText}>{promoDiscount ? '✕' : 'Valider'}</Text>
              }
            </TouchableOpacity>
          </View>
          {promoError ? (
            <Text style={[styles.promoFeedback, { color: colors.error }]}>{promoError}</Text>
          ) : null}
          {promoDiscount ? (
            <Text style={[styles.promoFeedback, { color: colors.success }]}>
              ✅ -{(promoDiscount * 100).toFixed(0)}% appliqué — vous économisez {discount.toFixed(2)} €
            </Text>
          ) : null}
        </View>

        {/* Résumé */}
        <View style={[styles.section, { backgroundColor: colors.surface }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Résumé</Text>
          <View style={styles.summaryRow}>
            <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Sous-total</Text>
            <Text style={[styles.summaryValue, { color: colors.text }]}>{total.toFixed(2)} €</Text>
          </View>
          {discount > 0 && (
            <View style={styles.summaryRow}>
              <Text style={[styles.discountLabel, { color: colors.success }]}>Réduction promo</Text>
              <Text style={[styles.discountValue, { color: colors.success }]}>-{discount.toFixed(2)} €</Text>
            </View>
          )}
          <View style={styles.summaryRow}>
            <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Livraison</Text>
            <Text style={[styles.summaryValue, { color: colors.text }]}>{deliveryFee.toFixed(2)} €</Text>
          </View>
          <View style={[styles.summaryRow, styles.totalRow, { borderTopColor: colors.border }]}>
            <Text style={[styles.totalLabel, { color: colors.text }]}>Total</Text>
            <Text style={[styles.totalValue, { color: colors.primary }]}>{finalTotal.toFixed(2)} €</Text>
          </View>
        </View>

        <View style={{ height: 20 }} />
      </ScrollView>

      <View style={[styles.footer, { backgroundColor: colors.surface, borderTopColor: colors.borderLight }]}>
        <TouchableOpacity
          style={[styles.orderButton, { backgroundColor: colors.primary, opacity: loading ? 0.7 : 1 }]}
          onPress={handleOrder}
          disabled={loading}
        >
          {loading
            ? <ActivityIndicator color="#fff" />
            : <Text style={styles.orderButtonText}>
                Confirmer la commande — {finalTotal.toFixed(2)} €
              </Text>
          }
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    gap: 12,
  },
  backText: { fontSize: 16 },
  title: { fontSize: 20, fontWeight: 'bold' },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 },
  emptyText: { fontSize: 18, fontWeight: '600', marginTop: 16 },
  emptySubText: { fontSize: 14, marginTop: 4, marginBottom: 24, textAlign: 'center' },
  goBackButton: { paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 },
  goBackText: { color: '#fff', fontWeight: '600', fontSize: 16 },
  content: { flex: 1 },
  section: {
    margin: 16,
    marginBottom: 0,
    borderRadius: 12,
    padding: 16,
  },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  sectionTitle: { fontSize: 16, fontWeight: '600' },
  recapRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  recapName: { fontSize: 14, flex: 1 },
  recapPrice: { fontSize: 14, fontWeight: '600' },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
  },
  paymentOptions: { flexDirection: 'row', gap: 12 },
  paymentOption: {
    flex: 1, padding: 12, borderRadius: 8,
    borderWidth: 2, alignItems: 'center',
  },
  paymentText: { fontSize: 14 },
  promoRow: { flexDirection: 'row', gap: 8 },
  promoInput: { flex: 1 },
  promoButton: {
    paddingHorizontal: 16, borderRadius: 8,
    alignItems: 'center', justifyContent: 'center',
    minWidth: 72,
  },
  promoButtonText: { color: '#fff', fontWeight: '600' },
  promoFeedback: { fontSize: 12, marginTop: 8 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  summaryLabel: { fontSize: 14 },
  summaryValue: { fontSize: 14 },
  discountLabel: { fontSize: 14 },
  discountValue: { fontSize: 14, fontWeight: '600' },
  totalRow: { borderTopWidth: 1, paddingTop: 12, marginTop: 4 },
  totalLabel: { fontSize: 16, fontWeight: 'bold' },
  totalValue: { fontSize: 18, fontWeight: 'bold' },
  footer: { padding: 16, borderTopWidth: 1 },
  orderButton: { padding: 16, borderRadius: 12, alignItems: 'center' },
  orderButtonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});