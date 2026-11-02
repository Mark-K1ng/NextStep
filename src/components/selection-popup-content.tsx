import { useEffect, useState } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import {
  useSelectionPopupContent,
  useSelectionPopupControls,
} from '@/providers/selection-popup';
import { useTheme } from '@/hooks/use-theme';
import { spacing as s, radius } from '@/theme/tokens';

export function SelectionPopupContent() {
  const popup = useSelectionPopupContent();
  const { finish } = useSelectionPopupControls();
  const [height, setHeight] = useState(0);
  const theme = useTheme();
  const handleHeight = Platform.OS === 'android' ? s.xl : 0;
  const id = popup?.id;
  useEffect(
    () => () => {
      if (id) {
        finish(id);
      }
    },
    [id, finish]
  );
  return (
    <View
      style={[styles.container, { backgroundColor: theme.surface }]}
      onLayout={(event) => setHeight(event.nativeEvent.layout.height)}
    >
      {Platform.OS === 'android' && (
        <View style={styles.handleArea} accessible={false}>
          <View
            style={[styles.handle, { backgroundColor: theme.textSecondary }]}
          />
        </View>
      )}
      {popup && height > 0
        ? popup.render(Math.max(0, height - handleHeight))
        : null}
    </View>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1 },
  handleArea: { height: s.xl, alignItems: 'center', justifyContent: 'center' },
  handle: { width: s['2xl'], height: s.xs, borderRadius: radius.full },
});
