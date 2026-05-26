import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  ScrollView,
} from 'react-native';
import Text from '../components/Text';
import { useRouter, useFocusEffect, useNavigation } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { supabase, isSupabaseReady } from '../lib/supabase';
import { Order, OrderStatus, STATUS_LABELS } from '../lib/types';
import OrderCard from '../components/OrderCard';
import { Colors } from '../constants/colors';

type FilterStatus = 'sve' | OrderStatus;

const FILTERS: { key: FilterStatus; label: string }[] = [
  { key: 'sve', label: 'Sve' },
  { key: 'primljeno', label: 'Primljeno' },
  { key: 'u_izradi', label: 'U Izradi' },
  { key: 'gotovo', label: 'Gotovo' },
  { key: 'poslato', label: 'Poslato' },
];

export default function OrdersScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const [orders, setOrders] = useState<Order[]>([]);

  useEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity
          onPress={() => router.push('/stats')}
          style={{ marginRight: 8, padding: 4 }}
        >
          <Text style={{ fontSize: 20 }}>📊</Text>
        </TouchableOpacity>
      ),
    });
  }, []);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<FilterStatus>('sve');
  const [error, setError] = useState<string | null>(null);

  const fetchOrders = useCallback(async () => {
    if (!isSupabaseReady) {
      setError('Supabase nije podešen. Dodaj URL i ključ u .env fajl.');
      setLoading(false);
      setRefreshing(false);
      return;
    }
    try {
      setError(null);
      const { data, error: supaErr } = await supabase
        .from('orders')
        .select('*, order_wallets(*), order_images(*)')
        .order('created_at', { ascending: false });

      if (supaErr) throw supaErr;
      setOrders(data ?? []);
    } catch (e: any) {
      setError(e.message ?? 'Greška pri učitavanju narudžbina.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchOrders();
    }, [fetchOrders])
  );

  const filteredOrders =
    filter === 'sve' ? orders : orders.filter(o => o.status === filter);

  const counts = orders.reduce(
    (acc, o) => {
      acc[o.status] = (acc[o.status] ?? 0) + 1;
      return acc;
    },
    {} as Record<OrderStatus, number>
  );

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filters}
        contentContainerStyle={styles.filtersContent}
      >
        {FILTERS.map(f => {
          const count = f.key === 'sve' ? orders.length : (counts[f.key as OrderStatus] ?? 0);
          const active = filter === f.key;
          return (
            <TouchableOpacity
              key={f.key}
              style={[styles.chip, active && styles.chipActive]}
              onPress={() => setFilter(f.key)}
            >
              <Text style={[styles.chipText, active && styles.chipTextActive]}>{f.label}</Text>
              {count > 0 && (
                <View style={[styles.badge, active && styles.badgeActive]}>
                  <Text style={[styles.badgeText, active && styles.badgeTextActive]}>{count}</Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : error ? (
        <View style={styles.center}>
          <Text style={styles.errorIcon}>⚠️</Text>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={fetchOrders}>
            <Text style={styles.retryText}>Pokušaj ponovo</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={filteredOrders}
          keyExtractor={item => item.id ?? Math.random().toString()}
          renderItem={({ item }) => <OrderCard order={item} />}
          contentContainerStyle={[styles.list, { paddingBottom: 96 + insets.bottom }]}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                fetchOrders();
              }}
              tintColor={Colors.primary}
              colors={[Colors.primary]}
            />
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyIcon}>🧵</Text>
              <Text style={styles.emptyText}>
                {filter === 'sve'
                  ? 'Nema narudžbina.\nDodaj prvu!'
                  : `Nema narudžbina sa statusom\n"${STATUS_LABELS[filter as OrderStatus]}"`}
              </Text>
            </View>
          }
        />
      )}

      <TouchableOpacity
        style={[styles.fab, { bottom: 24 + insets.bottom }]}
        onPress={() => router.push('/new')}
        activeOpacity={0.85}
      >
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  filters: {
    maxHeight: 56,
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
    backgroundColor: Colors.background,
  },
  filtersContent: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
    alignItems: 'center',
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 5,
  },
  chipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  chipText: { fontSize: 13, fontWeight: '500', color: Colors.textMedium },
  chipTextActive: { color: '#fff' },
  badge: {
    backgroundColor: Colors.border,
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 1,
    minWidth: 20,
    alignItems: 'center',
  },
  badgeActive: { backgroundColor: 'rgba(255,255,255,0.25)' },
  badgeText: { fontSize: 11, fontWeight: '700', color: Colors.textMedium },
  badgeTextActive: { color: '#fff' },
  list: { paddingTop: 12, paddingBottom: 96 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
  errorIcon: { fontSize: 40 },
  errorText: {
    fontSize: 14,
    color: Colors.textMedium,
    textAlign: 'center',
    paddingHorizontal: 32,
    lineHeight: 20,
  },
  retryBtn: {
    marginTop: 8,
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: Colors.primary,
    borderRadius: 10,
  },
  retryText: { color: '#fff', fontWeight: '600', fontSize: 14 },
  empty: { alignItems: 'center', paddingTop: 80, gap: 12 },
  emptyIcon: { fontSize: 52 },
  emptyText: {
    fontSize: 15,
    color: Colors.textLight,
    textAlign: 'center',
    paddingHorizontal: 32,
    lineHeight: 22,
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
  fabText: { fontSize: 30, color: '#fff', fontWeight: '300', lineHeight: 36 },
});
