import { memo, useMemo, useRef, useState } from 'react';
import { AsciiActivity, AsciiProvider } from '@nextstep/ascii-reveal-native';
import {
  FlatList,
  Platform,
  StyleSheet,
  View,
  type FlatListProps,
} from 'react-native';
import { BackHeader, Copy, Screen } from '@/components/design';
import { Binary, Pause, Play } from 'lucide-react-native';
import { MotionPressable } from '@/components/motion';
import { Input } from '@/components/Input';
import { useTheme } from '@/hooks/use-theme';
import { useBottomSafeArea } from '@/hooks/use-bottom-safe-area';
import { useMotionPreference } from '@/providers/motion';
import { spacing as s } from '@/theme/tokens';
import { PreviewElementContent } from './loading-preview-elements';
import { PreviewElementSkin } from './loading-preview-shapes';
import {
  previewElements,
  type PreviewElement,
} from './loading-preview-catalogue';

const keyExtractor = (element: PreviewElement) => element[0];
const viewabilityConfig = { itemVisiblePercentThreshold: 1 };
const fold = (text: string) =>
  text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('ro');

const Element = memo(function ElementRow({
  element,
  active,
  loading,
}: {
  element: PreviewElement;
  active: boolean;
  loading: boolean;
}) {
  const theme = useTheme();
  const [id, category, title] = element;
  const content = useMemo(() => <PreviewElementContent id={id} />, [id]);
  return (
    <View style={[styles.element, { borderBottomColor: theme.border }]}>
      <Copy kind='caption' accessibilityRole='header'>
        {title}{' '}
        <Copy kind='label' style={{ color: theme.textSecondary }}>
          · {category}
        </Copy>
      </Copy>
      <View
        pointerEvents='none'
        accessibilityElementsHidden
        importantForAccessibility='no-hide-descendants'
      >
        <AsciiActivity active={active}>
          <PreviewElementSkin id={id} enabled={loading} active={active}>
            {content}
          </PreviewElementSkin>
        </AsciiActivity>
      </View>
    </View>
  );
});

/** Local specimens only. Never mount product screens, queries or extra navigators here. */
export default function LoadingPreview() {
  const theme = useTheme();
  const bottom = useBottomSafeArea();
  const reduced = useMotionPreference();
  const asciiTheme = useMemo(
    () => ({
      foreground: theme.textSecondary,
      accent: theme.accentText,
      background: theme.background,
    }),
    [theme.textSecondary, theme.accentText, theme.background]
  );
  const [still, setStill] = useState(false);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [visible, setVisible] = useState<ReadonlySet<string>>(
    () => new Set(['brand'])
  );
  const onViewableItemsChanged = useRef<
    NonNullable<FlatListProps<PreviewElement>['onViewableItemsChanged']>
  >(({ viewableItems }) => {
    const next = new Set(
      viewableItems
        .filter((item) => item.isViewable)
        .map((item) => item.item[0])
    );
    setVisible((previous) =>
      previous.size === next.size &&
      [...next].every((item) => previous.has(item))
        ? previous
        : next
    );
  }).current;
  const filtered = previewElements.filter((element) =>
    fold(element.join(' ')).includes(fold(search.trim()))
  );
  const controls = (
    <View style={styles.controls}>
      <MotionPressable
        accessibilityRole='button'
        accessibilityLabel={
          loading ? 'Arată elementele reale' : 'Arată textura ASCII'
        }
        accessibilityState={{ selected: loading }}
        onPress={() => setLoading((value) => !value)}
        style={({ pressed }) => [
          styles.circle,
          {
            backgroundColor: pressed ? theme.surfaceElevated : theme.surface,
            borderColor: loading ? theme.accentText : theme.border,
          },
        ]}
      >
        <Binary
          size={22}
          color={loading ? theme.accentText : theme.textSecondary}
        />
      </MotionPressable>
      <MotionPressable
        accessibilityRole='button'
        accessibilityLabel={
          reduced
            ? 'Animații oprite de setarea sistemului'
            : still
              ? 'Pornește animațiile'
              : 'Oprește animațiile'
        }
        accessibilityHint={
          reduced ? 'Mișcarea redusă este activată în sistem.' : undefined
        }
        accessibilityState={{ selected: !still && !reduced, disabled: reduced }}
        disabled={reduced}
        onPress={() => setStill((value) => !value)}
        style={({ pressed }) => [
          styles.circle,
          {
            backgroundColor: pressed ? theme.surfaceElevated : theme.surface,
            borderColor: !still && !reduced ? theme.accentText : theme.border,
          },
        ]}
      >
        {still || reduced ? (
          <Play size={22} color={theme.textSecondary} />
        ) : (
          <Pause size={22} color={theme.accentText} />
        )}
      </MotionPressable>
    </View>
  );
  return (
    <AsciiProvider reducedMotion={still || reduced} theme={asciiTheme}>
      <Screen
        nativeTitle='Animații ASCII'
        nativeActions={controls}
        bottomSafeArea='content'
        scrollable={false}
      >
        {Platform.OS !== 'ios' && (
          <View style={styles.toolbar}>
            <BackHeader title='Animații ASCII' trailing={controls} />
          </View>
        )}
        <FlatList
          data={filtered}
          keyExtractor={keyExtractor}
          renderItem={({ item }) => (
            <Element
              element={item}
              active={visible.has(item[0])}
              loading={loading}
            />
          )}
          extraData={{ visible, loading }}
          onViewableItemsChanged={onViewableItemsChanged}
          viewabilityConfig={viewabilityConfig}
          initialNumToRender={4}
          maxToRenderPerBatch={4}
          windowSize={21}
          removeClippedSubviews={false}
          keyboardShouldPersistTaps='handled'
          contentContainerStyle={[
            styles.content,
            { paddingBottom: s.lg + bottom.inset },
          ]}
          ListHeaderComponent={
            <View style={styles.header}>
              <Copy kind='caption' style={{ color: theme.textSecondary }}>
                Elemente individuale · exemple locale, neinteractive.
              </Copy>
              <Input
                variant='search'
                accessibilityLabel='Caută un element'
                placeholder='Caută un element'
                value={search}
                onChangeText={setSearch}
              />
              <Copy kind='caption' style={{ color: theme.textSecondary }}>
                {filtered.length} / {previewElements.length} elemente ·{' '}
                {loading ? 'Încărcare ASCII' : 'Aspect real'}
              </Copy>
            </View>
          }
          ListEmptyComponent={<Copy>Niciun element găsit.</Copy>}
          ListFooterComponent={
            <Copy kind='caption' style={{ color: theme.textSecondary }}>
              Ferestrele sistemului, navigarea nativă și hărțile externe se
              verifică în ecranele lor.
            </Copy>
          }
        />
      </Screen>
    </AsciiProvider>
  );
}
const styles = StyleSheet.create({
  content: { padding: s.lg },
  header: { gap: s.sm, paddingBottom: s.sm },
  controls: { flexDirection: 'row', gap: s.sm },
  toolbar: { paddingHorizontal: s.lg, paddingTop: s.lg, paddingBottom: s.sm },
  circle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  element: {
    gap: s.xs,
    paddingVertical: s.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
});
