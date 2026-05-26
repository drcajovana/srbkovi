import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Text from './Text';
import { WALLET_CATEGORIES } from '../constants/wallets';
import { OrderWallet } from '../lib/types';
import { Colors } from '../constants/colors';

interface Props {
  visible: boolean;
  onClose: () => void;
  initialWallets: OrderWallet[];
  onConfirm: (wallets: OrderWallet[]) => void;
}

export default function WalletPicker({ visible, onClose, initialWallets, onConfirm }: Props) {
  const [selectedCategory, setSelectedCategory] = useState(0);
  const [quantities, setQuantities] = useState<Record<string, number>>({});

  useEffect(() => {
    if (visible) {
      const q: Record<string, number> = {};
      initialWallets.forEach(w => {
        q[`${w.category}:${w.model}`] = w.quantity;
      });
      setQuantities(q);
    }
  }, [visible]);

  const category = WALLET_CATEGORIES[selectedCategory];

  const getQty = (cat: string, model: string) => quantities[`${cat}:${model}`] ?? 0;

  const setQty = (cat: string, model: string, qty: number) => {
    const key = `${cat}:${model}`;
    setQuantities(prev => {
      if (qty <= 0) {
        const { [key]: _, ...rest } = prev;
        return rest;
      }
      return { ...prev, [key]: qty };
    });
  };

  const totalSelected = Object.values(quantities).reduce((sum, q) => sum + q, 0);

  const handleConfirm = () => {
    const wallets: OrderWallet[] = [];
    WALLET_CATEGORIES.forEach(cat => {
      cat.models.forEach(model => {
        const qty = getQty(cat.name, model);
        if (qty > 0) {
          wallets.push({ category: cat.name, model, quantity: qty });
        }
      });
    });
    onConfirm(wallets);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.headerBtn}>
            <Text style={styles.cancelText}>Otkaži</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Dodaj Novčanik</Text>
          <View style={styles.headerBtn} />
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.tabs}
          contentContainerStyle={styles.tabsContent}
        >
          {WALLET_CATEGORIES.map((cat, i) => (
            <TouchableOpacity
              key={cat.name}
              style={[styles.tab, i === selectedCategory && styles.tabActive]}
              onPress={() => setSelectedCategory(i)}
            >
              <Text style={[styles.tabText, i === selectedCategory && styles.tabTextActive]}>
                {cat.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <ScrollView style={styles.list} contentContainerStyle={styles.listContent}>
          {category.models.map(model => {
            const qty = getQty(category.name, model);
            return (
              <View key={model} style={styles.modelRow}>
                <View style={styles.modelInfo}>
                  <Text style={styles.modelName}>{model}</Text>
                  <Text style={styles.categoryLabel}>{category.name}</Text>
                </View>
                <View style={styles.qtyControl}>
                  <TouchableOpacity
                    style={[styles.qtyBtn, qty === 0 && styles.qtyBtnDisabled]}
                    onPress={() => setQty(category.name, model, qty - 1)}
                    disabled={qty === 0}
                  >
                    <Text style={styles.qtyBtnText}>−</Text>
                  </TouchableOpacity>
                  <Text style={[styles.qtyText, qty > 0 && styles.qtyTextActive]}>{qty}</Text>
                  <TouchableOpacity
                    style={styles.qtyBtn}
                    onPress={() => setQty(category.name, model, qty + 1)}
                  >
                    <Text style={styles.qtyBtnText}>+</Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          })}
        </ScrollView>

        {totalSelected > 0 && (
          <View style={styles.summary}>
            <Text style={styles.summaryTitle}>Izabrano:</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {WALLET_CATEGORIES.flatMap(cat =>
                cat.models
                  .filter(model => getQty(cat.name, model) > 0)
                  .map(model => (
                    <View key={`${cat.name}:${model}`} style={styles.chip}>
                      <Text style={styles.chipText}>
                        {model} ×{getQty(cat.name, model)}
                      </Text>
                    </View>
                  ))
              )}
            </ScrollView>
          </View>
        )}

        <View style={styles.bottomBar}>
          <TouchableOpacity
            style={[styles.confirmBtn, totalSelected === 0 && styles.confirmBtnDisabled]}
            onPress={handleConfirm}
            activeOpacity={0.85}
          >
            <Text style={styles.confirmBtnText}>
              Potvrdi{totalSelected > 0 ? ` (${totalSelected})` : ''}
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
    backgroundColor: Colors.card,
  },
  headerBtn: { minWidth: 70 },
  title: { fontSize: 17, fontWeight: '700', color: Colors.textDark },
  cancelText: { fontSize: 15, color: Colors.textMedium },
  confirmText: { fontSize: 15, fontWeight: '700', color: Colors.primary, textAlign: 'right' },
  tabs: {
    maxHeight: 52,
    backgroundColor: Colors.card,
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
  },
  tabsContent: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
  },
  tab: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  tabActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  tabText: { fontSize: 13, fontWeight: '500', color: Colors.textMedium },
  tabTextActive: { color: '#fff' },
  list: { flex: 1 },
  listContent: { paddingBottom: 20 },
  modelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
    backgroundColor: Colors.card,
    marginBottom: 1,
  },
  modelInfo: { flex: 1 },
  modelName: { fontSize: 15, fontWeight: '600', color: Colors.textDark },
  categoryLabel: { fontSize: 12, color: Colors.textLight, marginTop: 2 },
  qtyControl: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  qtyBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  qtyBtnDisabled: { opacity: 0.3 },
  qtyBtnText: { fontSize: 20, color: Colors.primary, fontWeight: '400', lineHeight: 24 },
  qtyText: { fontSize: 16, fontWeight: '600', color: Colors.textLight, minWidth: 24, textAlign: 'center' },
  qtyTextActive: { color: Colors.primary },
  summary: {
    padding: 14,
    borderTopWidth: 1,
    borderTopColor: Colors.divider,
    backgroundColor: Colors.card,
  },
  summaryTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textMedium,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 8,
  },
  chip: {
    backgroundColor: Colors.statusBg.primljeno,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 5,
    marginRight: 8,
  },
  chipText: { fontSize: 13, color: Colors.status.primljeno, fontWeight: '600' },
  bottomBar: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
    borderTopWidth: 1,
    borderTopColor: Colors.divider,
    backgroundColor: Colors.card,
  },
  confirmBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  confirmBtnDisabled: { backgroundColor: Colors.secondary, opacity: 0.5 },
  confirmBtnText: { color: '#fff', fontSize: 16, fontWeight: '700', letterSpacing: 0.3 },
});
