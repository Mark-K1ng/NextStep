import { StyleSheet, View } from 'react-native';
import { Copy } from '@/components/design';
import { useTheme } from '@/hooks/use-theme';
import { spacing, radius } from '@/theme/tokens';

/** Shows position in the questionnaire, rather than a score or completion claim. */
export function QuestionnaireHeading({
  position,
  total,
  title,
  limit,
}: {
  position: number;
  total: number;
  title: string;
  limit: number;
}) {
  const theme = useTheme();
  return (
    <View style={{ gap: spacing.lg }}>
      <View style={{ gap: spacing.sm }}>
        <View style={questionnaireStyles.metadata}>
          <View style={questionnaireStyles.position}>
            <Copy kind='caption'>{`Întrebarea ${position} din ${total}`}</Copy>
          </View>
          <Copy kind='caption' style={{ color: theme.textSecondary }}>
            Opțional
          </Copy>
        </View>
        <View
          accessible
          accessibilityRole='progressbar'
          accessibilityLabel='Poziția în chestionar'
          accessibilityValue={{ min: 1, max: total, now: position }}
          style={questionnaireStyles.track}
        >
          {Array.from({ length: total }, (_, index) => (
            <View
              key={index}
              style={[
                questionnaireStyles.segment,
                {
                  backgroundColor:
                    index < position ? theme.accent : theme.border,
                },
              ]}
            />
          ))}
        </View>
      </View>
      <View style={{ gap: spacing.sm }}>
        <Copy kind='title'>{title}</Copy>
        <Copy kind='caption' style={{ color: theme.textSecondary }}>
          {limit === 1
            ? 'Alege o variantă sau sari întrebarea.'
            : `Alege până la ${limit} variante sau sari întrebarea.`}
        </Copy>
      </View>
    </View>
  );
}

export const questionnaireStyles = StyleSheet.create({
  position: { flexGrow: 1, flexBasis: 180 },
  metadata: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: spacing.xs,
  },
  track: { flexDirection: 'row', gap: spacing.xs },
  segment: { flex: 1, height: spacing.xs, borderRadius: radius.full },
  quietButton: { backgroundColor: 'transparent', borderWidth: 0 },
});
