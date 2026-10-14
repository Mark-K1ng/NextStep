import { NativeTabs } from "expo-router/unstable-native-tabs";

import { useTheme } from "@/hooks/use-theme";

export default function AppTabs() {
  const theme = useTheme();

  return (
    <NativeTabs
      backgroundColor={theme.background}
      indicatorColor={theme.surfaceElevated}
      labelStyle={{ selected: { color: theme.textPrimary } }}
    >
      <NativeTabs.Trigger name='_tabs/home'>
        <NativeTabs.Trigger.Label>Home</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          src={require("../assets/images/tabIcons/home.png")}
          renderingMode='template'
        />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name='_tabs/explore'>
        <NativeTabs.Trigger.Label>Explore</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          src={require("../assets/images/tabIcons/explore.png")}
          renderingMode='template'
        />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name='_tabs/path'>
        <NativeTabs.Trigger.Label>Traseul meu</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          src={require("../assets/images/tabIcons/path.png")}
          renderingMode='template'
        />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name='_tabs/recommendations'>
        <NativeTabs.Trigger.Label>Recomandări</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          src={require("../assets/images/tabIcons/recommendations.png")}
          renderingMode='template'
        />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name='_tabs/profile'>
        <NativeTabs.Trigger.Label>Profil</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          src={require("../assets/images/tabIcons/profile.png")}
          renderingMode='template'
        />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
