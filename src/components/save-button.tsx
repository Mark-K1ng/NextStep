import { StyleSheet } from 'react-native';
import { useRef, useState } from 'react';
import { Bookmark } from 'lucide-react-native';
import { useSaved } from '@/providers/saved';
import { useTheme } from '@/hooks/use-theme';
import { ro } from '@/i18n/ro';
import type { ExploreItem } from '@/types/models';
import { MotionPressable, StateFeedback } from './motion';
import { useToast } from '@/providers/toast';
import { useAccountMode } from '@/providers/account-mode';
export function SaveButton({ item }: { item: ExploreItem }) {
  const { isTeacher } = useAccountMode();
  const { items, ready, toggle } = useSaved();
  const theme = useTheme();
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  const running = useRef(false);
  const saved = items.some(
    (value) => value.id === item.id && value.type === item.type
  );
  return (
    <MotionPressable
      disabled={!ready || busy || isTeacher}
      accessibilityRole='button'
      aria-pressed={saved}
      accessibilityLabel={`${saved ? ro.visual.unsaveOption : ro.visual.saveOption}: ${item.name || item.title || ''}`}
      accessibilityState={{
        selected: saved,
        disabled: !ready || busy || isTeacher,
        busy,
      }}
      onPress={async () => {
        if (running.current) {
          return;
        }
        running.current = true;
        setBusy(true);
        try {
          const selected = await toggle(item);
          if (selected !== undefined) {
            toast(
              selected ? ro.visual.bookmarkSaved : ro.visual.bookmarkRemoved,
              selected ? 'success' : 'removed'
            );
          }
        } finally {
          running.current = false;
          setBusy(false);
        }
      }}
      style={({ pressed }) => [uiStyles.s0, { opacity: pressed ? 0.7 : 1 }]}
    >
      <StateFeedback value={saved}>
        <Bookmark
          size={22}
          color={saved ? theme.accentText : theme.textSecondary}
          fill={saved ? theme.accentText : 'none'}
        />
      </StateFeedback>
    </MotionPressable>
  );
}

const uiStyles = StyleSheet.create({
  s0: {
    minWidth: 48,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
