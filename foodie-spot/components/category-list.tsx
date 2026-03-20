import React, { useEffect, useState } from 'react';
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { router } from 'expo-router';
import { restaurantAPI } from '@/services/api';
import { useTheme } from '@/contexts/theme-context';
import { Category } from '@/types';
import { COLORS } from '@/constants/theme';

export const CategoryList: React.FC = () => {
  const { colors } = useTheme();
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    restaurantAPI.getCategories().then(setCategories);
  }, []);

  if (categories.length === 0) return null;

  return (
    <View style={styles.container}>
      <Text style={[styles.title, { color: colors.text }]}>Catégories</Text>
      <FlatList
        data={categories}
        keyExtractor={(c) => c.id}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.row}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.chip, { backgroundColor: colors.backgroundSecondary }]}
            onPress={() => router.push(`/(tabs)/search?category=${item.slug}`)}
            activeOpacity={0.7}
          >
            <Text style={styles.icon}>{item.icon}</Text>
            <Text style={[styles.label, { color: colors.text }]}>{item.name}</Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { paddingVertical: 12 },
  title: { fontSize: 16, fontWeight: '700', paddingHorizontal: 16, marginBottom: 10 },
  row: { paddingHorizontal: 16, gap: 10 },
  chip: {
    alignItems: 'center', gap: 4,
    paddingHorizontal: 14, paddingVertical: 10,
    borderRadius: 16,
  },
  icon: { fontSize: 22 },
  label: { fontSize: 12, fontWeight: '600' },
});
