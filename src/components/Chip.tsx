import {
  View,
  ViewProps,
  ViewStyle,
  Text,
  TextStyle,
  StyleProp,
} from "react-native";
import { useTheme } from "@/hooks/use-theme";
import { spacing, radius } from "@/theme/tokens";

export type ChipProps = Omit<ViewProps, "style"> & {
  variant?: "primary" | "secondary" | "outline";
  size?: "xs" | "sm" | "md";
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
};

export const Chip = ({
  variant = "primary",
  size = "md",
  style,
  textStyle,
  children,
  ...props
}: ChipProps) => {
  const theme = useTheme();

  const getChipStyles = () => {
    const isSmall = size === "xs" || size === "sm";
    const baseStyles: ViewStyle = {
      borderRadius:
        size === "xs" ? radius.xs : size === "sm" ? radius.sm : radius.md,
      paddingVertical:
        size === "xs" ? 2 : size === "sm" ? spacing.xs : spacing.sm,
      paddingHorizontal:
        size === "xs" ? spacing.xs : size === "sm" ? spacing.sm : spacing.md,
      alignSelf: "flex-start",
    };

    switch (variant) {
      case "primary":
        return {
          container: [baseStyles, { backgroundColor: theme.primary }, style],
          text: { color: theme.background, fontSize: isSmall ? 12 : 14 },
        };
      case "secondary":
        return {
          container: [
            baseStyles,
            { backgroundColor: theme.surfaceElevated },
            style,
          ],
          text: { color: theme.textPrimary, fontSize: isSmall ? 12 : 14 },
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
          text: { color: theme.textPrimary, fontSize: isSmall ? 12 : 14 },
        };
      default:
        return {
          container: [baseStyles, { backgroundColor: theme.primary }, style],
          text: { color: theme.background, fontSize: isSmall ? 12 : 14 },
        };
    }
  };

  const { container, text } = getChipStyles();

  return (
    <View style={container} {...props}>
      {typeof children === "string" ? (
        <Text style={[text, textStyle]}>{children}</Text>
      ) : (
        children
      )}
    </View>
  );
};
