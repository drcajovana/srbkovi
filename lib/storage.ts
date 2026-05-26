import { supabase } from './supabase';

export async function uploadOrderImage(uri: string, orderId: string): Promise<string | null> {
  try {
    const ext = uri.split('.').pop()?.split('?')[0] ?? 'jpg';
    const fileName = `${Date.now()}.${ext}`;
    const path = `orders/${orderId}/${fileName}`;

    const response = await fetch(uri);
    const blob = await response.blob();

    const { error } = await supabase.storage
      .from('order-images')
      .upload(path, blob, { contentType: 'image/jpeg', upsert: false });

    if (error) throw error;

    const { data } = supabase.storage.from('order-images').getPublicUrl(path);
    return data.publicUrl;
  } catch (e) {
    console.error('Image upload error:', e);
    return null;
  }
}

export async function deleteOrderImage(imageUrl: string): Promise<void> {
  try {
    const path = imageUrl.split('/order-images/')[1];
    if (path) {
      await supabase.storage.from('order-images').remove([path]);
    }
  } catch (e) {
    console.error('Image delete error:', e);
  }
}
