import { Tabs } from 'expo-router';
import { colors } from '../../src/theme';
import { Icon } from '../../src/components';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function TabsLayout() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.dark.background }} edges={['top']}>
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
            tabBarIcon: ({ color, size }) => <Icon name="Home" size={size} color={color as string} />,
          }}
        />
        <Tabs.Screen
          name="explore"
          options={{
            title: 'Explorează',
            tabBarIcon: ({ color, size }) => <Icon name="Search" size={size} color={color as string} />,
          }}
        />
        <Tabs.Screen
          name="path"
          options={{
            title: 'Traseul meu',
            tabBarIcon: ({ color, size }) => <Icon name="Route" size={size} color={color as string} />,
          }}
        />
        <Tabs.Screen
          name="recommendations"
          options={{
            title: 'Recomandări',
            tabBarIcon: ({ color, size }) => <Icon name="Lightbulb" size={size} color={color as string} />,
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: 'Profil',
            tabBarIcon: ({ color, size }) => <Icon name="User" size={size} color={color as string} />,
          }}
        />
      </Tabs>
    </SafeAreaView>
  );
}
