import { useTheme } from '@/hooks/use-theme';
import { useMotionPreference } from '@/providers/motion';

export function useStackMotion() {
  const theme = useTheme();
  const reduced = useMotionPreference();
  return {
    headerShown: false,
    contentStyle: { backgroundColor: theme.background },
    // Use each platform's paired native push/pop rather than an iOS imitation.
    animation: reduced ? ('fade' as const) : ('default' as const),
    gestureDirection: 'horizontal' as const,
    gestureEnabled: true,
  };
}
