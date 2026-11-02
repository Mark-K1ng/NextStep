import type { PropsWithChildren } from 'react';
import { StyleSheet } from 'react-native';
import { useSegments } from 'expo-router';
import { AsciiSkin } from './ascii-skin';
import { TAB_ASCII_REVEAL_MS } from '@/constants/tab-transition';

/** Web fallback; native platforms own their navigation timing in sibling files. */
export function TabAsciiReveal({
  tab,
  children,
}: PropsWithChildren<{ tab: string }>) {
  const segments: readonly string[] = useSegments();
  return (
    <AsciiSkin
      enabled={segments.includes(tab)}
      internal
      duration={TAB_ASCII_REVEAL_MS}
      startOnFrame
      style={styles.fill}
    >
      {children}
    </AsciiSkin>
  );
}
const styles = StyleSheet.create({ fill: { flex: 1 } });
