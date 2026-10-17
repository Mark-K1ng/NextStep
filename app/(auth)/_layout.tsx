import { Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function AuthLayout() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#18171F' }} edges={['top', 'bottom']}>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: '#18171F' },
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="register" />
        <Stack.Screen name="login" />
        <Stack.Screen name="forgot-password" />
        <Stack.Screen name="reset-password" />
        <Stack.Screen name="verify-email" />
      </Stack>
    </SafeAreaView>
  );
}
