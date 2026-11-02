import { Tabs, Redirect } from 'expo-router';
import type { ColorValue } from 'react-native';
import {
  CalendarDays,
  Clock,
  LayoutDashboard,
  UserRound,
} from 'lucide-react-native';
import { useAccountMode } from '@/providers/account-mode';
import { useTheme } from '@/hooks/use-theme';
import { DataState } from '@/components/data-state';
import { typography } from '@/theme/tokens';

export const unstable_settings = { initialRouteName: 'dashboard' };
type TabIconProps = { color: ColorValue; size: number };
function DashboardIcon({ color, size }: TabIconProps) {
  return <LayoutDashboard color={color} size={size} />;
}
function LessonsIcon({ color, size }: TabIconProps) {
  return <CalendarDays color={color} size={size} />;
}
function AvailabilityIcon({ color, size }: TabIconProps) {
  return <Clock color={color} size={size} />;
}
function ProfileIcon({ color, size }: TabIconProps) {
  return <UserRound color={color} size={size} />;
}

export default function TeacherTabs() {
  const account = useAccountMode();
  const theme = useTheme();
  if (account.isPending) {
    return <DataState loading />;
  }
  if (account.error) {
    return <DataState error retry={() => account.refresh()} />;
  }
  if (!account.isApprovedTeacher) {
    return <Redirect href='/teacher/application' />;
  }
  if (account.isPreview) {
    return <Redirect href='/' />;
  }
  return (
    <Tabs
      id={undefined}
      backBehavior='history'
      screenOptions={{
        headerShown: false,
        animation: 'none',
        tabBarActiveTintColor: theme.accentText,
        tabBarInactiveTintColor: theme.textSecondary,
        tabBarStyle: {
          backgroundColor: theme.surface,
          borderTopColor: theme.border,
        },
        tabBarLabelStyle: typography.label,
        sceneStyle: { backgroundColor: theme.background },
      }}
    >
      <Tabs.Screen
        name='dashboard'
        options={{
          title: 'Panou',
          tabBarIcon: DashboardIcon,
        }}
      />
      <Tabs.Screen
        name='lessons'
        options={{
          title: 'Ședințe',
          tabBarIcon: LessonsIcon,
        }}
      />
      <Tabs.Screen
        name='availability'
        options={{
          title: 'Disponibilitate',
          tabBarIcon: AvailabilityIcon,
        }}
      />
      <Tabs.Screen
        name='profile'
        options={{
          title: 'Profil',
          tabBarIcon: ProfileIcon,
        }}
      />
    </Tabs>
  );
}
