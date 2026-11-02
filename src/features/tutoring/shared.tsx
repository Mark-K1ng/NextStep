import { Platform, StyleSheet, View } from 'react-native';
import type { PropsWithChildren } from 'react';
import { UserRound } from 'lucide-react-native';
import { Copy, Panel, Screen, BackHeader } from '@/components/design';
import { Button } from '@/components/Button';
import { useTheme } from '@/hooks/use-theme';
import { AsciiSkinOverlay } from '@/components/ascii-skin';
import { spacing as s, radius } from '@/theme/tokens';
import type { Tutor } from '@/types/tutoring';
import { money } from '@/lib/tutoring';
import { useAppRouter } from '@/hooks/use-app-router';

export function TutoringPage({
  title,
  children,
}: PropsWithChildren<{ title: string }>) {
  return (
    <Screen tab='tutoring' nativeTitle={title}>
      {Platform.OS !== 'ios' && <BackHeader title={title} />}
      {children}
    </Screen>
  );
}
export function Note({ children }: PropsWithChildren) {
  const theme = useTheme();
  return (
    <Copy kind='caption' style={{ color: theme.textSecondary }}>
      {children}
    </Copy>
  );
}
export function TutorCard({ tutor }: { tutor: Tutor }) {
  const router = useAppRouter();
  const theme = useTheme();
  return (
    <Panel>
      <View style={styles.row}>
        <View
          accessibilityElementsHidden
          style={[styles.avatar, { backgroundColor: theme.surfaceElevated }]}
        >
          <UserRound color={theme.accentText} size={24} />
          <AsciiSkinOverlay radius={radius.md} />
        </View>
        <View style={styles.flex}>
          <Copy kind='heading'>{tutor.display_name}</Copy>
          <Note>
            {tutor.subjects.map((subject) => subject.subject).join(' · ')}
          </Note>
        </View>
      </View>
      <Copy numberOfLines={2}>{tutor.biography}</Copy>
      <Note>
        {tutor.levels
          .map((level) =>
            level === 'student' ? 'Universitate' : `Clasa ${level}`
          )
          .join(' · ')}
      </Note>
      <View style={styles.row}>
        <Copy style={styles.flex}>
          {tutor.subjects.length > 0
            ? `De la ${money(Math.min(...tutor.subjects.map((subject) => subject.price_minor)))}/oră`
            : 'Preț indisponibil'}
        </Copy>
        <Note>
          {tutor.review_count
            ? `${tutor.rating} · ${tutor.review_count} recenzii`
            : 'Fără recenzii încă'}
        </Note>
      </View>
      <Note>
        {tutor.can_book && tutor.availability.length
          ? 'Vezi orele disponibile'
          : 'Rezervările nu sunt încă disponibile'}
      </Note>
      <Button
        variant='secondary'
        accessibilityLabel={`Vezi profilul profesorului ${tutor.display_name}`}
        onPress={() =>
          router.push({
            pathname: '/tutoring/tutor/[id]',
            params: { id: tutor.id },
          })
        }
      >
        Vezi profilul
      </Button>
    </Panel>
  );
}
export const styles = StyleSheet.create({
  flex: { flex: 1 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s.md,
    flexWrap: 'wrap',
  },
  stack: { gap: s.lg },
  compact: { gap: s.sm },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: s.sm },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: radius.md,
    borderCurve: 'continuous',
    alignItems: 'center',
    justifyContent: 'center',
  },
  utilityAction: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  separator: { height: s.lg },
  list: {
    padding: s.lg,
    gap: s.lg,
    maxWidth: 600,
    width: '100%',
    alignSelf: 'center',
  },
});
