import { Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

/** Safe clearance belongs to scrolling content, never to a fixed iOS footer. */
export function useBottomSafeArea() {
  const insets = useSafeAreaInsets();
  const content = Platform.OS === 'ios';
  return { content, inset: content ? insets.bottom : 0 };
}
