import { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Image, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as SplashScreen from 'expo-splash-screen';
import {
  useFonts,
  YsabeauSC_400Regular,
  YsabeauSC_500Medium,
  YsabeauSC_600SemiBold,
  YsabeauSC_700Bold,
} from '@expo-google-fonts/ysabeau-sc';
import { Colors } from '../constants/colors';

SplashScreen.preventAutoHideAsync();

const logo = require('../assets/logo.jpg');

function HeaderLogo() {
  return (
    <Image
      source={logo}
      style={{ width: 140, height: 46, resizeMode: 'contain' }}
    />
  );
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    YsabeauSC_400Regular,
    YsabeauSC_500Medium,
    YsabeauSC_600SemiBold,
    YsabeauSC_700Bold,
  });
  const [minTimePassed, setMinTimePassed] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setMinTimePassed(true), 1800);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (fontsLoaded && minTimePassed) SplashScreen.hideAsync();
  }, [fontsLoaded, minTimePassed]);

  if (!fontsLoaded || !minTimePassed) {
    return (
      <View style={{ flex: 1, backgroundColor: '#FFFFFF', justifyContent: 'center', alignItems: 'center' }}>
        <Image source={logo} style={{ width: 280, height: 94, resizeMode: 'contain' }} />
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StatusBar style="dark" />
        <Stack
          screenOptions={{
            headerStyle: { backgroundColor: '#FFFFFF' },
            headerTintColor: Colors.primary,
            headerTitleStyle: { fontWeight: '700', color: Colors.textDark },
            headerTitleAlign: 'center',
            contentStyle: { backgroundColor: Colors.background },
            headerShadowVisible: false,
          }}
        >
          <Stack.Screen
            name="index"
            options={{ headerTitle: () => <HeaderLogo /> }}
          />
          <Stack.Screen
            name="new"
            options={{ title: 'Nova Narudžbina', presentation: 'modal' }}
          />
          <Stack.Screen
            name="[id]"
            options={{ title: 'Narudžbina' }}
          />
          <Stack.Screen
            name="stats"
            options={{ title: 'Statistika' }}
          />
        </Stack>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
