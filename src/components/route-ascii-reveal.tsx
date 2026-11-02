import { useState, type PropsWithChildren } from 'react';
import { Platform, StyleSheet } from 'react-native';
import { useIsFocused } from 'expo-router';
import { AsciiSkin, useAsciiSkinAnimation } from './ascii-skin';
import { TAB_ASCII_REVEAL_MS } from '@/constants/tab-transition';

/** One shared reveal on every screen entry, with cached children preserved. */
export function RouteAsciiReveal({
  children,
  tabRoot = false,
}: PropsWithChildren<{ tabRoot?: boolean }>) {
  const focused = useIsFocused();
  const parent = useAsciiSkinAnimation();
  const [entry, setEntry] = useState({ focused, inherit: tabRoot });
  if (entry.focused !== focused) {
    // A tab selection borrows the timeline already started by UIKit. Returning
    // from a detail has a settled parent, so the screen owns a fresh reveal.
    setEntry({
      focused,
      inherit:
        !focused || !(parent?.completion?.current ?? parent?.finished ?? true),
    });
  }
  const borrow =
    tabRoot &&
    (entry.inherit ||
      (parent?.preparedNativeTab &&
        !(parent.completion?.current ?? parent.finished)));
  return (
    <AsciiSkin
      enabled={focused}
      internal
      inherit={!!borrow}
      retainPreparedParent={!!borrow}
      initialProgress={Platform.OS === 'ios' ? 0.25 : 0}
      prepareOnBlur
      retainLayers={Platform.OS === 'ios'}
      replayOnFocus
      duration={TAB_ASCII_REVEAL_MS}
      style={styles.fill}
    >
      {children}
    </AsciiSkin>
  );
}

// Keep the callback stable so navigator updates never remount the screen.
export function renderAsciiScreen({
  children,
  route,
}: PropsWithChildren<{ route?: { name: string } }>) {
  // These routes host their own navigators; the visible leaf owns the reveal.
  if (
    route &&
    ['_tabs', '(auth)', 'teacher', 'tutoring', '(tabs)'].includes(route.name)
  ) {
    return <>{children}</>;
  }
  return (
    <RouteAsciiReveal tabRoot={route?.name === 'index'}>
      {children}
    </RouteAsciiReveal>
  );
}

const styles = StyleSheet.create({ fill: { flex: 1 } });
