import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  TextInput,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import Text from '../components/Text';
import { useLocalSearchParams, useRouter, useNavigation } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { supabase } from '../lib/supabase';
import { Order, OrderStatus, OrderWallet, OrderImage } from '../lib/types';
import { uploadOrderImage } from '../lib/storage';
import { Colors } from '../constants/colors';
import WalletPicker from '../components/WalletPicker';
import ImageUpload from '../components/ImageUpload';
import StatusStepper from '../components/StatusStepper';
import DateTimePicker from '@react-native-community/datetimepicker';

export default function OrderDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const navigation = useNavigation();

  const insets = useSafeAreaInsets();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [changingStatus, setChangingStatus] = useState(false);
  const [showWalletPicker, setShowWalletPicker] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [dueDate, setDueDate] = useState<Date | null>(null);

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [wallets, setWallets] = useState<OrderWallet[]>([]);
  const [images, setImages] = useState<OrderImage[]>([]);

  const populate = useCallback((data: Order) => {
    setOrder(data);
    setFirstName(data.first_name);
    setLastName(data.last_name);
    setPhone(data.phone ?? '');
    setEmail(data.email ?? '');
    setAddress(data.address);
    setNotes(data.notes ?? '');
    setWallets(data.order_wallets ?? []);
    setImages(data.order_images ?? []);
    setDueDate(data.due_date ? new Date(data.due_date) : null);
  }, []);

  const fetchOrder = useCallback(async () => {
    const { data, error } = await supabase
      .from('orders')
      .select('*, order_wallets(*), order_images(*)')
      .eq('id', id)
      .single();

    if (error || !data) {
      Alert.alert('Greška', 'Narudžbina nije pronađena.');
      router.back();
      return;
    }
    populate(data);
    setLoading(false);
  }, [id]);

  useEffect(() => {
    fetchOrder();
  }, [fetchOrder]);

  useEffect(() => {
    if (!order) return;
    navigation.setOptions({
      title: `${order.first_name} ${order.last_name}`,
      headerRight: () => (
        <TouchableOpacity onPress={handleDelete} hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}>
          <Text style={{ color: '#EF4444', fontSize: 15, fontWeight: '600', marginRight: 4 }}>
            Obriši
          </Text>
        </TouchableOpacity>
      ),
    });
  }, [order]);

  const handleStatusChange = async (newStatus: OrderStatus) => {
    if (!order || order.status === newStatus || changingStatus) return;
    setChangingStatus(true);
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', id);
      if (error) throw error;
      setOrder(prev => (prev ? { ...prev, status: newStatus } : prev));
    } catch (e: any) {
      Alert.alert('Greška', e.message);
    } finally {
      setChangingStatus(false);
    }
  };

  const handleSave = async () => {
    if (!firstName.trim() || !lastName.trim()) {
      Alert.alert('Obavezna polja', 'Ime i prezime su obavezni.');
      return;
    }

    setSaving(true);
    try {
      const { error: updateError } = await supabase
        .from('orders')
        .update({
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          phone: phone.trim() || null,
          email: email.trim() || null,
          address: address.trim(),
          notes: notes.trim() || null,
          due_date: dueDate ? dueDate.toISOString().split('T')[0] : null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id);
      if (updateError) throw updateError;

      await supabase.from('order_wallets').delete().eq('order_id', id);
      if (wallets.length > 0) {
        const { error: wErr } = await supabase
          .from('order_wallets')
          .insert(wallets.map(w => ({ category: w.category, model: w.model, quantity: w.quantity, order_id: id })));
        if (wErr) throw wErr;
      }

      const toInsert = [];
      for (const img of images) {
        if (img.local_uri && !img.id) {
          const url = await uploadOrderImage(img.local_uri, id);
          if (url) toInsert.push({ order_id: id, image_url: url });
        }
      }
      if (toInsert.length > 0) {
        await supabase.from('order_images').insert(toInsert);
      }

      Alert.alert('Sačuvano ✓', 'Narudžbina je uspešno izmenjena.', [
        { text: 'OK', onPress: () => router.replace('/') },
      ]);
    } catch (e: any) {
      Alert.alert('Greška', e.message ?? 'Nije moguće sačuvati izmene.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = () => {
    if (!order) return;
    Alert.alert(
      'Obriši narudžbinu',
      `Obrisati narudžbinu za ${order.first_name} ${order.last_name}? Ova akcija se ne može poništiti.`,
      [
        { text: 'Otkaži', style: 'cancel' },
        {
          text: 'Obriši',
          style: 'destructive',
          onPress: async () => {
            await supabase.from('orders').delete().eq('id', id);
            router.replace('/');
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  if (!order) return null;

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={[styles.content, { paddingBottom: 100 + insets.bottom }]}
        keyboardShouldPersistTaps="handled"
      >
        {/* Status */}
        <View style={styles.statusCard}>
          <Text style={styles.statusLabel}>Status narudžbine</Text>
          <StatusStepper
            status={order.status}
            onChange={handleStatusChange}
            loading={changingStatus}
          />
        </View>

        {/* Customer */}
        <SectionHeader title="Podaci o Mušteriji" />
        <View style={styles.row}>
          <Field label="Ime *" value={firstName} onChangeText={setFirstName} placeholder="Marko" style={{ flex: 1 }} />
          <Field label="Prezime *" value={lastName} onChangeText={setLastName} placeholder="Marković" style={{ flex: 1 }} />
        </View>
        <Field label="Telefon" value={phone} onChangeText={setPhone} placeholder="+381 60 123 4567" keyboardType="phone-pad" autoCapitalize="none" />
        <Field label="E-mail" value={email} onChangeText={setEmail} placeholder="marko@email.com" keyboardType="email-address" autoCapitalize="none" />
        <Field label="Adresa" value={address} onChangeText={setAddress} placeholder="Ulica i broj, Grad" />

        {/* Wallets */}
        <SectionHeader title="Novčanici" />
        {wallets.length > 0 && (
          <View style={styles.walletList}>
            {wallets.map((w, i) => (
              <View
                key={i}
                style={[styles.walletItem, i === wallets.length - 1 && { borderBottomWidth: 0 }]}
              >
                <View style={{ flex: 1 }}>
                  <Text style={styles.walletModel}>{w.model}</Text>
                  <Text style={styles.walletCat}>{w.category}</Text>
                </View>
                <Text style={styles.walletQty}>×{w.quantity}</Text>
              </View>
            ))}
          </View>
        )}
        <TouchableOpacity style={styles.addWalletBtn} onPress={() => setShowWalletPicker(true)}>
          <Text style={styles.addWalletText}>
            {wallets.length > 0 ? '✎  Izmeni novčanike' : '+  Dodaj novčanik'}
          </Text>
        </TouchableOpacity>

        {/* Due date */}
        <SectionHeader title="Rok izrade" />
        <TouchableOpacity style={styles.datePicker} onPress={() => setShowDatePicker(true)}>
          <Text style={styles.dateIcon}>📅</Text>
          <Text style={[styles.dateText, !dueDate && styles.datePlaceholder]}>
            {dueDate
              ? dueDate.toLocaleDateString('sr-RS', { day: '2-digit', month: 'long', year: 'numeric' })
              : 'Izaberi datum roka'}
          </Text>
          {dueDate && (
            <TouchableOpacity onPress={() => setDueDate(null)} hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}>
              <Text style={styles.dateClear}>✕</Text>
            </TouchableOpacity>
          )}
        </TouchableOpacity>
        {showDatePicker && (
          <DateTimePicker
            value={dueDate ?? new Date()}
            mode="date"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            minimumDate={new Date()}
            onChange={(event, date) => {
              setShowDatePicker(false);
              if (date) setDueDate(date);
            }}
          />
        )}

        {/* Notes */}
        <SectionHeader title="Napomena" />
        <TextInput
          style={styles.notesInput}
          value={notes}
          onChangeText={setNotes}
          placeholder="Boja, posebni zahtevi, dogovor sa kupcem..."
          multiline
          numberOfLines={4}
          textAlignVertical="top"
          placeholderTextColor={Colors.textLight}
        />

        {/* Images */}
        <SectionHeader title="Slike" />
        <ImageUpload orderId={id} images={images} onChange={setImages} />

        {order.created_at && (
          <Text style={styles.dateInfo}>
            Primljeno:{' '}
            {new Date(order.created_at).toLocaleDateString('sr-RS', {
              day: '2-digit',
              month: 'long',
              year: 'numeric',
            })}
          </Text>
        )}

      </ScrollView>

      <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 12 }]}>
        <TouchableOpacity
          style={[styles.saveBtn, saving && { opacity: 0.7 }]}
          onPress={handleSave}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.saveBtnText}>Potvrdi</Text>
          )}
        </TouchableOpacity>
      </View>

      <WalletPicker
        visible={showWalletPicker}
        onClose={() => setShowWalletPicker(false)}
        initialWallets={wallets}
        onConfirm={setWallets}
      />
    </KeyboardAvoidingView>
  );
}

function SectionHeader({ title }: { title: string }) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
    </View>
  );
}

interface FieldProps {
  label: string;
  value: string;
  onChangeText: (t: string) => void;
  placeholder?: string;
  keyboardType?: any;
  autoCapitalize?: any;
  style?: any;
}

function Field({ label, value, onChangeText, placeholder, keyboardType, autoCapitalize, style }: FieldProps) {
  return (
    <View style={[styles.fieldGroup, style]}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize ?? 'words'}
        placeholderTextColor={Colors.textLight}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: 16, paddingBottom: 48 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  statusCard: {
    backgroundColor: Colors.card,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  statusLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textMedium,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  datePicker: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 13,
    marginBottom: 4,
    gap: 10,
  },
  dateIcon: { fontSize: 18 },
  dateText: { flex: 1, fontSize: 15, color: Colors.textDark, fontFamily: 'YsabeauSC_400Regular' },
  datePlaceholder: { color: Colors.textLight },
  dateClear: { fontSize: 14, color: Colors.textLight, padding: 2 },
  row: { flexDirection: 'row', gap: 12 },
  sectionHeader: {
    marginTop: 24,
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
    paddingBottom: 6,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textMedium,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  fieldGroup: { marginBottom: 12 },
  fieldLabel: { fontSize: 12, fontWeight: '600', color: Colors.textMedium, marginBottom: 5 },
  input: {
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 15,
    color: Colors.textDark,
    fontFamily: 'YsabeauSC_500Medium',
  },
  walletList: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 10,
    overflow: 'hidden',
  },
  walletItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
  },
  walletModel: { fontSize: 15, fontWeight: '600', color: Colors.textDark },
  walletCat: { fontSize: 12, color: Colors.textLight, marginTop: 1 },
  walletQty: { fontSize: 15, fontWeight: '700', color: Colors.primary },
  addWalletBtn: {
    backgroundColor: Colors.card,
    borderWidth: 1.5,
    borderColor: Colors.primary,
    borderRadius: 10,
    paddingVertical: 13,
    alignItems: 'center',
    marginBottom: 4,
  },
  addWalletText: { fontSize: 14, fontWeight: '600', color: Colors.primary },
  notesInput: {
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 15,
    color: Colors.textDark,
    minHeight: 110,
    marginBottom: 8,
    fontFamily: 'YsabeauSC_500Medium',
  },
  dateInfo: {
    fontSize: 12,
    color: Colors.textLight,
    textAlign: 'center',
    marginTop: 20,
    marginBottom: 4,
  },
  bottomBar: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.divider,
  },
  saveBtn: {
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
  saveBtnText: { color: '#fff', fontSize: 16, fontWeight: '700', letterSpacing: 0.3 },
});
