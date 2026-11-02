import { StyleSheet } from 'react-native';
import {
  PressableProps,
  TextStyle,
  ViewStyle,
  StyleProp,
  View,
} from 'react-native';
import { useTheme } from '@/hooks/use-theme';
import { spacing, radius, typography } from '@/theme/tokens';
import { useState, ReactNode } from 'react';
import { MotionPressable } from './motion';
import { AsciiLoading } from './ascii-loading';
import { AsciiSkinOverlay, AsciiElement } from './ascii-skin';
import { DecodingText as Text } from './decoding-text';
export type ButtonProps = Omit<PressableProps, 'style' | 'children'> & {
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  children?: ReactNode;
};
export const Button = ({
  variant = 'primary',
  size: _size = 'md',
  loading = false,
  disabled = false,
  fullWidth = false,
  children,
  style,
  textStyle,
  ...props
}: ButtonProps) => {
  const theme = useTheme();
  const [labelSize, setLabelSize] = useState({ width: 0, height: 0 });
  const primary = variant === 'primary';
  const color = primary ? theme.onAccent : theme.textPrimary;
  return (
    <AsciiElement>
      <MotionPressable
        {...props}
        accessibilityRole='button'
        accessibilityLabel={
          props.accessibilityLabel ||
          (typeof children === 'string' ? children : undefined)
        }
        aria-disabled={disabled || loading}
        aria-busy={loading}
        accessibilityState={{
          ...props.accessibilityState,
          disabled: disabled || loading,
          busy: loading,
        }}
        disabled={disabled || loading}
        style={({ pressed }) => [
          [
            uiStyles.s0,
            {
              minHeight: 48,
              borderRadius: radius.md,
              borderCurve: 'continuous',
              paddingVertical: spacing.md,
              paddingHorizontal: spacing.lg,
              backgroundColor: primary
                ? theme.accent
                : variant === 'secondary'
                  ? theme.surfaceElevated
                  : theme.surface,
              borderWidth: primary ? 0 : 1,
              borderColor: theme.border,
              ...(fullWidth && { width: '100%' }),
              opacity: disabled ? 0.45 : pressed ? 0.8 : 1,
            },
          ],
          style,
        ]}
      >
        <View
          onLayout={({ nativeEvent: { layout } }) => {
            const width = Math.ceil(layout.width),
              height = Math.ceil(layout.height);
            setLabelSize((previous) =>
              previous.width === width && previous.height === height
                ? previous
                : { width, height }
            );
          }}
          style={[uiStyles.label, loading && uiStyles.hidden]}
        >
          {typeof children === 'string' || typeof children === 'number' ? (
            <Text
              style={[typography.body, [uiStyles.s1, { color }], textStyle]}
            >
              {children}
            </Text>
          ) : (
            <View>{children}</View>
          )}
        </View>
        {loading && labelSize.width > 0 && (
          <View pointerEvents='none' style={uiStyles.busy}>
            <AsciiLoading
              compact
              width={labelSize.width}
              height={labelSize.height}
              color={color}
              decorative
            />
          </View>
        )}
        <AsciiSkinOverlay radius={radius.md} />
      </MotionPressable>
    </AsciiElement>
  );
};

const uiStyles = StyleSheet.create({
  s0: { alignItems: 'center', justifyContent: 'center' },
  s1: {
    fontWeight: '600',
    textAlign: 'center',
  },
  hidden: { opacity: 0 },
  label: { zIndex: 1 },
  busy: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
