import { useAppRouter as useRouter } from '@/hooks/use-app-router';
import { Compass } from 'lucide-react-native';
import { Brand, Copy, Panel, Row, Screen } from '@/components/design';
import { Button } from '@/components';
import { useSession } from '@/providers/auth';
import { ro } from '@/i18n/ro';
export default function NotFound() {
  const router = useRouter();
  const { session } = useSession();
  return (
    <Screen>
      <Brand />
      <Panel>
        <Row
          icon={Compass}
          title={ro.visual.pageMissing}
          subtitle={ro.visual.pageMissingHint}
        />
        <Copy kind='display'>404</Copy>
      </Panel>
      <Button
        onPress={() =>
          router.replace(session ? '/_tabs/home' : '/(auth)/welcome')
        }
      >
        {ro.visual.returnHome}
      </Button>
    </Screen>
  );
}
