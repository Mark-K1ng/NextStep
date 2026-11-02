import { Tabs } from 'expo-router';
import { Platform } from 'react-native';
import { BottomNavigation } from './bottom-navigation';
import { useTheme } from '@/hooks/use-theme';
import { ro } from '@/i18n/ro';
type NavigationBarProps = {
  state: { index: number; routes: { name: string }[] };
};
function NavigationBar({ state }: NavigationBarProps) {
  const name = state.routes[state.index].name.split('/')[0];
  const active =
    name === 'recommendations'
      ? 'path'
      : name === 'home' ||
          name === 'tutoring' ||
          name === 'explore' ||
          name === 'path' ||
          name === 'profile'
        ? name
        : 'home';
  return <BottomNavigation active={active} />;
}
// Router invokes this as a render callback; React must render the component.
function renderNavigationBar(props: NavigationBarProps) {
  if (Platform.OS === 'android') {
    return null;
  }
  return <NavigationBar {...props} />;
}
export default function AppTabs() {
  const theme = useTheme();
  return (
    <Tabs
      id={undefined}
      backBehavior='fullHistory'
      tabBar={renderNavigationBar}
      screenOptions={{
        headerShown: false,
        animation: 'none',
        sceneStyle: { backgroundColor: theme.background },
      }}
    >
      <Tabs.Screen name='home/index' options={{ title: ro.visual.homeTab }} />
      <Tabs.Screen name='tutoring/index' options={{ title: 'Meditații' }} />
      <Tabs.Screen name='explore/index' options={{ title: ro.explore.title }} />
      <Tabs.Screen name='path/index' options={{ title: ro.myPath.title }} />
      <Tabs.Screen name='profile/index' options={{ title: ro.profile.title }} />
      <Tabs.Screen name='recommendations/index' options={{ href: null }} />
      <Tabs.Protected guard={false}>
        <Tabs.Screen name='(home)' />
        <Tabs.Screen name='(tutoring)' />
        <Tabs.Screen name='(explore)' />
        <Tabs.Screen name='(path)' />
        <Tabs.Screen name='(profile)' />
      </Tabs.Protected>
    </Tabs>
  );
}
