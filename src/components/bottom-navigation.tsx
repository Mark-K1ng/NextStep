import { View, StyleSheet, Text, Platform } from 'react-native';
import type { LayoutRectangle } from 'react-native';
import { useEffect, useRef, useState, type PropsWithChildren } from 'react';
import {
  type SharedValue,
  useSharedValue,
  withSpring,
  cancelAnimation,
  useAnimatedReaction,
} from 'react-native-reanimated';
import {
  GestureDetector,
  GestureStateManager,
  usePanGesture,
} from 'react-native-gesture-handler';
import { scheduleOnRN, scheduleOnUI } from 'react-native-worklets';
import { MotionPressable as Pressable } from './motion';
import {
  Home,
  NotebookPen,
  Compass,
  Route,
  CircleUserRound,
} from 'lucide-react-native';
import { useAppRouter as useRouter } from '@/hooks/use-app-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme } from '@/hooks/use-theme';
import { typography, spacing as s } from '@/theme/tokens';
import { ro } from '@/i18n/ro';
import { useJourney } from '@/providers/journey';
import { NavigationSurface } from './navigation-surface';
import { NavigationPill } from './navigation-pill';
import { useMotionPreference } from '@/providers/motion';

const pillWidth = 48;
const pillHeight = 28;
const tabIds = ['home', 'tutoring', 'explore', 'path', 'profile'] as const;

function NavigationTrack({
  layouts,
  active,
  dragOwnsTouch,
  onSelect,
  onPreview,
  children,
}: PropsWithChildren<{
  layouts: Record<string, LayoutRectangle>;
  active: (typeof tabIds)[number];
  dragOwnsTouch: SharedValue<boolean>;
  onSelect(index: number): void;
  onPreview(index: number): void;
}>) {
  const reduced = useMotionPreference();
  const theme = useTheme();
  const layout = layouts[active];
  // Route changes retarget the pill; native releases start it immediately.
  const target = layout ? layout.x + (layout.width - pillWidth) / 2 : 0;
  const stops = tabIds.map((id) => {
    const slot = layouts[id];
    return slot ? slot.x + (slot.width - pillWidth) / 2 : 0;
  });
  const ready = tabIds.every((id) => !!layouts[id]);
  const barStart = layouts.home?.x ?? 0;
  const segmentWidth = ready
    ? (layouts.profile.x + layouts.profile.width - barStart) / tabIds.length
    : 1;
  function segmentAt(left: number) {
    'worklet';
    return Math.max(
      0,
      Math.min(
        tabIds.length - 1,
        Math.floor((left + pillWidth / 2 - barStart) / segmentWidth)
      )
    );
  }
  const initialized = useRef(false);
  const x = useSharedValue(target);
  const start = useSharedValue(target);
  const touchPrepared = useSharedValue(false);
  const dragging = useSharedValue(false);
  const destination = useSharedValue(target);
  const pending = useSharedValue(-1);
  const tapped = useSharedValue(-1);
  useEffect(() => {
    pending.set(-1);
  }, [active, pending]);
  useAnimatedReaction(
    () => (dragging.get() && ready ? segmentAt(x.get()) : pending.get()),
    (next, previous) => {
      // React only updates when crossing a segment boundary, never per frame.
      if (next !== previous) {
        scheduleOnRN(onPreview, next);
      }
    }
  );
  useEffect(() => {
    if (!layout) {
      return;
    }
    if (!initialized.current) {
      initialized.current = true;
      x.set(target);
      destination.set(target);
      return;
    }
    // Reading shared values on JS blocks until the UI thread responds. Keep
    // the ownership check and spring retarget together on the UI runtime.
    scheduleOnUI(() => {
      if (
        dragging.get() ||
        pending.get() >= 0 ||
        (!reduced && destination.get() === target)
      ) {
        return;
      }
      destination.set(target);
      x.set(
        reduced
          ? target
          : withSpring(target, {
              duration: 240,
              dampingRatio: 1,
              overshootClamping: true,
            })
      );
    });
  }, [target, reduced, x, layout, dragging, destination, pending]);
  const pan = usePanGesture({
    enabled: Platform.OS === 'android' && ready,
    activeOffsetX: [-4, 4],
    shouldCancelWhenOutside: false,
    maxPointers: 1,
    onTouchesDown: (event) => {
      dragOwnsTouch.set(false);
      touchPrepared.set(false);
      tapped.set(-1);
      const touch = event.allTouches[0];
      // A press on any tab can become a drag, even after moving above the bar.
      if (
        event.numberOfTouches !== 1 ||
        !touch ||
        touch.x < barStart ||
        touch.x > layouts.profile.x + layouts.profile.width ||
        touch.y < (layout?.y ?? 0) ||
        touch.y > (layout?.y ?? 0) + (layout?.height ?? 0)
      ) {
        GestureStateManager.fail(event.handlerTag);
        return;
      }
      // Preserve the grab offset on the visible pill. A different tab starts
      // from its own center, independent of how far the preview spring got.
      start.set(
        touch.x >= x.get() && touch.x <= x.get() + pillWidth
          ? x.get()
          : stops[segmentAt(touch.x - pillWidth / 2)]
      );
      touchPrepared.set(true);
      tapped.set(segmentAt(touch.x - pillWidth / 2));
    },
    onTouchesUp: () => {
      // Native release owns taps as well as drags: no JS -> UI -> JS round trip.
      const selected = tapped.get();
      if (dragOwnsTouch.get() || !touchPrepared.get() || selected < 0) {
        return;
      }
      tapped.set(-1);
      const end = stops[selected];
      pending.set(selected === tabIds.indexOf(active) ? -1 : selected);
      destination.set(end);
      x.set(
        reduced
          ? end
          : withSpring(end, {
              duration: 240,
              dampingRatio: 1,
              overshootClamping: true,
            })
      );
      if (selected !== tabIds.indexOf(active)) {
        scheduleOnRN(onSelect, selected);
      }
    },
    onTouchesCancel: () => {
      tapped.set(-1);
      touchPrepared.set(false);
    },
    onActivate: (event) => {
      dragOwnsTouch.set(true);
      cancelAnimation(x);
      if (!touchPrepared.get()) {
        start.set(x.get());
      }
      dragging.set(true);
      x.set(
        Math.max(
          stops[0],
          Math.min(stops[tabIds.length - 1], start.get() + event.translationX)
        )
      );
    },
    onUpdate: (event) => {
      x.set(
        Math.max(
          stops[0],
          Math.min(stops[tabIds.length - 1], start.get() + event.translationX)
        )
      );
    },
    onDeactivate: (event) => {
      let selected = tabIds.indexOf(active);
      // A normal lift commits the preview, even if the finger drifted vertically.
      if (!event.canceled) {
        selected = segmentAt(x.get());
      }
      const end = stops[selected];
      // Keep the release preview until Router commits the newly selected tab.
      pending.set(selected === tabIds.indexOf(active) ? -1 : selected);
      dragging.set(false);
      destination.set(end);
      x.set(
        reduced
          ? end
          : withSpring(end, {
              duration: 240,
              dampingRatio: 1,
              overshootClamping: true,
              velocity: event.velocityX,
            })
      );
      if (selected !== tabIds.indexOf(active)) {
        scheduleOnRN(onSelect, selected);
      }
    },
    onFinalize: () => {
      touchPrepared.set(false);
      if (!dragging.get()) {
        return;
      }
      dragging.set(false);
      pending.set(-1);
      destination.set(target);
      x.set(
        reduced
          ? target
          : withSpring(target, {
              duration: 240,
              dampingRatio: 1,
              overshootClamping: true,
            })
      );
    },
  });
  return (
    <GestureDetector gesture={pan}>
      <View collapsable={false} style={styles.items}>
        {layout && (
          <NavigationPill
            x={x}
            top={layout.y}
            width={pillWidth}
            height={pillHeight}
            color={theme.accent + '26'}
          />
        )}
        {children}
      </View>
    </GestureDetector>
  );
}

export function BottomNavigation({
  active,
}: {
  active: 'home' | 'tutoring' | 'explore' | 'path' | 'profile';
}) {
  const router = useRouter();
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const journey = useJourney();
  const [layouts, setLayouts] = useState<Record<string, LayoutRectangle>>({});
  const [preview, setPreview] = useState(-1);
  const [pressPreview, setPressPreview] = useState(-1);
  const held = useRef(false);
  const physicalTouch = useRef(false);
  const touchHandled = useRef(false);
  const dragOwnsTouch = useSharedValue(false);
  const resetPressTimer = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined
  );
  const clearPressTimer = () => {
    if (resetPressTimer.current !== undefined) {
      clearTimeout(resetPressTimer.current);
      resetPressTimer.current = undefined;
    }
  };
  useEffect(() => {
    if (!held.current) {
      setPressPreview(-1);
    }
  }, [active]);
  useEffect(
    () => () => {
      if (resetPressTimer.current !== undefined) {
        clearTimeout(resetPressTimer.current);
      }
    },
    []
  );
  const beginPress = (index: number) => {
    clearPressTimer();
    held.current = true;
    setPreview(-1);
    setPressPreview(index);
  };
  const endPress = () => {
    // Press-out also means leaving the button while the finger is still down.
    // Only touch-end/cancel ends that interaction, including outside the bar.
    if (physicalTouch.current || touchHandled.current) {
      return;
    }
    held.current = false;
    clearPressTimer();
    // Pressable sends onPressOut before onPress. A successful release cancels
    // this reset; cancellation restores the current tab without navigation.
    resetPressTimer.current = setTimeout(() => {
      resetPressTimer.current = undefined;
      setPressPreview(-1);
    }, 0);
  };
  const highlighted =
    preview >= 0
      ? tabIds[preview]
      : pressPreview >= 0
        ? tabIds[pressPreview]
        : active;
  const tabs = [
    { id: 'home', title: ro.visual.homeTab, icon: Home, path: '/_tabs/home' },
    {
      id: 'tutoring',
      title: 'Meditații',
      icon: NotebookPen,
      path: '/_tabs/tutoring',
    },
    {
      id: 'explore',
      title: ro.explore.title,
      icon: Compass,
      path: '/_tabs/explore',
    },
    { id: 'path', title: ro.myPath.title, icon: Route, path: '/_tabs/path' },
    {
      id: 'profile',
      title: ro.profile.title,
      icon: CircleUserRound,
      path: '/_tabs/profile',
    },
  ] as const;
  return (
    <NavigationSurface
      onLayout={(event) =>
        journey.setBarHeight(event.nativeEvent.layout.height)
      }
      style={[
        styles.bar,
        {
          backgroundColor: theme.surface,
          borderTopColor: theme.border,
          paddingBottom:
            Platform.OS === 'web'
              ? (`max(${s.lg}px, env(safe-area-inset-bottom, 0px))` as unknown as number)
              : Math.max(insets.bottom, s.xs),
        },
      ]}
    >
      <NavigationTrack
        layouts={layouts}
        active={active}
        dragOwnsTouch={dragOwnsTouch}
        onSelect={(index) => router.navigate(tabs[index].path)}
        onPreview={setPreview}
      >
        {tabs.map(({ id, title, icon: Icon, path }, index) => (
          <Pressable
            feedback='highlight'
            key={id}
            accessibilityRole='tab'
            accessibilityLabel={title}
            accessibilityState={{ selected: active === id }}
            aria-selected={active === id}
            onLayout={({ nativeEvent: { layout } }) => {
              setLayouts((previous) => {
                const old = previous[id];
                return old?.x === layout.x &&
                  old?.y === layout.y &&
                  old?.width === layout.width &&
                  old?.height === layout.height
                  ? previous
                  : { ...previous, [id]: layout };
              });
            }}
            onPressIn={
              Platform.OS === 'android' ? () => beginPress(index) : undefined
            }
            onPressOut={Platform.OS === 'android' ? endPress : undefined}
            onTouchStart={
              Platform.OS === 'android'
                ? () => {
                    clearPressTimer();
                    physicalTouch.current = true;
                    touchHandled.current = false;
                    dragOwnsTouch.set(false);
                  }
                : undefined
            }
            onTouchEnd={
              Platform.OS === 'android'
                ? () => {
                    physicalTouch.current = false;
                    held.current = false;
                    clearPressTimer();
                    touchHandled.current = true;
                    // The native gesture already dispatches release. Only use
                    // Pressable as a fallback before its tab slots are measured.
                    if (!tabIds.every((tab) => !!layouts[tab])) {
                      router.navigate(path);
                    }
                    resetPressTimer.current = setTimeout(() => {
                      resetPressTimer.current = undefined;
                      touchHandled.current = false;
                    }, 0);
                  }
                : undefined
            }
            onTouchCancel={
              Platform.OS === 'android'
                ? () => {
                    physicalTouch.current = false;
                    held.current = false;
                    clearPressTimer();
                    setPressPreview(-1);
                  }
                : undefined
            }
            onPress={() => {
              if (Platform.OS === 'android') {
                if (physicalTouch.current || touchHandled.current) {
                  return;
                }
                clearPressTimer();
                held.current = false;
                setPressPreview(id === active ? -1 : index);
              }
              router.navigate(path);
            }}
            style={({ pressed }) => [
              styles.tab,
              { opacity: pressed ? 0.7 : 1 },
            ]}
          >
            <View style={styles.icon}>
              <Icon
                size={24}
                color={
                  highlighted === id ? theme.accentText : theme.textSecondary
                }
              />
            </View>
            <Text
              numberOfLines={1}
              maxFontSizeMultiplier={1.3}
              style={[
                typography.label,
                styles.label,
                {
                  color:
                    highlighted === id ? theme.accentText : theme.textSecondary,
                },
              ]}
            >
              {id === 'path' ? ro.refinement.pathTab : title}
            </Text>
          </Pressable>
        ))}
      </NavigationTrack>
    </NavigationSurface>
  );
}
const styles = StyleSheet.create({
  bar: { borderTopWidth: 1, paddingTop: s.xs },
  // Icon slots and the moving pill share an origin, below the bar's border/padding.
  items: { flexDirection: 'row' },
  tab: { flex: 1, minWidth: 0, alignItems: 'center', gap: 0, minHeight: 48 },
  label: { includeFontPadding: false },
  icon: {
    width: pillWidth,
    height: pillHeight,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
