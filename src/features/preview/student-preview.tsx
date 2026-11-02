import { useAppRouter } from '@/hooks/use-app-router';
import { Screen, Copy, Panel, GroupedList, Row } from '@/components/design';
import { Compass, GraduationCap } from 'lucide-react-native';

export function StudentPreview({
  section,
}: {
  section: 'home' | 'path' | 'profile';
}) {
  const router = useAppRouter();
  const titles = { home: 'Acasă', path: 'Traseu', profile: 'Profil' };
  return (
    <Screen>
      <Copy kind='title'>{titles[section]}</Copy>
      <Panel>
        <Copy kind='heading'>
          {section === 'path'
            ? 'Traseul unui elev'
            : section === 'profile'
              ? 'Profilul unui elev'
              : 'Descoperă experiența elevilor'}
        </Copy>
        <Copy>
          {section === 'path'
            ? 'Elevii aleg un obiectiv și primesc sugestii pe baza profilului și preferințelor lor. Progresul și recomandările personale nu sunt disponibile în această previzualizare.'
            : section === 'profile'
              ? 'Elevii își pot completa clasa, localitatea și preferințele. Contul tău rămâne de profesor; nu trebuie să completezi un profil de elev.'
              : 'Poți explora opțiunile educaționale și profilurile publice ale profesorilor. Funcțiile personale ale elevilor nu modifică acest cont de profesor.'}
        </Copy>
      </Panel>
      <GroupedList>
        <Row
          icon={Compass}
          title='Explorează'
          subtitle='Catalogul public de opțiuni educaționale'
          onPress={() => router.navigate('/_tabs/explore')}
        />
        <Row
          icon={GraduationCap}
          title='Meditații'
          subtitle='Profesorii disponibili pentru elevi'
          onPress={() => router.navigate('/_tabs/tutoring')}
        />
      </GroupedList>
    </Screen>
  );
}
