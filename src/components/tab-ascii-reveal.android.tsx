import type { PropsWithChildren } from 'react';
import { StyleSheet } from 'react-native';
import { useIsFocused } from 'expo-router';
import { AsciiSkin } from './ascii-skin';
import { TAB_ASCII_REVEAL_MS } from '@/constants/tab-transition';

/** Prepare cached surfaces offscreen; start playback at focus without a frame wait. */
export function TabAsciiReveal({
  children,
}: PropsWithChildren<{ tab: string }>) {
  const focused = useIsFocused();
  return (
    <AsciiSkin
      enabled={focused}
      internal
      prepareOnBlur
      duration={TAB_ASCII_REVEAL_MS}
      style={styles.fill}
    >
      {children}
    </AsciiSkin>
  );
}
const styles = StyleSheet.create({ fill: { flex: 1 } });
