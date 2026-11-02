import type { PropsWithChildren } from 'react';
import { StyleSheet, View } from 'react-native';
import { useSegments } from 'expo-router';
import { useJourney } from '@/providers/journey';
import { useTheme } from '@/hooks/use-theme';
import { BottomNavigation } from './bottom-navigation';
import { useAccountMode } from '@/providers/account-mode';

const appRoutes = new Set([
  'tutoring',
  '_tabs',
  'explore',
  'school',
  'specialization',
  'university',
  'program',
  'career',
  'course',
  'skill',
  'settings',
  'privacy-and-data',
  'data-export',
  'delete-account',
  'objective',
  'saved',
  'compare',
  'recommendations',
]);

export function NavigationFrame({ children }: PropsWithChildren) {
  const segments = useSegments();
  const { activeTab } = useJourney();
  const theme = useTheme();
  const { isTeacher, isPreview } = useAccountMode();
  return (
    <View style={[styles.frame, { backgroundColor: theme.background }]}>
      <View style={styles.frame}>{children}</View>
      {appRoutes.has(segments[0]) && (!isTeacher || isPreview) && (
        <BottomNavigation active={activeTab || 'explore'} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({ frame: { flex: 1 } });
