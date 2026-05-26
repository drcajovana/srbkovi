import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { supabase } from '../lib/supabase';
import { Order, OrderStatus, OrderWallet, STATUS_LABELS } from '../lib/types';
import { Colors } from '../constants/colors';
import Text from '../components/Text';

const MONTHS = [
  'Januar', 'Februar', 'Mart', 'April', 'Maj', 'Jun',
  'Jul', 'Avgust', 'Septembar', 'Oktobar', 'Novembar', 'Decembar',
];

const STATUS_ORDER: OrderStatus[] = ['primljeno', 'u_izradi', 'gotovo', 'poslato'];

export default function StatsScreen() {
  const insets = useSafeAreaInsets();
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchStats = useCallback(async () => {
    setLoading(true);
    const from = new Date(year, month, 1).toISOString();
    const to = new Date(year, month + 1, 1).toISOString();

    const { data } = await supabase
      .from('orders')
      .select('*, order_wallets(*)')
      .gte('created_at', from)
      .lt('created_at', to);

    setOrders(data ?? []);
    setLoading(false);
  }, [year, month]);

  useEffect(() => { fetchStats(); }, [fetchStats]);

  const prevMonth = () => {
    if (month === 0) { setMonth(11); setYear(y => y - 1); }
    else setMonth(m => m - 1);
  };

  const nextMonth = () => {
    const isCurrentMonth = year === now.getFullYear() && month === now.getMonth();
    if (isCurrentMonth) return;
    if (month === 11) { setMonth(0); setYear(y => y + 1); }
    else setMonth(m => m + 1);
  };

  const isFuture = year > now.getFullYear() || (year === now.getFullYear() && month >= now.getMonth());

  const counts = STATUS_ORDER.reduce((acc, s) => {
    acc[s] = orders.filter(o => o.status === s).length;
    return acc;
  }, {} as Record<OrderStatus, number>);

  const walletCounts: Record<string, number> = {};
  orders.forEach(order => {
    (order.order_wallets as OrderWallet[] ?? []).forEach(w => {
      walletCounts[w.model] = (walletCounts[w.model] ?? 0) + w.quantity;
    });
  });
  const topWallets = Object.entries(walletCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6);
  const maxWalletCount = topWallets[0]?.[1] ?? 1;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[styles.content, { paddingBottom: 32 + insets.bottom }]}
    >
      {/* Month selector */}
      <View style={styles.monthNav}>
        <TouchableOpacity style={styles.navBtn} onPress={prevMonth}>
          <Text style={styles.navArrow}>‹</Text>
        </TouchableOpacity>
        <View style={styles.monthCenter}>
          <Text style={styles.monthText}>{MONTHS[month]} {year}</Text>
        </View>
        <TouchableOpacity style={styles.navBtn} onPress={nextMonth} disabled={isFuture}>
          <Text style={[styles.navArrow, isFuture && styles.navArrowDisabled]}>›</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : (
        <>
          {/* Total */}
          <View style={styles.totalCard}>
            <Text style={styles.totalNumber}>{orders.length}</Text>
            <Text style={styles.totalLabel}>narudžbin{orders.length === 1 ? 'a' : orders.length < 5 ? 'e' : 'a'} ovog meseca</Text>
          </View>

          {/* Status cards */}
          <Text style={styles.sectionTitle}>Po statusu</Text>
          <View style={styles.statusGrid}>
            {STATUS_ORDER.map(s => (
              <View key={s} style={[styles.statusCard, { borderTopColor: Colors.status[s] }]}>
                <Text style={[styles.statusCount, { color: Colors.status[s] }]}>{counts[s]}</Text>
                <Text style={styles.statusCardLabel}>{STATUS_LABELS[s]}</Text>
                {orders.length > 0 && (
                  <View style={styles.statusBar}>
                    <View
                      style={[
                        styles.statusBarFill,
                        {
                          width: `${(counts[s] / orders.length) * 100}%`,
                          backgroundColor: Colors.status[s],
                        },
                      ]}
                    />
                  </View>
                )}
              </View>
            ))}
          </View>

          {/* Top wallets */}
          {topWallets.length > 0 && (
            <>
              <Text style={styles.sectionTitle}>Popularni modeli</Text>
              <View style={styles.walletsCard}>
                {topWallets.map(([model, count], index) => (
                  <View key={model} style={[styles.walletRow, index === topWallets.length - 1 && { borderBottomWidth: 0 }]}>
                    <View style={styles.walletRank}>
                      <Text style={styles.walletRankText}>{index + 1}</Text>
                    </View>
                    <View style={styles.walletInfo}>
                      <View style={styles.walletBarRow}>
                        <Text style={styles.walletName}>{model}</Text>
                        <Text style={styles.walletCount}>{count}×</Text>
                      </View>
                      <View style={styles.barTrack}>
                        <View
                          style={[
                            styles.barFill,
                            { width: `${(count / maxWalletCount) * 100}%` },
                          ]}
                        />
                      </View>
                    </View>
                  </View>
                ))}
              </View>
            </>
          )}

          {orders.length === 0 && (
            <View style={styles.empty}>
              <Text style={styles.emptyIcon}>📭</Text>
              <Text style={styles.emptyText}>Nema narudžbina za {MONTHS[month]} {year}.</Text>
            </View>
          )}
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: 16 },
  monthNav: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 16,
    overflow: 'hidden',
  },
  navBtn: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navArrow: { fontSize: 24, color: Colors.primary, fontWeight: '300', lineHeight: 28 },
  navArrowDisabled: { color: Colors.border },
  monthCenter: { flex: 1, alignItems: 'center' },
  monthText: { fontSize: 17, fontWeight: '700', color: Colors.textDark },
  totalCard: {
    backgroundColor: Colors.primary,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
  },
  totalNumber: { fontSize: 56, fontWeight: '700', color: '#fff', lineHeight: 64 },
  totalLabel: { fontSize: 14, color: 'rgba(255,255,255,0.75)', fontWeight: '500', marginTop: 2 },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textMedium,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 10,
    marginTop: 4,
  },
  statusGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 20,
  },
  statusCard: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 14,
    flex: 1,
    minWidth: '44%',
    borderWidth: 1,
    borderColor: Colors.border,
    borderTopWidth: 3,
  },
  statusCount: { fontSize: 28, fontWeight: '700', lineHeight: 34 },
  statusCardLabel: { fontSize: 12, color: Colors.textMedium, fontWeight: '500', marginTop: 2, marginBottom: 8 },
  statusBar: {
    height: 4,
    backgroundColor: Colors.background,
    borderRadius: 2,
    overflow: 'hidden',
  },
  statusBarFill: { height: 4, borderRadius: 2 },
  walletsCard: {
    backgroundColor: Colors.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  walletRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
    gap: 12,
  },
  walletRank: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  walletRankText: { fontSize: 12, fontWeight: '700', color: Colors.textMedium },
  walletInfo: { flex: 1 },
  walletBarRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  walletName: { fontSize: 14, fontWeight: '600', color: Colors.textDark },
  walletCount: { fontSize: 13, fontWeight: '700', color: Colors.primary },
  barTrack: {
    height: 6,
    backgroundColor: Colors.background,
    borderRadius: 3,
    overflow: 'hidden',
  },
  barFill: {
    height: 6,
    backgroundColor: Colors.primaryLight,
    borderRadius: 3,
  },
  center: { paddingTop: 60, alignItems: 'center' },
  empty: { alignItems: 'center', paddingTop: 48, gap: 10 },
  emptyIcon: { fontSize: 44 },
  emptyText: { fontSize: 14, color: Colors.textLight, textAlign: 'center' },
});
