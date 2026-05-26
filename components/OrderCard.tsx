import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import Text from './Text';
import { useRouter } from 'expo-router';
import { Order } from '../lib/types';
import StatusBadge from './StatusBadge';
import { Colors } from '../constants/colors';

export default function OrderCard({ order }: { order: Order }) {
  const router = useRouter();

  const walletsText = order.order_wallets?.length
    ? order.order_wallets.map(w => `${w.model} ×${w.quantity}`).join(', ')
    : null;

  const date = order.created_at
    ? new Date(order.created_at).toLocaleDateString('sr-RS', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      })
    : '';

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => router.push(`/${order.id}`)}
      activeOpacity={0.7}
    >
      <View style={styles.top}>
        <Text style={styles.name} numberOfLines={1}>
          {order.first_name} {order.last_name}
        </Text>
        <StatusBadge status={order.status} />
      </View>
      {walletsText ? (
        <Text style={styles.wallets} numberOfLines={2}>
          {walletsText}
        </Text>
      ) : null}
      {order.notes ? (
        <Text style={styles.notes} numberOfLines={1}>
          "{order.notes}"
        </Text>
      ) : null}
      <View style={styles.footer}>
        {order.phone ? <Text style={styles.contact}>📞 {order.phone}</Text> : <View />}
        <Text style={styles.date}>{date}</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.card,
    borderRadius: 14,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.07,
    shadowRadius: 5,
    elevation: 2,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  top: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  name: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textDark,
    flex: 1,
  },
  wallets: {
    fontSize: 13,
    color: Colors.textMedium,
    marginBottom: 4,
  },
  notes: {
    fontSize: 12,
    color: Colors.textLight,
    fontStyle: 'italic',
    marginBottom: 4,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6,
  },
  contact: { fontSize: 11, color: Colors.textLight },
  date: { fontSize: 11, color: Colors.textLight },
});
