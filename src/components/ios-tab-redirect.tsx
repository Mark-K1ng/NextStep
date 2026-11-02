import {
  Redirect,
  useLocalSearchParams,
  usePathname,
  type Href,
} from 'expo-router';
import { iosTabRoute } from '@/lib/ios-tab-route';
import { useJourney } from '@/providers/journey';
import { useAccountMode } from '@/providers/account-mode';
import Settings from '@/features/settings/Settings';
import PaletteEditor from '@/features/settings/PaletteEditor';
import { PrivacyHub } from '@/features/settings/PrivacyPages';
import {
  DataExportPage,
  DeleteAccountPage,
} from '@/features/settings/AccountDataPages';
import QuestionsAndAnswers from '@/features/settings/QuestionsAndAnswers';

/** Compatibility entry for existing deep links to protected root pages. */
export default function IosTabRedirect() {
  const pathname = usePathname();
  const params = useLocalSearchParams();
  const { activeTab } = useJourney();
  const { isTeacher, isPreview } = useAccountMode();
  if (isTeacher && !isPreview) {
    if (pathname === '/settings') {
      return <Settings />;
    }
    if (pathname === '/palette') {
      return <PaletteEditor />;
    }
    if (pathname === '/privacy-and-data') {
      return <PrivacyHub />;
    }
    if (pathname === '/data-export') {
      return <DataExportPage />;
    }
    if (pathname === '/delete-account') {
      return <DeleteAccountPage />;
    }
    if (pathname === '/qa') {
      return <QuestionsAndAnswers />;
    }
    return <Redirect href='/teacher/dashboard' />;
  }
  return (
    <Redirect href={iosTabRoute({ pathname, params } as Href, activeTab)} />
  );
}
