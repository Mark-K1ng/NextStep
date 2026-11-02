import { Platform, StyleSheet } from 'react-native';
import { useState } from 'react';
import { TextInputProps, View, StyleProp, ViewStyle } from 'react-native';
import { MotionPressable as Pressable } from './motion';
import { Eye, EyeOff, LockKeyhole, Mail, Search, X } from 'lucide-react-native';
import { useTheme } from '@/hooks/use-theme';
import { spacing as s, radius, typography } from '@/theme/tokens';
import { ro } from '@/i18n/ro';
import { NavigationSurface } from './navigation-surface';
import { AsciiSkinOverlay, AsciiElement } from './ascii-skin';
import { DecodingText as Text } from './decoding-text';
import { DecodingInput as TextInput } from './decoding-input';
export type InputProps = TextInputProps & {
  variant?: 'default' | 'search';
  label?: string;
  error?: string;
  containerStyle?: StyleProp<ViewStyle>;
  material?: 'solid' | 'navigation';
  suffix?: string;
  size?: 'md' | 'sm';
};
export const Input = ({
  variant = 'default',
  label,
  placeholder = '',
  error,
  secureTextEntry = false,
  multiline = false,
  autoCapitalize = 'none',
  style,
  containerStyle,
  material = 'solid',
  suffix,
  size = 'md',
  ...props
}: InputProps) => {
  const theme = useTheme();
  const [visible, setVisible] = useState(false);
  const [focused, setFocused] = useState(false);
  const glass = material === 'navigation' && Platform.OS === 'ios';
  const Icon = secureTextEntry
    ? LockKeyhole
    : props.keyboardType === 'email-address'
      ? Mail
      : variant === 'search'
        ? Search
        : null;
  return (
    <AsciiElement>
      <View style={[{ gap: s.sm }, containerStyle]}>
        {label && (
          <Text style={[typography.caption, { color: theme.textPrimary }]}>
            {label}
          </Text>
        )}
        <View
          style={[
            uiStyles.s0,
            {
              borderColor: error
                ? theme.danger
                : focused
                  ? theme.accent
                  : theme.border,
              borderRadius: glass
                ? radius.full
                : variant === 'search'
                  ? radius.lg
                  : radius.md,
              backgroundColor: theme.surface,
              paddingHorizontal: s.md,
            },
            glass && uiStyles.glassInput,
          ]}
        >
          {glass && (
            <NavigationSurface
              pointerEvents='none'
              accessible={false}
              style={[
                StyleSheet.absoluteFill,
                { borderRadius: radius.full, backgroundColor: theme.surface },
              ]}
            />
          )}
          {Icon && (
            <Icon
              size={20}
              color={theme.textSecondary}
              style={{ marginRight: s.md }}
            />
          )}
          <TextInput
            {...props}
            hitSlop={
              props.hitSlop ??
              (size === 'sm' ? { top: s.xs, bottom: s.xs } : undefined)
            }
            accessibilityLabel={
              props.accessibilityLabel || label || placeholder
            }
            returnKeyType={
              variant === 'search' ? 'search' : props.returnKeyType
            }
            style={[
              typography.body,
              [
                uiStyles.s1,
                {
                  color: theme.textPrimary,
                  paddingVertical: s.sm,
                  ...(multiline && {
                    minHeight: 96,
                    textAlignVertical: 'top' as const,
                  }),
                },
              ],
              style,
              size === 'sm' && [typography.caption, uiStyles.compactInput],
            ]}
            placeholder={placeholder}
            placeholderTextColor={theme.textSecondary}
            secureTextEntry={secureTextEntry && !visible}
            multiline={multiline}
            autoCapitalize={autoCapitalize}
            onFocus={(event) => {
              setFocused(true);
              props.onFocus?.(event);
            }}
            onBlur={(event) => {
              setFocused(false);
              props.onBlur?.(event);
            }}
          />
          {!!suffix && (
            <Text
              accessible={false}
              importantForAccessibility='no'
              pointerEvents='none'
              style={[
                typography.caption,
                uiStyles.suffix,
                { color: theme.textSecondary },
              ]}
            >
              {suffix}
            </Text>
          )}
          {variant === 'search' && !!props.value && (
            <Pressable
              accessibilityRole='button'
              accessibilityLabel={ro.common.clear}
              onPress={() => props.onChangeText?.('')}
              style={uiStyles.s2}
            >
              <X size={20} color={theme.textSecondary} />
            </Pressable>
          )}
          {secureTextEntry && (
            <Pressable
              accessibilityRole='button'
              accessibilityLabel={
                visible ? ro.visual.hidePassword : ro.visual.showPassword
              }
              onPress={() => setVisible(!visible)}
              style={uiStyles.s2}
            >
              {visible ? (
                <EyeOff size={20} color={theme.textSecondary} />
              ) : (
                <Eye size={20} color={theme.textSecondary} />
              )}
            </Pressable>
          )}
          <AsciiSkinOverlay
            radius={
              glass ? radius.full : variant === 'search' ? radius.lg : radius.md
            }
          />
        </View>
        {error && (
          <Text
            accessibilityRole='alert'
            style={[typography.caption, { color: theme.dangerText }]}
          >
            {error}
          </Text>
        )}
      </View>
    </AsciiElement>
  );
};

const uiStyles = StyleSheet.create({
  compactInput: { minHeight: 40 },
  suffix: { flexShrink: 0 },
  glassInput: { backgroundColor: 'transparent' },
  s0: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderCurve: 'continuous',
  },
  s1: { flex: 1, minWidth: 0, minHeight: 48 },
  s2: {
    minWidth: 48,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
