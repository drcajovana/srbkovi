import React from 'react';
import { View, StyleSheet } from 'react-native';
import Text from './Text';
import { OrderStatus, STATUS_LABELS } from '../lib/types';
import { Colors } from '../constants/colors';

interface Props {
  status: OrderStatus;
  size?: 'sm' | 'md' | 'lg';
}

export default function StatusBadge({ status, size = 'md' }: Props) {
  const isLg = size === 'lg';
  return (
    <View style={[styles.badge, { backgroundColor: Colors.statusBg[status] }, isLg && styles.badgeLg]}>
      <View style={[styles.dot, { backgroundColor: Colors.status[status] }, isLg && styles.dotLg]} />
      <Text style={[styles.text, { color: Colors.status[status] }, isLg && styles.textLg]}>
        {STATUS_LABELS[status]}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    gap: 6,
  },
  badgeLg: { paddingHorizontal: 14, paddingVertical: 7 },
  dot: { width: 6, height: 6, borderRadius: 3 },
  dotLg: { width: 8, height: 8, borderRadius: 4 },
  text: { fontSize: 12, fontWeight: '600', letterSpacing: 0.2 },
  textLg: { fontSize: 14 },
});
