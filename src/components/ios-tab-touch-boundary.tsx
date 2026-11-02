import { useLayoutEffect, useMemo, type PropsWithChildren } from 'react';
import { StyleSheet, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import {
  cancelAnimation,
  useSharedValue,
  type SharedValue,
} from 'react-native-reanimated';
import { attachIosTabTouchControl } from './ios-tab-context';

/** Observe interaction, then fail immediately so UIKit keeps owning its controls. */
export function IosTabTouchBoundary({ children }: PropsWithChildren) {
  const targets = useSharedValue<SharedValue<number>[]>([]);
  const control = useMemo(() => ({ targets }), [targets]);
  useLayoutEffect(() => attachIosTabTouchControl(control), [control]);
  const gesture = useMemo(
    () =>
      Gesture.Manual().onTouchesDown((_event, manager) => {
        // Interrupt only the visible reveal. Cached destinations stay prepared,
        // and the next native selection always starts its own timeline.
        for (const progress of targets.get()) {
          cancelAnimation(progress);
          progress.set(1);
        }
        manager.fail();
      }),
    [targets]
  );
  return (
    <GestureDetector gesture={gesture}>
      <View collapsable={false} style={styles.fill}>
        {children}
      </View>
    </GestureDetector>
  );
}
const styles = StyleSheet.create({ fill: { flex: 1 } });
