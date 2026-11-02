import { useContext, type PropsWithChildren } from 'react';
import { IosAppearingTabContext } from './ios-tab-context';
import { StyleSheet } from 'react-native';
import { useIsFocused } from 'expo-router';
import { AsciiSkin } from './ascii-skin';
import { TAB_ASCII_REVEAL_MS } from '@/constants/tab-transition';

/** Match the owned tab, never use the active segment to choose its content. */
export function TabAsciiReveal({
  tab,
  children,
}: PropsWithChildren<{ tab: string }>) {
  // Native focus changes before Router publishes its global segment snapshot.
  const focused = useIsFocused();
  const appearingTab = useContext(IosAppearingTabContext);
  const active = appearingTab === null ? focused : appearingTab === tab;
  return (
    <AsciiSkin
      enabled={active}
      nativeTab={tab}
      internal
      duration={TAB_ASCII_REVEAL_MS}
      startOnFrame={false}
      initialProgress={0.25}
      prepareOnBlur
      style={styles.fill}
    >
      {children}
    </AsciiSkin>
  );
}

const styles = StyleSheet.create({ fill: { flex: 1 } });
