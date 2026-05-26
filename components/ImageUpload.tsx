import React, { useState } from 'react';
import {
  View,
  TouchableOpacity,
  Image,
  ScrollView,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import Text from './Text';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '../lib/supabase';
import { uploadOrderImage, deleteOrderImage } from '../lib/storage';
import { OrderImage } from '../lib/types';
import { Colors } from '../constants/colors';

interface Props {
  orderId?: string;
  images: OrderImage[];
  onChange: (images: OrderImage[]) => void;
}

export default function ImageUpload({ orderId, images, onChange }: Props) {
  const [uploading, setUploading] = useState(false);

  const pickImages = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Dozvola potrebna', 'Dozvoli pristup galeriji u podešavanjima telefona.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.8,
      allowsMultipleSelection: true,
    });

    if (result.canceled) return;

    if (orderId) {
      setUploading(true);
      try {
        const newImages: OrderImage[] = [...images];
        for (const asset of result.assets) {
          const url = await uploadOrderImage(asset.uri, orderId);
          if (url) {
            const { data } = await supabase
              .from('order_images')
              .insert({ order_id: orderId, image_url: url })
              .select()
              .single();
            if (data) newImages.push(data);
          }
        }
        onChange(newImages);
      } finally {
        setUploading(false);
      }
    } else {
      const queued: OrderImage[] = result.assets.map(a => ({
        image_url: a.uri,
        local_uri: a.uri,
      }));
      onChange([...images, ...queued]);
    }
  };

  const removeImage = (index: number) => {
    const img = images[index];
    Alert.alert('Ukloni sliku', 'Da li ste sigurni?', [
      { text: 'Otkaži', style: 'cancel' },
      {
        text: 'Ukloni',
        style: 'destructive',
        onPress: async () => {
          if (img.id) {
            await supabase.from('order_images').delete().eq('id', img.id);
          }
          if (!img.local_uri && img.image_url) {
            await deleteOrderImage(img.image_url);
          }
          onChange(images.filter((_, i) => i !== index));
        },
      },
    ]);
  };

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
    >
      {images.map((img, index) => (
        <View key={index} style={styles.imageWrapper}>
          <Image
            source={{ uri: img.local_uri || img.image_url }}
            style={styles.image}
          />
          <TouchableOpacity style={styles.removeBtn} onPress={() => removeImage(index)}>
            <Text style={styles.removeBtnText}>×</Text>
          </TouchableOpacity>
        </View>
      ))}
      <TouchableOpacity style={styles.addBtn} onPress={pickImages} disabled={uploading}>
        {uploading ? (
          <ActivityIndicator color={Colors.primary} />
        ) : (
          <>
            <Text style={styles.addBtnIcon}>+</Text>
            <Text style={styles.addBtnText}>Dodaj{'\n'}sliku</Text>
          </>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { gap: 10, paddingVertical: 4, paddingRight: 4 },
  imageWrapper: { position: 'relative', width: 90, height: 90 },
  image: {
    width: 90,
    height: 90,
    borderRadius: 10,
    backgroundColor: Colors.border,
  },
  removeBtn: {
    position: 'absolute',
    top: -6,
    right: -6,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#EF4444',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  removeBtnText: { color: '#fff', fontSize: 16, fontWeight: '700', lineHeight: 22 },
  addBtn: {
    width: 90,
    height: 90,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: Colors.border,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.inputBg,
    gap: 2,
  },
  addBtnIcon: { fontSize: 24, color: Colors.textMedium, lineHeight: 28 },
  addBtnText: { fontSize: 11, color: Colors.textLight, textAlign: 'center' },
});
