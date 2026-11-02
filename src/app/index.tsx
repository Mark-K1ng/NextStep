import { RegistrationGate } from '@/components/registration-gate';
import { Platform } from 'react-native';
import { iosTabRoute } from '@/lib/ios-tab-route';
import { Redirect } from 'expo-router';
import { useSession } from '@/providers/auth';
import { needsProfileCompletion } from '@/lib/finish-auth';
import { usePersonalization } from '@/hooks/use-personalization';
import { useAccountMode } from '@/providers/account-mode';
import { EDUCATION_ROUTES_ENABLED } from '@/constants/education-rollout';
export default function Index() {
  const { session } = useSession();
  const personalization = usePersonalization();
  const account = useAccountMode();
  if (!session) {
    return <Redirect href='/(auth)/welcome' />;
  }
  if (!session.user.email_confirmed_at) {
    return <Redirect href='/(auth)/verify-email' />;
  }
  if (account.isPending || !account.access) {
    return null;
  }
  if (account.isTeacher && !account.isPreview) {
    return (
      <Redirect
        href={
          account.isApprovedTeacher
            ? '/teacher/dashboard'
            : '/teacher/application'
        }
      />
    );
  }
  if (account.isPreview) {
    return (
      <Redirect
        href={
          Platform.OS === 'ios'
            ? iosTabRoute('/_tabs/home', null)
            : '/_tabs/home'
        }
      />
    );
  }
  if (session.user.email_confirmed_at && needsProfileCompletion(session.user)) {
    return <Redirect href='/complete-profile' />;
  }
  if (
    session.user.email_confirmed_at &&
    session.user.user_metadata.nextstep_profile_pending
  ) {
    return <RegistrationGate user={session.user} />;
  }
  if (
    session.user.email_confirmed_at &&
    !EDUCATION_ROUTES_ENABLED &&
    personalization.data?.onboarding_required
  ) {
    return <Redirect href='/personalize' />;
  }
  return (
    <Redirect
      href={
        session.user.email_confirmed_at
          ? Platform.OS === 'ios'
            ? iosTabRoute('/_tabs/home', null)
            : '/_tabs/home'
          : '/(auth)/verify-email'
      }
    />
  );
}
