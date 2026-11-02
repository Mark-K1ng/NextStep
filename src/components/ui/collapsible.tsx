import { SymbolView } from 'expo-symbols';
import { PropsWithChildren, useState } from 'react';
import { StyleSheet } from 'react-native';
import {
  MotionPressable as Pressable,
  MotionContent,
  MotionChevron,
} from '@/components/motion';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export function Collapsible({
  children,
  title,
}: PropsWithChildren & { title: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const theme = useTheme();

  return (
    <ThemedView>
      <Pressable
        feedback='highlight'
        accessibilityRole='button'
        accessibilityState={{ expanded: isOpen }}
        style={({ pressed }) => [
          styles.heading,
          pressed && styles.pressedHeading,
        ]}
        onPress={() => setIsOpen((value) => !value)}
      >
        <ThemedView type='surfaceElevated' style={styles.button}>
          <MotionChevron expanded={isOpen}>
            <SymbolView
              name={{
                ios: 'chevron.right',
                android: 'chevron_right',
                web: 'chevron_right',
              }}
              size={14}
              weight='bold'
              tintColor={theme.textPrimary}
              style={{ transform: [{ rotate: '90deg' }] }}
            />
          </MotionChevron>
        </ThemedView>

        <ThemedText type='small'>{title}</ThemedText>
      </Pressable>
      {isOpen && (
        <MotionContent>
          <ThemedView type='surfaceElevated' style={styles.content}>
            {children}
          </ThemedView>
        </MotionContent>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  heading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  pressedHeading: {
    opacity: 0.7,
  },
  button: {
    width: Spacing.four,
    height: Spacing.four,
    borderCurve: 'continuous',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    marginTop: Spacing.three,
    borderCurve: 'continuous',
    borderRadius: Spacing.three,
    marginLeft: Spacing.four,
    padding: Spacing.four,
  },
});
