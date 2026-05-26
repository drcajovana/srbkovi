import React from 'react';
import { View, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import Text from './Text';
import { OrderStatus, STATUS_LABELS, STATUS_FLOW } from '../lib/types';
import { Colors } from '../constants/colors';

interface Props {
  status: OrderStatus;
  onChange: (status: OrderStatus) => void;
  loading?: boolean;
}

const CIRCLE = 36;

export default function StatusStepper({ status, onChange, loading }: Props) {
  const currentIndex = STATUS_FLOW.indexOf(status);

  return (
    <View style={styles.wrapper}>
      <View style={styles.row}>
        {STATUS_FLOW.map((s, index) => {
          const isCompleted = index < currentIndex;
          const isActive = index === currentIndex;
          const isUpcoming = index > currentIndex;

          return (
            <React.Fragment key={s}>
              {index > 0 && (
                <View
                  style={[
                    styles.connector,
                    index <= currentIndex && styles.connectorDone,
                  ]}
                />
              )}
              <View style={styles.stepCol}>
                <TouchableOpacity
                  onPress={() => onChange(s)}
                  activeOpacity={0.75}
                  style={[
                    styles.circle,
                    isCompleted && styles.circleCompleted,
                    isActive && styles.circleActive,
                    isUpcoming && styles.circleUpcoming,
                  ]}
                >
                  {loading && isActive ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : isCompleted ? (
                    <Text style={styles.checkmark}>✓</Text>
                  ) : isActive ? (
                    <View style={styles.activeDot} />
                  ) : (
                    <View style={styles.upcomingDot} />
                  )}
                </TouchableOpacity>
                <Text
                  style={[
                    styles.label,
                    isCompleted && styles.labelDone,
                    isActive && styles.labelActive,
                  ]}
                  numberOfLines={1}
                >
                  {STATUS_LABELS[s]}
                </Text>
              </View>
            </React.Fragment>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    paddingVertical: 4,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  stepCol: {
    flex: 1,
    alignItems: 'center',
  },
  connector: {
    flex: 1,
    height: 2,
    marginTop: CIRCLE / 2 - 1,
    backgroundColor: Colors.border,
  },
  connectorDone: {
    backgroundColor: Colors.primaryLight,
  },
  circle: {
    width: CIRCLE,
    height: CIRCLE,
    borderRadius: CIRCLE / 2,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    borderWidth: 2,
    borderColor: Colors.border,
    backgroundColor: Colors.card,
  },
  circleCompleted: {
    backgroundColor: Colors.primaryLight,
    borderColor: Colors.primaryLight,
  },
  circleActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.45,
    shadowRadius: 10,
    elevation: 6,
  },
  circleUpcoming: {
    backgroundColor: Colors.background,
    borderColor: Colors.border,
  },
  checkmark: {
    fontSize: 15,
    color: '#fff',
    fontWeight: '700',
  },
  activeDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#fff',
  },
  upcomingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.border,
  },
  label: {
    fontSize: 11,
    color: Colors.textLight,
    textAlign: 'center',
    fontWeight: '500',
  },
  labelDone: {
    color: Colors.textMedium,
    fontWeight: '600',
  },
  labelActive: {
    color: Colors.primary,
    fontWeight: '700',
    fontSize: 12,
  },
});
