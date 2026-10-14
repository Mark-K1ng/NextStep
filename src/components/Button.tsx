import {
  Pressable,
  PressableProps,
  Text,
  View,
  TextStyle,
  ViewStyle,
  StyleProp,
} from "react-native";
import { useTheme } from "@/hooks/use-theme";
import { spacing, radius } from "@/theme/tokens";
import { ReactNode } from "react";

export type ButtonProps = Omit<PressableProps, "style" | "children"> & {
  variant?: "primary" | "secondary" | "outline";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  children?: ReactNode;
};

export const Button = ({
  variant = "primary",
  size = "md",
  loading = false,
  disabled = false,
  fullWidth = false,
  children,
  style,
  textStyle,
  ...props
}: ButtonProps) => {
  const theme = useTheme();

  const getButtonStyles = () => {
    const baseStyles: ViewStyle = {
      borderRadius: radius.md,
      paddingVertical:
        size === "sm" ? spacing.xs : size === "md" ? spacing.sm : spacing.md,
      paddingHorizontal:
        size === "sm" ? spacing.sm : size === "md" ? spacing.md : spacing.lg,
      ...(fullWidth && { width: "100%" }),
      alignItems: "center",
      justifyContent: "center",
    };

    if (disabled) {
      return {
        container: [
          baseStyles,
          { backgroundColor: theme.surfaceElevated, opacity: 0.5 },
          style,
        ],
        text: { color: theme.textSecondary, fontSize: size === "sm" ? 14 : 16 },
      };
    }

    if (loading) {
      return {
        container: [baseStyles, { backgroundColor: theme.primary }, style],
        text: { color: theme.background, fontSize: size === "sm" ? 14 : 16 },
      };
    }

    switch (variant) {
      case "primary":
        return {
          container: [baseStyles, { backgroundColor: theme.primary }, style],
          text: {
            color: "#FFFFFF",
            fontSize: size === "sm" ? 14 : 16,
            fontWeight: "600" as const,
          },
        };
      case "secondary":
        return {
          container: [
            baseStyles,
            { backgroundColor: theme.surfaceElevated },
            style,
          ],
          text: {
            color: theme.textPrimary,
            fontSize: size === "sm" ? 14 : 16,
            fontWeight: "600" as const,
          },
        };
      case "outline":
        return {
          container: [
            baseStyles,
            {
              backgroundColor: "transparent",
              borderWidth: 1,
              borderColor: theme.border,
            },
            style,
          ],
          text: {
            color: theme.textPrimary,
            fontSize: size === "sm" ? 14 : 16,
            fontWeight: "600" as const,
          },
        };
      default:
        return {
          container: [baseStyles, { backgroundColor: theme.primary }, style],
          text: { color: "#FFFFFF", fontSize: size === "sm" ? 14 : 16 },
        };
    }
  };

  const { container, text } = getButtonStyles();

  if (loading) {
    return (
      <View style={container}>
        <Text style={[text, textStyle, { fontSize: 12 }]}>{children}</Text>
      </View>
    );
  }

  return (
    <Pressable
      style={({ pressed }) => [container, pressed && { opacity: 0.8 }]}
      disabled={disabled}
      {...props}
    >
      {typeof children === "string" ? (
        <Text style={[text, textStyle]}>{children}</Text>
      ) : (
        children
      )}
    </Pressable>
  );
};
