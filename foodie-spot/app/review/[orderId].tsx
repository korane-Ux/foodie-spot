import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator, Alert, Image,
  KeyboardAvoidingView, Platform, ScrollView,
  StyleSheet, Text, TextInput,
  TouchableOpacity, View,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, Camera, Star, X } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';

import { AppButton } from '@/components/ui/app-button';
import { orderAPI, reviewAPI } from '@/services/api';
import { useTheme } from '@/contexts/theme-context';
import { useToast } from '@/components/toast-provider';
import { COLORS } from '@/constants/theme';

interface SubRating {
  label: string;
  key: 'qualityRating' | 'speedRating' | 'presentationRating';
}

const SUB_RATINGS: SubRating[] = [
  { label: 'Qualité', key: 'qualityRating' },
  { label: 'Rapidité', key: 'speedRating' },
  { label: 'Présentation', key: 'presentationRating' },
];

function StarRow({ rating, onRate, size = 32 }: { rating: number; onRate: (n: number) => void; size?: number }) {
  return (
    <View style={{ flexDirection: 'row', gap: 6 }}>
      {[1, 2, 3, 4, 5].map((n) => (
        <TouchableOpacity key={n} onPress={() => onRate(n)} activeOpacity={0.7}>
          <Star size={size} color="#FFC107" fill={n <= rating ? '#FFC107' : 'transparent'} />
        </TouchableOpacity>
      ))}
    </View>
  );
}

export default function ReviewScreen() {
  const { orderId } = useLocalSearchParams<{ orderId: string }>();
  const { colors } = useTheme();
  const toast = useToast();

  const [order, setOrder] = useState<any>(null);
  const [rating, setRating] = useState(0);
  const [subRatings, setSubRatings] = useState({ qualityRating: 0, speedRating: 0, presentationRating: 0 });
  const [comment, setComment] = useState('');
  const [photos, setPhotos] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (orderId) {
      orderAPI.getOrderById(orderId).then(setOrder);
    }
  }, [orderId]);

  const handlePickPhoto = async () => {
    if (photos.length >= 3) {
      toast.info('Maximum 3 photos');
      return;
    }
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission requise', "Accès aux photos requis");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.7,
    });
    if (!result.canceled) {
      setPhotos((prev) => [...prev, result.assets[0].uri]);
    }
  };

  const handleSubmit = async () => {
    if (rating === 0) {
      toast.error('Veuillez donner une note globale');
      return;
    }

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('restaurantId', order?.restaurantId ?? '');
      formData.append('orderId', orderId);
      formData.append('rating', String(rating));
      formData.append('comment', comment);
      formData.append('qualityRating', String(subRatings.qualityRating || ''));
      formData.append('speedRating', String(subRatings.speedRating || ''));
      formData.append('presentationRating', String(subRatings.presentationRating || ''));

      photos.forEach((uri, i) => {
        formData.append('images', {
          uri,
          name: `review_photo_${i}.jpg`,
          type: 'image/jpeg',
        } as any);
      });

      await reviewAPI.createReview(formData);
      setSubmitted(true);
      toast.success('Merci pour votre avis !');
    } catch {
      toast.error('Impossible d\'envoyer l\'avis');
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.successBox}>
          <Text style={styles.successEmoji}>⭐</Text>
          <Text style={[styles.successTitle, { color: colors.text }]}>Merci pour votre avis !</Text>
          <Text style={[styles.successSub, { color: colors.textSecondary }]}>
            Votre avis aide la communauté FoodieSpot.
          </Text>
          <AppButton label="Retour à l'accueil" onPress={() => router.replace('/(tabs)')} style={{ marginTop: 20, width: '100%' }} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={() => router.back()}>
            <ArrowLeft size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: colors.text }]}>Votre avis</Text>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 20, gap: 24 }}>
          {/* Restaurant */}
          {order && (
            <Text style={[styles.restaurantName, { color: colors.textSecondary }]}>
              {order.restaurantName}
            </Text>
          )}

          {/* Note globale */}
          <View style={styles.ratingSection}>
            <Text style={[styles.ratingTitle, { color: colors.text }]}>Note globale *</Text>
            <StarRow rating={rating} onRate={setRating} size={40} />
            {rating > 0 && (
              <Text style={[styles.ratingLabel, { color: COLORS.primary }]}>
                {['', 'Mauvais 😞', 'Passable 😐', 'Bien 🙂', 'Très bien 😊', 'Excellent 🤩'][rating]}
              </Text>
            )}
          </View>

          {/* Sous-notes */}
          <View style={[styles.subRatingsCard, { backgroundColor: colors.card }]}>
            <Text style={[styles.ratingTitle, { color: colors.text }]}>Notes par critère</Text>
            {SUB_RATINGS.map(({ label, key }) => (
              <View key={key} style={styles.subRatingRow}>
                <Text style={[styles.subRatingLabel, { color: colors.textSecondary }]}>{label}</Text>
                <StarRow rating={subRatings[key]} onRate={(n) => setSubRatings((prev) => ({ ...prev, [key]: n }))} size={22} />
              </View>
            ))}
          </View>

          {/* Commentaire */}
          <View>
            <Text style={[styles.ratingTitle, { color: colors.text }]}>Commentaire</Text>
            <TextInput
              style={[styles.commentInput, {
                backgroundColor: colors.backgroundSecondary,
                color: colors.text,
                borderColor: colors.border,
              }]}
              placeholder="Partagez votre expérience..."
              placeholderTextColor={colors.textMuted}
              multiline
              numberOfLines={4}
              value={comment}
              onChangeText={setComment}
            />
          </View>

          {/* Photos */}
          <View>
            <Text style={[styles.ratingTitle, { color: colors.text }]}>
              Photos ({photos.length}/3)
            </Text>
            <View style={styles.photosRow}>
              {photos.map((uri, i) => (
                <View key={i} style={styles.photoWrapper}>
                  <Image source={{ uri }} style={styles.photo} />
                  <TouchableOpacity
                    style={styles.removePhoto}
                    onPress={() => setPhotos((prev) => prev.filter((_, j) => j !== i))}
                  >
                    <X size={12} color="#fff" />
                  </TouchableOpacity>
                </View>
              ))}
              {photos.length < 3 && (
                <TouchableOpacity
                  style={[styles.addPhotoBtn, { backgroundColor: colors.backgroundSecondary, borderColor: colors.border }]}
                  onPress={handlePickPhoto}
                >
                  <Camera size={24} color={colors.textMuted} />
                  <Text style={[styles.addPhotoText, { color: colors.textMuted }]}>Ajouter</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>

          <AppButton
            label="Envoyer l'avis"
            onPress={handleSubmit}
            loading={submitting}
            disabled={rating === 0}
          />
        </ScrollView>
      </KeyboardAvoidingView>
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
  restaurantName: { fontSize: 16, textAlign: 'center', fontStyle: 'italic' },
  ratingSection: { alignItems: 'center', gap: 10 },
  ratingTitle: { fontSize: 15, fontWeight: '700' },
  ratingLabel: { fontSize: 15, fontWeight: '600' },
  subRatingsCard: { borderRadius: 16, padding: 16, gap: 12 },
  subRatingRow: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between',
  },
  subRatingLabel: { fontSize: 14, width: 90 },
  commentInput: {
    borderRadius: 12, borderWidth: 1,
    padding: 14, marginTop: 8,
    fontSize: 15, minHeight: 100,
    textAlignVertical: 'top',
  },
  photosRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 8 },
  photoWrapper: { position: 'relative' },
  photo: { width: 90, height: 90, borderRadius: 10 },
  removePhoto: {
    position: 'absolute', top: 4, right: 4,
    backgroundColor: 'rgba(0,0,0,0.6)',
    width: 20, height: 20, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
  },
  addPhotoBtn: {
    width: 90, height: 90, borderRadius: 10,
    borderWidth: 1.5, borderStyle: 'dashed',
    alignItems: 'center', justifyContent: 'center', gap: 4,
  },
  addPhotoText: { fontSize: 11 },
  successBox: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    padding: 32, gap: 10,
  },
  successEmoji: { fontSize: 64 },
  successTitle: { fontSize: 24, fontWeight: 'bold', textAlign: 'center' },
  successSub: { fontSize: 15, textAlign: 'center', lineHeight: 22 },
});
