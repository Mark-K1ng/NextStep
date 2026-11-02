import { Platform, StyleSheet, View } from 'react-native';
import {
  BackHeader,
  Copy,
  GroupedList,
  Screen,
  Section,
} from '@/components/design';
import { qaSections } from '@/constants/qa-content';
import { useTheme } from '@/hooks/use-theme';
import { spacing } from '@/theme/tokens';

export default function QuestionsAndAnswers() {
  const theme = useTheme();
  return (
    <Screen tab='profile' nativeTitle='Q&A'>
      {Platform.OS !== 'ios' && <BackHeader title='Q&A' />}
      <Copy kind='caption' style={{ color: theme.textSecondary }}>
        Întrebări și răspunsuri despre folosirea NextStep.
      </Copy>
      {qaSections.map((section) => (
        <View key={section.title} style={styles.section}>
          <Section title={section.title} />
          <GroupedList>
            {section.questions.map(({ question, answer }) => (
              <View key={question} style={styles.answer}>
                <Copy accessibilityRole='header' style={styles.question}>
                  {question}
                </Copy>
                <Copy selectable>{answer}</Copy>
              </View>
            ))}
          </GroupedList>
        </View>
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  section: { gap: spacing.md },
  answer: { gap: spacing.sm, paddingVertical: spacing.sm },
  question: { fontWeight: '600' },
});
