import { View, ViewProps, ViewStyle, StyleSheet } from "react-native";
import { useTheme } from "@/hooks/use-theme";
import { spacing, radius } from "@/theme/tokens";

export type CardProps = ViewProps & {
  elevated?: boolean;
  fullBleed?: boolean;
};

export const Card = ({
  elevated = false,
  fullBleed = false,
  style,
  children,
  ...props
}: CardProps) => {
  const theme = useTheme();

  const containerStyles: ViewStyle = {
    backgroundColor: elevated ? theme.surfaceElevated : theme.surface,
    borderRadius: radius.md,
    overflow: "hidden",
    ...(elevated && {
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 2,
    }),
    ...(fullBleed && { borderRadius: 0 }),
    ...(style as ViewStyle),
  };

  return (
    <View style={[containerStyles]} {...props}>
      {children}
    </View>
  );
};
