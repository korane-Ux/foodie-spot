import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { MapPin, CreditCard, Tag } from 'lucide-react-native';
import api from '@/services/api';

export default function CheckoutScreen() {
  const [address, setAddress] = useState('');
  const [promoCode, setPromoCode] = useState('');
  const [promoDiscount, setPromoDiscount] = useState<number | null>(null);
  const [promoError, setPromoError] = useState('');
  const [promoLoading, setPromoLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'cash'>('card');
  const [loading, setLoading] = useState(false);

  const subtotal = 0; // sera remplacé par CartContext
  const deliveryFee = 2.99;
  const discount = promoDiscount ? subtotal * promoDiscount : 0;
  const total = subtotal + deliveryFee - discount;

  const validatePromo = async () => {
    if (!promoCode.trim()) return;
    setPromoLoading(true);
    setPromoError('');
    try {
      const response = await api.post('/promos/validate', {
        code: promoCode,
        orderAmount: subtotal,
      });
      const data = response.data?.data || response.data;
      setPromoDiscount(data.discount || 0.1);
      Alert.alert('✅ Code valide !', `Réduction de ${((data.discount || 0.1) * 100).toFixed(0)}% appliquée`);
    } catch (error: any) {
      setPromoError('Code invalide ou expiré');
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
      // Commande sera passée via CartContext dans la fonctionnalité innovante
      Alert.alert('Commande confirmée ! 🎉', 'Votre commande a été passée avec succès', [
        { text: 'OK', onPress: () => router.push('/(tabs)/orders') },
      ]);
    } catch {
      Alert.alert('Erreur', 'Impossible de passer la commande');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backText}>← Retour</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Validation</Text>
      </View>

      <ScrollView style={styles.content}>
        {/* Adresse livraison */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <MapPin size={20} color="#FF6B35" />
            <Text style={styles.sectionTitle}>Adresse de livraison</Text>
          </View>
          <TextInput
            style={styles.input}
            placeholder="Ex: 15 rue de la Paix, Paris"
            value={address}
            onChangeText={setAddress}
            multiline
          />
        </View>

        {/* Mode de paiement */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <CreditCard size={20} color="#FF6B35" />
            <Text style={styles.sectionTitle}>Mode de paiement</Text>
          </View>
          <View style={styles.paymentOptions}>
            <TouchableOpacity
              style={[styles.paymentOption, paymentMethod === 'card' && styles.paymentOptionActive]}
              onPress={() => setPaymentMethod('card')}
            >
              <Text style={[styles.paymentText, paymentMethod === 'card' && styles.paymentTextActive]}>
                💳 Carte bancaire
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.paymentOption, paymentMethod === 'cash' && styles.paymentOptionActive]}
              onPress={() => setPaymentMethod('cash')}
            >
              <Text style={[styles.paymentText, paymentMethod === 'cash' && styles.paymentTextActive]}>
                💵 Espèces
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Code promo */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Tag size={20} color="#FF6B35" />
            <Text style={styles.sectionTitle}>Code promo</Text>
          </View>
          <View style={styles.promoRow}>
            <TextInput
              style={[styles.input, styles.promoInput]}
              placeholder="Ex: FOODIE30"
              value={promoCode}
              onChangeText={(t) => { setPromoCode(t); setPromoError(''); }}
              autoCapitalize="characters"
            />
            <TouchableOpacity style={styles.promoButton} onPress={validatePromo} disabled={promoLoading}>
              {promoLoading ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.promoButtonText}>Valider</Text>}
            </TouchableOpacity>
          </View>
          {promoError ? <Text style={styles.promoError}>{promoError}</Text> : null}
          {promoDiscount ? <Text style={styles.promoSuccess}>✅ Réduction de {(promoDiscount * 100).toFixed(0)}% appliquée</Text> : null}
        </View>

        {/* Résumé */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Résumé</Text>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Sous-total</Text>
            <Text style={styles.summaryValue}>{subtotal.toFixed(2)} €</Text>
          </View>
          {discount > 0 && (
            <View style={styles.summaryRow}>
              <Text style={styles.discountLabel}>Réduction</Text>
              <Text style={styles.discountValue}>-{discount.toFixed(2)} €</Text>
            </View>
          )}
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Livraison</Text>
            <Text style={styles.summaryValue}>{deliveryFee.toFixed(2)} €</Text>
          </View>
          <View style={[styles.summaryRow, styles.totalRow]}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>{total.toFixed(2)} €</Text>
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.orderButton} onPress={handleOrder} disabled={loading}>
          {loading
            ? <ActivityIndicator color="#fff" />
            : <Text style={styles.orderButtonText}>Confirmer la commande — {total.toFixed(2)} €</Text>
          }
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    gap: 12,
  },
  backText: { color: '#FF6B35', fontSize: 16 },
  title: { fontSize: 20, fontWeight: 'bold', color: '#111827' },
  content: { flex: 1 },
  section: {
    backgroundColor: '#fff',
    margin: 16,
    marginBottom: 0,
    borderRadius: 12,
    padding: 16,
  },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: '#111827' },
  input: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: '#111827',
    backgroundColor: '#f9fafb',
  },
  paymentOptions: { flexDirection: 'row', gap: 12 },
  paymentOption: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#e5e7eb',
    alignItems: 'center',
  },
  paymentOptionActive: { borderColor: '#FF6B35', backgroundColor: '#FFF5F2' },
  paymentText: { fontSize: 14, color: '#666' },
  paymentTextActive: { color: '#FF6B35', fontWeight: '600' },
  promoRow: { flexDirection: 'row', gap: 8 },
  promoInput: { flex: 1 },
  promoButton: {
    backgroundColor: '#FF6B35',
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  promoButtonText: { color: '#fff', fontWeight: '600' },
  promoError: { color: '#ef4444', fontSize: 12, marginTop: 8 },
  promoSuccess: { color: '#10b981', fontSize: 12, marginTop: 8 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  summaryLabel: { fontSize: 14, color: '#666' },
  summaryValue: { fontSize: 14, color: '#111827' },
  discountLabel: { fontSize: 14, color: '#10b981' },
  discountValue: { fontSize: 14, color: '#10b981', fontWeight: '600' },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingTop: 12,
    marginTop: 4,
  },
  totalLabel: { fontSize: 16, fontWeight: 'bold', color: '#111827' },
  totalValue: { fontSize: 18, fontWeight: 'bold', color: '#FF6B35' },
  footer: {
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  orderButton: {
    backgroundColor: '#FF6B35',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  orderButtonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
