import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import {
  Eye,
  ShieldCheck,
  Palette,
  LogOut,
  CircleHelp,
} from 'lucide-react-native';
import {
  Copy,
  Panel,
  Section,
  GroupedList,
  Row,
  Choice,
} from '@/components/design';
import { useAccountMode } from '@/providers/account-mode';
import { useThemePreference } from '@/providers/theme';
import { useSession } from '@/providers/auth';
import { supabase } from '@/lib/supabase';
import { money } from '@/lib/tutoring';
import { gradeLabel } from '@/constants/profile-options';
import { spacing as s } from '@/theme/tokens';
import { TeacherAccountContent, TeacherNote, TeacherPage } from './shared';

export default function TeacherProfile() {
  const router = useRouter();
  const account = useAccountMode();
  const { session } = useSession();
  const { mode, setMode } = useThemePreference();
  const [signingOut, setSigningOut] = useState(false);
  const [error, setError] = useState(false);
  const signOut = async () => {
    if (signingOut) {
      return;
    }
    setSigningOut(true);
    setError(false);
    try {
      const { error: failure } = await supabase.auth.signOut({
        scope: 'local',
      });
      if (failure) {
        throw failure;
      }
      router.replace('/(auth)/login');
    } catch {
      setError(true);
    } finally {
      setSigningOut(false);
    }
  };
  return (
    <TeacherPage title='Profil profesor'>
      <TeacherAccountContent loadingLayout='profile'>
        {(data) => (
          <>
            <Copy kind='heading'>{data.display_name}</Copy>
            <TeacherNote>{session?.user.email}</TeacherNote>
            <Panel>
              <Section title='Despre tine' />
              <Copy>
                {data.biography || 'Biografia nu este încă disponibilă.'}
              </Copy>
              <TeacherNote>
                {data.levels.map((level) => gradeLabel(level)).join(' · ')}
              </TeacherNote>
            </Panel>
            <Panel>
              <Section title='Materii și tarife' />
              {data.subjects.length ? (
                data.subjects.map((subject) => (
                  <Copy key={subject.subject}>
                    {subject.subject} · {money(subject.price_minor)}/oră
                  </Copy>
                ))
              ) : (
                <Copy>Nu ai materii publicate.</Copy>
              )}
            </Panel>
            <TeacherNote>
              Modificările informațiilor publice necesită verificare. Editarea
              directă a profilului nu este disponibilă în această versiune.
            </TeacherNote>
          </>
        )}
      </TeacherAccountContent>
      <Section title='Aspect' />
      <View style={styles.choices}>
        {(
          [
            { value: 'dark', label: 'Închisă' },
            { value: 'light', label: 'Luminoasă' },
            { value: 'system', label: 'Sistem' },
          ] as const
        ).map((item) => (
          <Choice
            key={item.value}
            exclusive
            selected={mode === item.value}
            onPress={() => setMode(item.value)}
          >
            {item.label}
          </Choice>
        ))}
      </View>
      <GroupedList inset>
        {account.isApprovedTeacher && (
          <Row
            title='Vezi perspectiva elevului'
            subtitle='Explorează aplicația fără a schimba identitatea contului.'
            icon={Eye}
            onPress={() => {
              account.enterPreview();
              router.replace('/');
            }}
          />
        )}
        <Row
          title='Confidențialitate și date'
          icon={ShieldCheck}
          onPress={() => router.push('/privacy-and-data')}
        />
        <Row title='Q&A' icon={CircleHelp} onPress={() => router.push('/qa')} />
        <Row
          title='Paletă de culori'
          icon={Palette}
          onPress={() => router.push('/palette')}
        />
        <Row
          title={signingOut ? 'Se deconectează…' : 'Deconectează-te'}
          icon={LogOut}
          destructive
          onPress={signingOut ? undefined : signOut}
        />
      </GroupedList>
      {error && (
        <Copy accessibilityRole='alert'>
          Nu am putut încheia sesiunea. Încearcă din nou.
        </Copy>
      )}
    </TeacherPage>
  );
}

const styles = StyleSheet.create({
  choices: { flexDirection: 'row', flexWrap: 'wrap', gap: s.sm },
});
