import { Tabs } from 'expo-router';
import { colors } from '../../src/theme';

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.dark.primary,
        tabBarInactiveTintColor: colors.dark.textSecondary,
        tabBarStyle: {
          backgroundColor: colors.dark.surface,
          borderTopColor: colors.dark.border,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Acasă',
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: 'Explorează',
        }}
      />
      <Tabs.Screen
        name="path"
        options={{
          title: 'Traseul meu',
        }}
      />
      <Tabs.Screen
        name="recommendations"
        options={{
          title: 'Recomandări',
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profil',
        }}
      />
    </Tabs>
  );
}
