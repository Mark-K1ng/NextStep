import { ReactNode } from 'react';
import { View } from 'react-native';
import { Slot } from 'expo-router';

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <View style={{ flex: 1, backgroundColor: '#fff' }}>
      <Slot />
    </View>
  );
}