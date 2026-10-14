import {
  TextInput,
  TextInputProps,
  Text,
  View,
  TextStyle,
  StyleProp,
  ViewStyle,
} from "react-native";
import { useTheme } from "@/hooks/use-theme";
import { spacing, radius } from "@/theme/tokens";

export type InputProps = TextInputProps & {
  label?: string;
  error?: string;
  containerStyle?: StyleProp<ViewStyle>;
};

export const Input = ({
  label,
  placeholder = "",
  error,
  secureTextEntry = false,
  multiline = false,
  autoCapitalize = "none",
  keyboardType = "default",
  returnKeyType = "default",
  style,
  containerStyle,
  ...props
}: InputProps) => {
  const theme = useTheme();

  const hasError = !!error;

  const inputStyles: TextStyle = {
    borderWidth: 1,
    borderColor: hasError ? theme.danger : theme.border,
    borderRadius: radius.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    backgroundColor: theme.surface,
    color: theme.textPrimary,
    fontSize: 16,
    ...(multiline && { minHeight: 80, textAlignVertical: "top" }),
  };

  return (
    <View style={containerStyle}>
      {label && (
        <Text
          style={{
            color: theme.textSecondary,
            marginBottom: spacing.xs,
            fontSize: 14,
          }}
        >
          {label}
        </Text>
      )}
      <TextInput
        style={[inputStyles, style]}
        placeholder={placeholder}
        placeholderTextColor={theme.textSecondary}
        secureTextEntry={secureTextEntry}
        multiline={multiline}
        autoCapitalize={autoCapitalize}
        keyboardType={keyboardType}
        returnKeyType={returnKeyType}
        {...props}
      />
      {error && (
        <Text
          style={{ color: theme.danger, marginTop: spacing.xs, fontSize: 12 }}
        >
          {error}
        </Text>
      )}
    </View>
  );
};
