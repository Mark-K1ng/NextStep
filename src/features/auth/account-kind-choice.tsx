import { View, StyleSheet } from 'react-native';
import { Copy } from '@/components/design';
import { MotionPressable } from '@/components/motion';
import { AsciiSkinOverlay } from '@/components/ascii-skin';
import { useTheme } from '@/hooks/use-theme';
import { spacing, radius } from '@/theme/tokens';

export type AccountKindIntent = 'student' | 'teacher';

export function AccountKindChoice({
  value,
  onChange,
  disabled = false,
}: {
  value: AccountKindIntent;
  onChange(value: AccountKindIntent): void;
  disabled?: boolean;
}) {
  const theme = useTheme();
  return (
    <View style={styles.choices}>
      {(
        [
          ['student', 'Elev / student'],
          ['teacher', 'Profesor'],
        ] as const
      ).map(([kind, label]) => (
        <MotionPressable
          key={kind}
          accessibilityRole='radio'
          accessibilityLabel={label}
          accessibilityState={{ checked: value === kind, disabled }}
          disabled={disabled}
          onPress={() => onChange(kind)}
          style={[
            styles.choice,
            {
              backgroundColor:
                value === kind ? theme.surfaceElevated : theme.surface,
              borderColor: value === kind ? theme.accentText : theme.border,
            },
          ]}
        >
          <Copy
            style={[
              styles.label,
              {
                color: value === kind ? theme.accentText : theme.textSecondary,
              },
            ]}
          >
            {label}
          </Copy>
          <AsciiSkinOverlay radius={radius.md} />
        </MotionPressable>
      ))}
    </View>
  );
}
const styles = StyleSheet.create({
  label: { textAlign: 'center' },
  choices: { flexDirection: 'row', gap: spacing.sm },
  choice: {
    flex: 1,
    minHeight: 48,
    justifyContent: 'center',
    padding: spacing.md,
    borderWidth: 1,
    borderRadius: radius.md,
    borderCurve: 'continuous',
  },
});
