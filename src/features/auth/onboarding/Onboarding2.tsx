import { StyleSheet } from 'react-native';
import { useState } from 'react';
import { View } from 'react-native';
import { MotionPressable, Reveal } from '@/components/motion';
import { useAppRouter as useRouter } from '@/hooks/use-app-router';
import { Backpack, School, CircleCheck } from 'lucide-react-native';
import { Button } from '@/components';
import { BackButton } from '@/components/back-button';
import { Copy, Choice, Panel, Row, Screen, design } from '@/components/design';
import { useTheme } from '@/hooks/use-theme';
import { ro } from '@/i18n/ro';
import { spacing as s, radius } from '@/theme/tokens';
import { EDUCATION_ROUTES_ENABLED } from '@/constants/education-rollout';
import GuestIntake from '@/features/personalization/GuestIntake';

export default function Onboarding2() {
  return EDUCATION_ROUTES_ENABLED ? <GuestIntake /> : <LegacyOnboarding2 />;
}
function LegacyOnboarding2() {
  const router = useRouter();
  const theme = useTheme();
  const copy = ro.visual.personalize;
  const [subjects, setSubjects] = useState<string[]>([]);
  const [level, setLevel] = useState('');
  const [grade, setGrade] = useState('');
  return (
    <Screen auth>
      <View style={uiStyles.s0}>
        <BackButton onPress={() => router.back()} />
        <Copy kind='caption' style={{ color: theme.textSecondary }}>
          {copy.step}
        </Copy>
        <MotionPressable
          accessibilityRole='button'
          onPress={() => router.push('/(auth)/register')}
          style={design.touch}
        >
          <Copy kind='caption' style={{ color: theme.accentText }}>
            {copy.skip}
          </Copy>
        </MotionPressable>
      </View>
      <View style={[uiStyles.s1, { gap: s.sm }]}>
        {[0, 1, 2, 3].map((i) => (
          <View
            key={i}
            style={[
              uiStyles.s2,
              {
                height: s.xs,
                borderRadius: radius.full,
                backgroundColor: i < 2 ? theme.accent : theme.border,
              },
            ]}
          />
        ))}
      </View>
      <Reveal style={{ gap: s.md }}>
        <Copy kind='heading'>{copy.title}</Copy>
        <Copy style={[uiStyles.s3, { color: theme.textSecondary }]}>
          {copy.subtitle}
        </Copy>
      </Reveal>
      <View style={design.wrap}>
        {copy.subjects.map((subject) => (
          <Choice
            key={subject}
            selected={subjects.includes(subject)}
            onPress={() =>
              setSubjects((current) =>
                current.includes(subject)
                  ? current.filter((value) => value !== subject)
                  : current.length < 3
                    ? [...current, subject]
                    : current
              )
            }
          >
            {subject}
          </Choice>
        ))}
      </View>
      <Copy kind='heading'>{copy.level}</Copy>
      {[
        {
          value: 'VIII',
          icon: Backpack,
          title: copy.middle,
          subtitle: copy.middleHint,
        },
        {
          value: 'high',
          icon: School,
          title: copy.high,
          subtitle: copy.highHint,
        },
      ].map((option) => (
        <MotionPressable
          accessibilityRole='radio'
          accessibilityState={{ checked: level === option.value }}
          aria-checked={level === option.value}
          key={option.value}
          onPress={() => {
            setLevel(option.value);
            setGrade(option.value === 'VIII' ? 'VIII' : '');
          }}
        >
          <Panel accent={level === option.value}>
            <Row
              icon={option.icon}
              title={option.title}
              subtitle={option.subtitle}
              trailing={
                level === option.value ? (
                  <CircleCheck size={22} color={theme.accentText} />
                ) : undefined
              }
            />
          </Panel>
        </MotionPressable>
      ))}
      <Choice
        selected={level === 'middle'}
        onPress={() => {
          setLevel('middle');
          setGrade('');
        }}
      >
        {ro.visual.otherGrade}
      </Choice>
      {(level === 'high' || level === 'middle') && (
        <View style={design.wrap}>
          {(level === 'high'
            ? ['IX', 'X', 'XI', 'XII']
            : ['V', 'VI', 'VII']
          ).map((value) => (
            <Choice
              key={value}
              selected={grade === value}
              onPress={() => setGrade(value)}
            >
              {value}
            </Choice>
          ))}
        </View>
      )}
      <Choice
        selected={grade === 'student'}
        onPress={() => {
          setLevel('');
          setGrade('student');
        }}
      >
        {ro.profileChoices.university}
      </Choice>
      <Button
        size='lg'
        disabled={!grade}
        onPress={() =>
          router.push({
            pathname: '/(auth)/onboarding/3',
            params: {
              gradeLevel: grade,
              favoriteSubjects: JSON.stringify(subjects),
            },
          })
        }
        style={uiStyles.s4}
      >
        {copy.continue}
      </Button>
    </Screen>
  );
}

const uiStyles = StyleSheet.create({
  s0: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  s1: { flexDirection: 'row' },
  s2: { flex: 1 },
  s3: { lineHeight: 24 },
  s4: { marginTop: 'auto' },
});
