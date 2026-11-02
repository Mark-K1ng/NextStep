import { squircle } from '@/theme/tokens';
import { StyleSheet } from 'react-native';
import { View } from 'react-native';
import { useAppRouter as useRouter } from '@/hooks/use-app-router';
import {
  Compass,
  Layers,
  Route,
  GraduationCap,
  Eye,
} from 'lucide-react-native';
import { Button } from '@/components';
import { Brand, Copy, Panel, Row, Screen } from '@/components/design';
import { useTheme } from '@/hooks/use-theme';
import { ro } from '@/i18n/ro';
import { spacing as s } from '@/theme/tokens';
import { Reveal } from '@/components/motion';

export default function Welcome() {
  const router = useRouter();
  const theme = useTheme();
  const copy = ro.visual.welcome;
  return (
    <Screen auth>
      <Brand />
      <Reveal>
        <Panel>
          <View
            style={[
              uiStyles.s0,
              {
                gap: s.sm,
                backgroundColor: theme.accent + '26',
                ...squircle,
                borderRadius: s.lg,
                paddingHorizontal: s.md,
                paddingVertical: s.sm,
              },
            ]}
          >
            <GraduationCap size={16} color={theme.accentText} />
            <Copy kind='label' style={{ color: theme.accentText }}>
              {copy.badge}
            </Copy>
          </View>
          <Copy kind='display'>{copy.title}</Copy>
          <Copy style={[uiStyles.s1, { color: theme.textSecondary }]}>
            {copy.subtitle}
          </Copy>
          <Panel>
            <Reveal order={1}>
              <Row
                compact
                icon={Compass}
                title={copy.discover}
                subtitle={copy.discoverHint}
              />
            </Reveal>
            <Reveal order={2}>
              <Row
                compact
                icon={Layers}
                title={copy.compare}
                subtitle={copy.compareHint}
              />
            </Reveal>
            <Reveal order={3}>
              <Row
                compact
                icon={Route}
                title={copy.path}
                subtitle={copy.pathHint}
              />
            </Reveal>
          </Panel>
        </Panel>
      </Reveal>
      <Button size='lg' onPress={() => router.push('/(auth)/onboarding/2')}>
        {copy.start}
      </Button>
      <Button
        variant='secondary'
        onPress={() =>
          router.push({
            pathname: '/(auth)/register',
            params: { accountKind: 'teacher' },
          })
        }
      >
        Creează un cont de profesor
      </Button>
      <Button
        variant='outline'
        style={uiStyles.s2}
        onPress={() => router.push('/(auth)/login')}
      >
        {copy.login}
      </Button>
      <View style={[uiStyles.s3, { gap: s.sm }]}>
        <Eye size={18} color={theme.textSecondary} />
        <Copy
          kind='caption'
          style={[uiStyles.s4, { color: theme.textSecondary }]}
        >
          {copy.footer}
        </Copy>
      </View>
    </Screen>
  );
}

const uiStyles = StyleSheet.create({
  s0: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start' },
  s1: { lineHeight: 24 },
  s2: { borderWidth: 0, backgroundColor: 'transparent' },
  s3: { flexDirection: 'row', alignItems: 'center', marginTop: 'auto' },
  s4: { flex: 1, textAlign: 'center' },
});
