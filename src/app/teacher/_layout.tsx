import { renderAsciiScreen } from '@/components/route-ascii-reveal';
import { Stack } from 'expo-router';
import { useStackMotion } from '@/hooks/use-stack-motion';

export default function TeacherLayout() {
  const options = useStackMotion();
  return (
    <Stack
      id={undefined}
      screenOptions={options}
      screenLayout={renderAsciiScreen}
    >
      <Stack.Screen name='(tabs)' />
      <Stack.Screen name='application' />
    </Stack>
  );
}
