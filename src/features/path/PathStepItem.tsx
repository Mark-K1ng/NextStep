import { StyleSheet, View } from 'react-native';
import { Check, ChevronDown, Trash2 } from 'lucide-react-native';
import { Copy } from '@/components/design';
import { AsciiSkinOverlay } from '@/components/ascii-skin';
import { Button } from '@/components';
import {
  MotionChevron,
  MotionContent,
  MotionLayout,
  MotionPressable,
} from '@/components/motion';
import { useTheme } from '@/hooks/use-theme';
import { ro } from '@/i18n/ro';
import { radius, spacing as s, typography } from '@/theme/tokens';
import type { PathStep } from '@/types/models';

export function PathStepItem({
  step,
  index,
  expanded,
  saving,
  disabled,
  onToggle,
  onOpen,
  onFinish,
  onRemove,
}: {
  step: PathStep;
  index: number;
  expanded: boolean;
  saving: boolean;
  disabled: boolean;
  onToggle(): void;
  onOpen(): void;
  onFinish(): void;
  onRemove?(): void;
}) {
  const theme = useTheme();
  const done = step.status === 'completed';
  const name = step.name || step.title || ro.common.notAvailable;
  const status = done
    ? ro.myPath.status.completed
    : step.status === 'in_progress'
      ? ro.myPath.status.inProgress
      : ro.myPath.status.notStarted;
  return (
    <MotionLayout>
      <MotionPressable
        feedback='highlight'
        accessibilityRole='button'
        accessibilityLabel={`${index + 1}. ${name}. ${status}`}
        accessibilityState={{ expanded }}
        onPress={onToggle}
        style={styles.header}
      >
        <View
          accessibilityElementsHidden
          importantForAccessibility='no-hide-descendants'
          style={[
            styles.marker,
            {
              backgroundColor: done
                ? theme.success + '26'
                : expanded
                  ? theme.accent + '26'
                  : theme.surfaceElevated,
            },
          ]}
        >
          {done ? (
            <Check size={16} color={theme.successText} />
          ) : (
            <Copy
              kind='caption'
              style={{
                color: expanded ? theme.accentText : theme.textSecondary,
              }}
            >
              {index + 1}
            </Copy>
          )}
          <AsciiSkinOverlay radius={radius.md} />
        </View>
        <View style={styles.summary}>
          <Copy style={styles.name}>{name}</Copy>
          <Copy
            kind='caption'
            style={{ color: done ? theme.successText : theme.textSecondary }}
          >
            {status}
          </Copy>
        </View>
        <MotionChevron expanded={expanded}>
          <ChevronDown size={20} color={theme.textSecondary} />
        </MotionChevron>
      </MotionPressable>
      {expanded && (
        <MotionContent animateExit={false} style={styles.actions}>
          <View style={styles.textActions}>
            {step.refId && (
              <Button
                variant={done ? 'secondary' : 'primary'}
                onPress={onOpen}
                style={styles.compactButton}
                textStyle={typography.caption}
              >
                {ro.refinement.viewPathStep[step.type]}
              </Button>
            )}
            {!done && (
              <Button
                variant='outline'
                loading={saving}
                disabled={disabled}
                onPress={onFinish}
                style={styles.compactButton}
                textStyle={typography.caption}
              >
                {ro.visual.markDone}
              </Button>
            )}
          </View>
          {onRemove && (
            <MotionPressable
              accessibilityRole='button'
              accessibilityLabel={`Șterge pasul: ${name}`}
              accessibilityHint='Elimină pasul din Traseu. Opțiunea rămâne în Salvate.'
              accessibilityState={{ disabled, busy: saving }}
              disabled={disabled}
              onPress={onRemove}
              style={[styles.remove, disabled && styles.disabled]}
            >
              <Trash2 size={20} color={theme.dangerText} />
            </MotionPressable>
          )}
        </MotionContent>
      )}
    </MotionLayout>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s.md,
    minHeight: 48,
  },
  marker: {
    minWidth: 24,
    minHeight: 24,
    paddingHorizontal: s.xs,
    paddingVertical: 2,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  summary: { flex: 1, gap: s.xs },
  name: { fontWeight: '600' },
  actions: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: s.sm,
    paddingTop: s.sm,
  },
  textActions: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'flex-start',
    gap: s.sm,
  },
  compactButton: {
    alignSelf: 'flex-start',
    maxWidth: '100%',
    paddingHorizontal: s.md,
  },
  remove: {
    width: 48,
    height: 48,
    flexShrink: 0,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabled: { opacity: 0.45 },
});
