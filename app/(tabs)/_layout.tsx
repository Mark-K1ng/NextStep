import { Tabs } from 'expo-router';
import { colors, spacing } from '../../src/theme';
import { Icon } from '../../src/components';
import { View, StyleSheet } from 'react-native';

export default function TabsLayout() {
  return (
    <View style={{ flex: 1, backgroundColor: colors.dark.background }}>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: colors.dark.primary,
          tabBarInactiveTintColor: colors.dark.textSecondary,
          tabBarStyle: {
            backgroundColor: colors.dark.surface,
            borderTopColor: colors.dark.border,
            paddingTop: spacing.sm,
            paddingBottom: spacing.sm,
            height: 65,
          },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: 'Acasă',
            tabBarIcon: ({ focused, color, size }) => (
              <View style={focused ? styles.activePill : styles.iconContainer}>
                <Icon name="Home" size={size} color={color as string} />
              </View>
            ),
          }}
        />
        <Tabs.Screen
          name="explore"
          options={{
            title: 'Explorează',
            tabBarIcon: ({ focused, color, size }) => (
              <View style={focused ? styles.activePill : styles.iconContainer}>
                <Icon name="Search" size={size} color={color as string} />
              </View>
            ),
          }}
        />
        <Tabs.Screen
          name="path"
          options={{
            title: 'Traseul meu',
            tabBarIcon: ({ focused, color, size }) => (
              <View style={focused ? styles.activePill : styles.iconContainer}>
                <Icon name="Route" size={size} color={color as string} />
              </View>
            ),
          }}
        />
        <Tabs.Screen
          name="recommendations"
          options={{
            title: 'Recomandări',
            tabBarIcon: ({ focused, color, size }) => (
              <View style={focused ? styles.activePill : styles.iconContainer}>
                <Icon name="Lightbulb" size={size} color={color as string} />
              </View>
            ),
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: 'Profil',
            tabBarIcon: ({ focused, color, size }) => (
              <View style={focused ? styles.activePill : styles.iconContainer}>
                <Icon name="User" size={size} color={color as string} />
              </View>
            ),
          }}
        />
      </Tabs>
    </View>
  );
}

const styles = StyleSheet.create({
  iconContainer: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  activePill: {
    backgroundColor: 'rgba(139, 92, 246, 0.15)',
    borderRadius: 12,
    // @ts-ignore - borderCurve is iOS 13+ only
    borderCurve: 'continuous',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
});
