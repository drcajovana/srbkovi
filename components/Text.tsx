import React from 'react';
import { Text as RNText, TextProps, StyleSheet } from 'react-native';

const weightToFont: Record<string, string> = {
  '100': 'YsabeauSC_100Thin',
  '200': 'YsabeauSC_200ExtraLight',
  '300': 'YsabeauSC_300Light',
  '400': 'YsabeauSC_400Regular',
  'normal': 'YsabeauSC_400Regular',
  '500': 'YsabeauSC_500Medium',
  '600': 'YsabeauSC_600SemiBold',
  '700': 'YsabeauSC_700Bold',
  'bold': 'YsabeauSC_700Bold',
  '800': 'YsabeauSC_800ExtraBold',
  '900': 'YsabeauSC_900Black',
};

export default function Text({ style, ...props }: TextProps) {
  const flat = StyleSheet.flatten(style);
  const weight = String(flat?.fontWeight ?? '500');
  const fontFamily = weightToFont[weight] ?? 'YsabeauSC_500Medium';
  return <RNText style={[{ fontFamily }, style]} {...props} />;
}
