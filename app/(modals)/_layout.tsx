import { Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ModalsLayout() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#18171F' }} edges={[]}>
      <Stack
        screenOptions={{
          headerShown: false,
          presentation: 'card',
          contentStyle: { backgroundColor: '#18171F' },
        }}
      >
        <Stack.Screen name="detail" />
        <Stack.Screen name="saved" />
        <Stack.Screen name="search-results" />
        <Stack.Screen name="gap-analysis" />
        <Stack.Screen name="privacy-policy" />
        <Stack.Screen name="terms-of-service" />
      </Stack>
    </SafeAreaView>
  );
}
