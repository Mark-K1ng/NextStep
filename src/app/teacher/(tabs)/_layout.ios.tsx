import { Redirect } from 'expo-router';
import { NativeTabs } from 'expo-router/native-tabs';
import { useAccountMode } from '@/providers/account-mode';
import { useTheme } from '@/hooks/use-theme';
import { typography } from '@/theme/tokens';
import { DataState } from '@/components/data-state';

export const unstable_settings = { initialRouteName: 'dashboard' };

export default function TeacherNativeTabs() {
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
    <NativeTabs
      tintColor={theme.accentText}
      backgroundColor={theme.surface}
      minimizeBehavior='never'
      labelStyle={{
        default: { ...typography.label, color: theme.textSecondary },
        selected: { ...typography.label, color: theme.accentText },
      }}
    >
      <NativeTabs.Trigger name='dashboard' disableAutomaticContentInsets>
        <NativeTabs.Trigger.Icon sf='square.grid.2x2' />
        <NativeTabs.Trigger.Label>Panou</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name='lessons' disableAutomaticContentInsets>
        <NativeTabs.Trigger.Icon sf='calendar' />
        <NativeTabs.Trigger.Label>Ședințe</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name='availability' disableAutomaticContentInsets>
        <NativeTabs.Trigger.Icon sf='clock' />
        <NativeTabs.Trigger.Label>Disponibilitate</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name='profile' disableAutomaticContentInsets>
        <NativeTabs.Trigger.Icon sf='person.crop.circle' />
        <NativeTabs.Trigger.Label>Profil</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
