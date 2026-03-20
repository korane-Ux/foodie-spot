import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert, FlatList, KeyboardAvoidingView,
  Modal, Platform, StyleSheet, Text,
  TextInput, TouchableOpacity, View,
} from 'react-native';
import { router } from 'expo-router';
import { ArrowLeft, Check, MapPin, Plus, Trash2 } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppButton } from '@/components/ui/app-button';
import { Loader } from '@/components/ui/loader';
import { EmptyState } from '@/components/ui/empty-state';
import { userAPI } from '@/services/api';
import { useToast } from '@/components/toast-provider';
import { useTheme } from '@/contexts/theme-context';
import { Address } from '@/types';
import { COLORS } from '@/constants/theme';

const LABELS = ['Maison', 'Travail', 'Autre'];

const EMPTY_FORM = {
  label: 'Maison',
  street: '',
  apartment: '',
  city: '',
  postalCode: '',
  country: 'France',
  instructions: '',
  isDefault: false,
};

export default function AddressesScreen() {
  const { colors } = useTheme();
  const toast = useToast();

  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const loadAddresses = useCallback(async () => {
    try {
      const data = await userAPI.getAddresses();
      setAddresses(data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadAddresses(); }, []);

  const openAdd = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setModalVisible(true);
  };

  const openEdit = (addr: Address) => {
    setEditingId(addr.id);
    setForm({
      label: addr.label,
      street: addr.street,
      apartment: addr.apartment ?? '',
      city: addr.city,
      postalCode: addr.postalCode,
      country: addr.country,
      instructions: addr.instructions ?? '',
      isDefault: addr.isDefault ?? false,
    });
    setModalVisible(true);
  };

  const handleSave = async () => {
    if (!form.street.trim() || !form.city.trim() || !form.postalCode.trim()) {
      toast.error('Rue, ville et code postal sont requis');
      return;
    }
    setSaving(true);
    try {
      if (editingId) {
        await userAPI.updateAddress(editingId, form);
        toast.success('Adresse mise à jour');
      } else {
        await userAPI.addAddress(form as any);
        toast.success('Adresse ajoutée');
      }
      setModalVisible(false);
      await loadAddresses();
    } catch {
      toast.error('Impossible de sauvegarder l\'adresse');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (addr: Address) => {
    Alert.alert('Supprimer', `Supprimer "${addr.label}" ?`, [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Supprimer', style: 'destructive',
        onPress: async () => {
          try {
            await userAPI.deleteAddress(addr.id);
            toast.success('Adresse supprimée');
            await loadAddresses();
          } catch {
            toast.error('Impossible de supprimer l\'adresse');
          }
        },
      },
    ]);
  };

  const setField = (key: keyof typeof EMPTY_FORM, value: any) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  if (loading) return <Loader message="Chargement des adresses..." />;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()}>
          <ArrowLeft size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>Mes adresses</Text>
        <TouchableOpacity onPress={openAdd}>
          <Plus size={24} color={COLORS.primary} />
        </TouchableOpacity>
      </View>

      <FlatList
        data={addresses}
        keyExtractor={(a) => a.id}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.addressCard, { backgroundColor: colors.card, borderColor: item.isDefault ? COLORS.primary : colors.border }]}
            onPress={() => openEdit(item)}
            activeOpacity={0.8}
          >
            <View style={[styles.iconBox, { backgroundColor: item.isDefault ? COLORS.primaryLight : colors.backgroundSecondary }]}>
              <MapPin size={20} color={item.isDefault ? COLORS.primary : colors.textSecondary} />
            </View>
            <View style={{ flex: 1 }}>
              <View style={styles.addressHeader}>
                <Text style={[styles.addressLabel, { color: colors.text }]}>{item.label}</Text>
                {item.isDefault && (
                  <View style={styles.defaultBadge}>
                    <Check size={10} color="#fff" />
                    <Text style={styles.defaultText}>Défaut</Text>
                  </View>
                )}
              </View>
              <Text style={[styles.addressStreet, { color: colors.textSecondary }]}>{item.street}</Text>
              {item.apartment ? (
                <Text style={[styles.addressDetail, { color: colors.textMuted }]}>{item.apartment}</Text>
              ) : null}
              <Text style={[styles.addressDetail, { color: colors.textMuted }]}>
                {item.postalCode} {item.city}, {item.country}
              </Text>
            </View>
            <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDelete(item)}>
              <Trash2 size={18} color={COLORS.error} />
            </TouchableOpacity>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <EmptyState
            icon="📍"
            title="Aucune adresse"
            subtitle="Ajoutez une adresse pour faciliter vos commandes"
            actionLabel="Ajouter une adresse"
            onAction={openAdd}
          />
        }
      />

      {/* Modal ajout/édition */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setModalVisible(false)}
      >
        <SafeAreaView style={[styles.modal, { backgroundColor: colors.background }]}>
          <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          >
            <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <ArrowLeft size={24} color={colors.text} />
              </TouchableOpacity>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                {editingId ? 'Modifier' : 'Nouvelle adresse'}
              </Text>
              <View style={{ width: 24 }} />
            </View>

            <FlatList
              data={[{ key: 'form' }]}
              keyExtractor={(i) => i.key}
              renderItem={() => (
                <View style={{ padding: 20, gap: 14 }}>
                  {/* Label */}
                  <View>
                    <Text style={[styles.fieldLabel, { color: colors.text }]}>Type d'adresse</Text>
                    <View style={styles.labelRow}>
                      {LABELS.map((l) => (
                        <TouchableOpacity
                          key={l}
                          style={[
                            styles.labelChip,
                            {
                              backgroundColor: form.label === l ? COLORS.primary : colors.backgroundSecondary,
                              borderColor: form.label === l ? COLORS.primary : colors.border,
                            },
                          ]}
                          onPress={() => setField('label', l)}
                        >
                          <Text style={[styles.labelChipText, { color: form.label === l ? '#fff' : colors.textSecondary }]}>
                            {l}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>

                  <FormField
                    label="Rue *"
                    value={form.street}
                    onChange={(v) => setField('street', v)}
                    placeholder="Ex: 12 rue de Rivoli"
                    colors={colors}
                  />
                  <FormField
                    label="Appartement / Étage"
                    value={form.apartment}
                    onChange={(v) => setField('apartment', v)}
                    placeholder="Ex: Bât. A, 3ème étage"
                    colors={colors}
                  />
                  <View style={styles.rowFields}>
                    <View style={{ flex: 1 }}>
                      <FormField
                        label="Code postal *"
                        value={form.postalCode}
                        onChange={(v) => setField('postalCode', v)}
                        placeholder="75001"
                        keyboardType="numeric"
                        colors={colors}
                      />
                    </View>
                    <View style={{ flex: 2 }}>
                      <FormField
                        label="Ville *"
                        value={form.city}
                        onChange={(v) => setField('city', v)}
                        placeholder="Paris"
                        colors={colors}
                      />
                    </View>
                  </View>
                  <FormField
                    label="Instructions livreur"
                    value={form.instructions}
                    onChange={(v) => setField('instructions', v)}
                    placeholder="Ex: Code porte : 1234"
                    colors={colors}
                    multiline
                  />

                  {/* Adresse par défaut */}
                  <TouchableOpacity
                    style={styles.defaultRow}
                    onPress={() => setField('isDefault', !form.isDefault)}
                  >
                    <View style={[
                      styles.checkbox,
                      {
                        backgroundColor: form.isDefault ? COLORS.primary : 'transparent',
                        borderColor: form.isDefault ? COLORS.primary : colors.border,
                      },
                    ]}>
                      {form.isDefault && <Check size={14} color="#fff" />}
                    </View>
                    <Text style={[styles.defaultRowText, { color: colors.text }]}>
                      Définir comme adresse par défaut
                    </Text>
                  </TouchableOpacity>

                  <AppButton
                    label={editingId ? 'Enregistrer' : 'Ajouter l\'adresse'}
                    onPress={handleSave}
                    loading={saving}
                    style={{ marginTop: 8 }}
                  />
                </View>
              )}
            />
          </KeyboardAvoidingView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

function FormField({ label, value, onChange, placeholder, keyboardType, colors, multiline }: any) {
  return (
    <View>
      <Text style={[formStyles.label, { color: colors.text }]}>{label}</Text>
      <TextInput
        style={[
          formStyles.input,
          { backgroundColor: colors.backgroundSecondary, color: colors.text, borderColor: colors.border },
          multiline && { height: 80, textAlignVertical: 'top' },
        ]}
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor={colors.textMuted}
        keyboardType={keyboardType}
        multiline={multiline}
      />
    </View>
  );
}

const formStyles = StyleSheet.create({
  label: { fontSize: 13, fontWeight: '600', marginBottom: 6 },
  input: {
    borderRadius: 12, borderWidth: 1,
    paddingHorizontal: 14, paddingVertical: 12, fontSize: 15,
  },
});

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16, borderBottomWidth: 1,
  },
  title: { fontSize: 22, fontWeight: 'bold' },
  listContent: { padding: 16, gap: 12, paddingBottom: 40 },
  addressCard: {
    flexDirection: 'row', alignItems: 'flex-start',
    borderRadius: 16, padding: 14, gap: 12,
    borderWidth: 1.5,
  },
  iconBox: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  addressHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 2 },
  addressLabel: { fontSize: 15, fontWeight: '700' },
  defaultBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 6, paddingVertical: 2, borderRadius: 8,
  },
  defaultText: { color: '#fff', fontSize: 10, fontWeight: '700' },
  addressStreet: { fontSize: 14, marginBottom: 2 },
  addressDetail: { fontSize: 12 },
  deleteBtn: { padding: 4 },
  modal: { flex: 1 },
  modalHeader: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16, borderBottomWidth: 1,
  },
  modalTitle: { fontSize: 20, fontWeight: 'bold' },
  labelRow: { flexDirection: 'row', gap: 10, marginTop: 8 },
  labelChip: {
    paddingHorizontal: 16, paddingVertical: 8,
    borderRadius: 20, borderWidth: 1.5,
  },
  labelChipText: { fontSize: 14, fontWeight: '600' },
  rowFields: { flexDirection: 'row', gap: 12 },
  defaultRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  checkbox: {
    width: 22, height: 22, borderRadius: 6, borderWidth: 2,
    alignItems: 'center', justifyContent: 'center',
  },
  defaultRowText: { fontSize: 15 },
});
