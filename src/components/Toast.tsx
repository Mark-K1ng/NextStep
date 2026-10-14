import {
  View,
  ViewProps,
  ViewStyle,
  Text,
  TextProps,
  StyleSheet,
} from "react-native";
import { useTheme } from "@/hooks/use-theme";
import { spacing, radius } from "@/theme/tokens";

export type ToastProps = ViewProps & {
  message: string;
  type?: "success" | "error" | "warning" | "info";
  visible: boolean;
  onHide?: () => void;
};

export const Toast = ({
  message,
  type = "info",
  visible,
  onHide,
  style,
  ...props
}: ToastProps) => {
  if (!visible) {
    return null;
  }

  const theme = useTheme();

  const getToastStyles = () => {
    let backgroundColor = theme.surfaceElevated;
    let textColor = theme.textPrimary;

    switch (type) {
      case "success":
        backgroundColor = theme.success;
        textColor = theme.background;
        break;
      case "error":
        backgroundColor = theme.danger;
        textColor = theme.background;
        break;
      case "warning":
        backgroundColor = theme.warning;
        textColor = theme.background;
        break;
      case "info":
        backgroundColor = theme.primary;
        textColor = theme.background;
        break;
    }

    return {
      container: [
        {
          backgroundColor,
          borderRadius: radius.md,
          paddingVertical: spacing.sm,
          paddingHorizontal: spacing.md,
          ...(style as ViewStyle),
        },
      ],
      text: { color: textColor },
    };
  };

  const { container, text } = getToastStyles();

  return (
    <View style={[container]} {...props}>
      <Text style={[text]}>{message}</Text>
    </View>
  );
};
