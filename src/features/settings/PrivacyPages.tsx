import { Platform } from 'react-native';
import { useAppRouter as useRouter } from '@/hooks/use-app-router';
import { LockKeyhole, FileText, Download, Trash2 } from 'lucide-react-native';
import { BackHeader, Copy, Panel, Row, Screen } from '@/components/design';
import { privacyContent } from '@/constants/privacy-content';
import { ro } from '@/i18n/ro';
import { useTheme } from '@/hooks/use-theme';
import { useSession } from '@/providers/auth';

export function PrivacyLinks() {
  const router = useRouter();
  return (
    <>
      <Panel>
        <Row
          icon={LockKeyhole}
          title={ro.profile.privacyPolicy}
          onPress={() => router.push('/privacy')}
        />
        <Row
          icon={FileText}
          title={ro.profile.terms}
          onPress={() => router.push('/terms')}
        />
        <Row
          icon={Download}
          title={ro.profile.exportData}
          onPress={() => router.push('/data-export')}
        />
      </Panel>
      <Panel>
        <Row
          destructive
          icon={Trash2}
          title={ro.profile.deleteAccount}
          onPress={() => router.push('/delete-account')}
        />
      </Panel>
    </>
  );
}

export function PrivacyHub() {
  return (
    <Screen tab='profile' nativeTitle={ro.visual.privacy}>
      {Platform.OS !== 'ios' && <BackHeader title={ro.visual.privacy} />}
      <Copy>{ro.accountData.intro}</Copy>
      <PrivacyLinks />
    </Screen>
  );
}

export function PolicyPage({ kind }: { kind: 'privacy' | 'terms' }) {
  const theme = useTheme();
  const { session } = useSession();
  return (
    <Screen
      tab={session ? 'profile' : undefined}
      nativeTitle={
        kind === 'privacy' ? ro.profile.privacyPolicy : ro.profile.terms
      }
    >
      {Platform.OS !== 'ios' && (
        <BackHeader
          title={
            kind === 'privacy' ? ro.profile.privacyPolicy : ro.profile.terms
          }
        />
      )}
      <Copy kind='caption' style={{ color: theme.textSecondary }}>
        {privacyContent.updated}
      </Copy>
      {privacyContent[kind].map(({ title, body }) => (
        <Panel key={title}>
          <Copy kind='heading' accessibilityRole='header'>
            {title}
          </Copy>
          <Copy selectable>{body}</Copy>
        </Panel>
      ))}
    </Screen>
  );
}
