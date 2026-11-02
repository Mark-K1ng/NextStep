import { renderAsciiScreen } from '@/components/route-ascii-reveal';
import { Stack } from 'expo-router';
import { useStackMotion } from '@/hooks/use-stack-motion';
export default function AuthLayout() {
  const stackMotion = useStackMotion();
  return (
    <Stack
      id={undefined}
      screenOptions={stackMotion}
      screenLayout={renderAsciiScreen}
    />
  );
}
