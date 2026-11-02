import {
  AsciiSkeleton,
  type AsciiSkeletonProps,
} from '@nextstep/ascii-reveal-native';
import type { PropsWithChildren } from 'react';
import { StyleSheet, View } from 'react-native';
import { Panel } from './design';
import { ro } from '@/i18n/ro';
import { spacing as s } from '@/theme/tokens';

export type LoadingLayout =
  | 'text'
  | 'row'
  | 'catalogue'
  | 'profile'
  | 'home'
  | 'path'
  | 'form'
  | 'detail'
  | 'settings'
  | 'tutor'
  | 'lesson'
  | 'dashboard'
  | 'comparison'
  | 'recommendations';

/** Compose the same boxes as the eventual content; never substitute an unrelated demo card. */
export function LoadingShape(props: AsciiSkeletonProps) {
  return <AsciiSkeleton variant='dither' fontSize={10} decorative {...props} />;
}
const Bar = ({
  width = '70%',
  height = 16,
  seed = 1,
}: Pick<AsciiSkeletonProps, 'width' | 'height' | 'seed'>) => (
  <LoadingShape
    width={width}
    height={height}
    rows={Math.ceil(height / 10)}
    seed={seed}
  />
);
const Lines = ({
  widths = [1, 0.88, 0.6],
}: Pick<AsciiSkeletonProps, 'widths'>) => (
  <LoadingShape widths={widths} lines={widths.length} />
);
function Stack({ children }: PropsWithChildren) {
  return <View style={styles.stack}>{children}</View>;
}
function Row({ avatar = false }: { avatar?: boolean }) {
  return (
    <View style={[styles.row, styles.rowItem]}>
      <LoadingShape
        width={avatar ? 56 : 36}
        height={avatar ? 56 : 36}
        rows={avatar ? 6 : 4}
        circle={avatar}
      />
      <View style={styles.flex}>
        <Lines widths={[0.78, 0.52]} />
      </View>
    </View>
  );
}
function Pills() {
  return (
    <View style={styles.row}>
      {[64, 84, 56].map((width, seed) => (
        <LoadingShape
          key={width}
          width={width}
          height={28}
          rows={3}
          seed={seed + 3}
          style={styles.pill}
        />
      ))}
    </View>
  );
}
function Fields() {
  return (
    <Stack>
      {[0, 1, 2].map((seed) => (
        <View key={seed} style={styles.field}>
          <Bar width='38%' height={12} seed={seed} />
          <LoadingShape rows={5} height={48} seed={seed + 7} />
        </View>
      ))}
    </Stack>
  );
}
function Catalogue() {
  return (
    <Stack>
      {[0, 1, 2].map((seed) => (
        <Panel key={seed}>
          <View style={styles.row}>
            <View style={styles.flex}>
              <Lines widths={[0.88, 0.64, 0.46]} />
            </View>
            <LoadingShape rows={4} width={36} height={36} seed={seed + 9} />
          </View>
          <Pills />
        </Panel>
      ))}
    </Stack>
  );
}
function Contents({ layout }: { layout: LoadingLayout }) {
  switch (layout) {
    case 'catalogue':
      return <Catalogue />;
    case 'row':
      return (
        <Panel>
          <Row />
        </Panel>
      );
    case 'settings':
      return (
        <Panel>
          {[0, 1, 2, 3].map((i) => (
            <Row key={i} />
          ))}
        </Panel>
      );
    case 'profile':
      return (
        <Stack>
          <Row avatar />
          <Bar width='32%' height={12} />
          <Pills />
          <Bar width='36%' height={12} />
          <Panel>
            {[0, 1, 2, 3, 4, 5, 6].map((i) => (
              <Row key={i} />
            ))}
          </Panel>
        </Stack>
      );
    case 'home':
      return (
        <Stack>
          <Row />
          <Bar width='62%' height={24} />
          <Panel>
            <Row />
            <Lines widths={[0.88, 0.62]} />
            <Bar width='100%' height={48} />
          </Panel>
          <Panel>
            <Row />
            <Row />
          </Panel>
        </Stack>
      );
    case 'path':
      return (
        <Stack>
          <Panel>
            <Row />
            <Bar width='100%' height={8} />
          </Panel>
          <Bar width='42%' height={20} />
          <Panel>
            <Row />
            <Row />
            <Row />
          </Panel>
        </Stack>
      );
    case 'form':
      return (
        <Panel>
          <Fields />
          <Bar width='100%' height={48} />
        </Panel>
      );
    case 'detail':
      return (
        <Stack>
          <Bar width='90%' height={28} />
          <Lines widths={[0.55]} />
          <Pills />
          <Panel>
            <Bar width='48%' height={20} />
            <Lines />
            <Lines widths={[1, 0.95, 0.8]} />
          </Panel>
        </Stack>
      );
    case 'tutor':
      return (
        <Panel>
          <Row avatar />
          <Lines />
          <Lines widths={[0.6]} />
          <View style={styles.between}>
            <Bar width='42%' />
            <Bar width='32%' />
          </View>
          <Bar width='100%' height={48} />
        </Panel>
      );
    case 'lesson':
      return (
        <Panel>
          <Lines widths={[0.72, 0.52]} />
          <Pills />
          <Row />
          <Bar width='100%' height={48} />
        </Panel>
      );
    case 'dashboard':
      return (
        <Stack>
          <View style={styles.row}>
            {[0, 1].map((i) => (
              <View key={i} style={styles.flex}>
                <Panel>
                  <Bar width='45%' height={24} />
                  <Lines widths={[0.8]} />
                </Panel>
              </View>
            ))}
          </View>
          <Panel>
            <Row />
            <Row />
          </Panel>
        </Stack>
      );
    case 'comparison':
      return (
        <View style={styles.row}>
          {[0, 1].map((i) => (
            <View key={i} style={styles.flex}>
              <Panel>
                <Bar width='100%' height={24} />
                <Lines />
                <Lines />
              </Panel>
            </View>
          ))}
        </View>
      );
    case 'recommendations':
      return (
        <Panel>
          <Row />
          <Row />
          <Row />
        </Panel>
      );
    default:
      return (
        <Panel>
          <Lines widths={[0.78, 0.5]} />
        </Panel>
      );
  }
}
export function LoadingPlaceholder({
  layout = 'text',
  children,
}: PropsWithChildren<{ layout?: LoadingLayout }>) {
  return (
    <View
      accessible
      accessibilityRole='progressbar'
      accessibilityLabel={ro.common.loading}
      accessibilityState={{ busy: true }}
      style={styles.stack}
      pointerEvents='none'
    >
      {children ?? <Contents layout={layout} />}
    </View>
  );
}
const styles = StyleSheet.create({
  stack: { gap: s.lg },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s.md,
    flexWrap: 'wrap',
  },
  between: { flexDirection: 'row', justifyContent: 'space-between', gap: s.md },
  rowItem: { minHeight: 48 },
  flex: { flex: 1 },
  field: { gap: s.sm },
  pill: { borderRadius: 999, overflow: 'hidden' },
});
