import React, { useCallback, useEffect, useState } from 'react';
import {
  FlatList, RefreshControl, StyleSheet,
  Text, TouchableOpacity, View,
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { OrderCard } from '@/components/order-card';
import { Loader } from '@/components/ui/loader';
import { EmptyState } from '@/components/ui/empty-state';
import { orderAPI } from '@/services/api';
import { useTheme } from '@/contexts/theme-context';
import { useI18n } from '@/contexts/i18n-context';
import { Order, OrderStatus } from '@/types';
import { COLORS } from '@/constants/theme';

type Tab = 'all' | 'active' | 'delivered' | 'cancelled';

const ACTIVE_STATUSES: OrderStatus[] = [
  'pending', 'confirmed', 'preparing', 'ready', 'picked_up', 'delivering', 'on-the-way',
];

function filterOrders(orders: Order[], tab: Tab): Order[] {
  switch (tab) {
    case 'active':    return orders.filter((o) => ACTIVE_STATUSES.includes(o.status as OrderStatus));
    case 'delivered': return orders.filter((o) => o.status === 'delivered');
    case 'cancelled': return orders.filter((o) => o.status === 'cancelled');
    default:          return orders;
  }
}

export default function OrdersScreen() {
  const { colors } = useTheme();
  const { t } = useI18n();

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>('all');

  const loadOrders = useCallback(async () => {
    try {
      const data = await orderAPI.getOrders();
      setOrders(data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadOrders(); }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadOrders();
    setRefreshing(false);
  };

  const handleOrderPress = useCallback((order: Order) => {
    if (ACTIVE_STATUSES.includes(order.status as OrderStatus)) {
      router.push(`/tracking/${order.id}`);
    }
  }, []);

  const renderOrder = useCallback(
    ({ item }: { item: Order }) => (
      <OrderCard order={item} onPress={() => handleOrderPress(item)} />
    ),
    [handleOrderPress]
  );

  const TABS: { key: Tab; label: string }[] = [
    { key: 'all',       label: t('orders.all') },
    { key: 'active',    label: t('orders.active') },
    { key: 'delivered', label: t('orders.delivered') },
    { key: 'cancelled', label: t('orders.cancelled') },
  ];

  const filtered = filterOrders(orders, activeTab);

  if (loading) return <Loader message={t('common.loading')} />;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Text style={[styles.title, { color: colors.text }]}>{t('orders.title')}</Text>
      </View>

      {/* Onglets */}
      <View style={[styles.tabs, { borderBottomColor: colors.border }]}>
        {TABS.map((tab) => {
          const count = filterOrders(orders, tab.key).length;
          const active = activeTab === tab.key;
          return (
            <TouchableOpacity
              key={tab.key}
              style={[styles.tab, { borderBottomColor: active ? COLORS.primary : 'transparent' }]}
              onPress={() => setActiveTab(tab.key)}
              accessibilityLabel={tab.label}
              accessibilityState={{ selected: active }}
            >
              <Text style={[styles.tabText, { color: active ? COLORS.primary : colors.textSecondary }]}>
                {tab.label}
              </Text>
              {count > 0 && (
                <View style={[styles.tabBadge, { backgroundColor: active ? COLORS.primary : colors.backgroundTertiary }]}>
                  <Text style={[styles.tabBadgeText, { color: active ? '#fff' : colors.textSecondary }]}>
                    {count}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(o) => o.id}
        renderItem={renderOrder}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={
          <EmptyState
            icon="🛍️"
            title={t('orders.empty')}
            subtitle={t('orders.emptySubtitle')}
            actionLabel={t('orders.orderNow')}
            onAction={() => router.push('/(tabs)')}
          />
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { padding: 16, borderBottomWidth: 1 },
  title: { fontSize: 24, fontWeight: 'bold' },
  tabs: { flexDirection: 'row', borderBottomWidth: 1 },
  tab: {
    flex: 1, flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', paddingVertical: 12,
    gap: 4, borderBottomWidth: 2,
  },
  tabText: { fontSize: 12, fontWeight: '600' },
  tabBadge: { paddingHorizontal: 5, paddingVertical: 1, borderRadius: 8 },
  tabBadgeText: { fontSize: 10, fontWeight: '700' },
  listContent: { padding: 16, paddingBottom: 100 },
});
