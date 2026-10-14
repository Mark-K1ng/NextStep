import { darkColors, lightColors } from "@/theme";
import { useColorScheme } from "react-native";

export function useTheme() {
  const scheme = useColorScheme();
  const theme = scheme ?? "dark";
  return theme === "dark" ? darkColors : lightColors;
}
