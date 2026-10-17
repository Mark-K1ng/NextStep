import { Stack } from 'expo-router';
import { View } from 'react-native';

export default function AuthLayout() {
  return (
    <View style={{ flex: 1, backgroundColor: '#18171F' }}>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: '#18171F' },
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="screens/personalization" />
        <Stack.Screen name="screens/register" />
        <Stack.Screen name="screens/login" />
        <Stack.Screen name="screens/forgot-password" />
        <Stack.Screen name="screens/reset-password" />
        <Stack.Screen name="screens/verify-email" />
      </Stack>
    </View>
  );
}
