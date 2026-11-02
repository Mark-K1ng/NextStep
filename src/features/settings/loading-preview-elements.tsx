import { Image, StyleSheet, View } from 'react-native';
import { Host, Slider } from '@expo/ui';
import {
  Bookmark,
  Compass,
  SlidersHorizontal,
  UserRound,
} from 'lucide-react-native';
import {
  Brand,
  Choice,
  Copy,
  GroupedList,
  IconTile,
  Panel,
  Row,
  Section,
} from '@/components/design';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { Chip } from '@/components/Chip';
import { SelectField } from '@/components/SelectField';
import { BackButton } from '@/components/back-button';
import { ColorWheel } from '@/components/color-wheel';
import { EmptyState } from '@/components/EmptyState';
import { ErrorState } from '@/components/ErrorState';
import { AnimatedProgress } from '@/components/motion';
import { SaveButton } from '@/components/save-button';
import { SocialSignIn } from '@/components/social-sign-in';
import { AccountKindChoice } from '@/features/auth/account-kind-choice';
import { DetailHeading } from '@/features/details/detail-heading';
import { AdmissionFacts } from '@/features/details/school-admissions';
import { CatalogueResult } from '@/features/explore/CatalogueResult';
import { PathStepItem } from '@/features/path/PathStepItem';
import { TutorCard } from '@/features/tutoring/shared';
import { useTheme } from '@/hooks/use-theme';
import { radius, spacing as s, typography } from '@/theme/tokens';
import demoImage from '@/assets/images/expo-badge.png';

const noop = () => {};
const catalogueItem = {
  id: 'local-preview-course',
  type: 'courses',
  title: 'Introducere în programare',
  provider: 'Exemplu local',
  description: 'Învață să construiești primul tău proiect.',
  subjects: ['Informatică'],
};

import type { PreviewElement } from './loading-preview-catalogue';

export function PreviewElementContent({ id }: { id: PreviewElement[0] }) {
  const theme = useTheme();
  if (id.startsWith('text-')) {
    const kind = id.slice(5) as keyof typeof typography;
    return <Copy kind={kind}>Următorul tău pas</Copy>;
  }
  switch (id) {
    case 'brand':
      return <Brand />;
    case 'button-primary':
      return <Button onPress={noop}>Continuă</Button>;
    case 'button-secondary':
      return (
        <Button variant='secondary' onPress={noop}>
          Vezi profilul
        </Button>
      );
    case 'button-outline':
      return (
        <Button variant='outline' onPress={noop}>
          Editează
        </Button>
      );
    case 'button-disabled':
      return <Button disabled>Salvează</Button>;
    case 'button-loading':
      return <Button loading>Se salvează</Button>;
    case 'back':
      return (
        <View style={styles.inline}>
          <BackButton onPress={noop} />
        </View>
      );
    case 'bookmark':
      return (
        <View style={styles.inline}>
          <SaveButton item={catalogueItem} />
        </View>
      );
    case 'icon':
      return (
        <View style={styles.inline}>
          <IconTile icon={Compass} />
        </View>
      );
    case 'filter':
      return (
        <View style={styles.icon}>
          <SlidersHorizontal size={22} color={theme.accentText} />
        </View>
      );
    case 'input':
      return <Input label='Nume' value='Alex Exemplu' editable={false} />;
    case 'email':
      return (
        <Input
          label='E-mail'
          keyboardType='email-address'
          value='exemplu@example.com'
          editable={false}
        />
      );
    case 'password':
      return (
        <Input
          label='Parolă'
          secureTextEntry
          value='exemplu-local'
          editable={false}
        />
      );
    case 'search':
      return (
        <Input
          variant='search'
          placeholder='Caută în catalog'
          editable={false}
        />
      );
    case 'multiline':
      return (
        <Input
          label='Descriere'
          multiline
          value={
            'Ce îți place să înveți?\nPovestește-ne despre interesele tale.'
          }
          editable={false}
        />
      );
    case 'input-error':
      return (
        <Input
          label='Nume'
          value=''
          error='Completează acest câmp.'
          editable={false}
        />
      );
    case 'select':
      return (
        <SelectField
          label='Clasa'
          value='X'
          options={[{ value: 'X', label: 'Clasa a X-a' }]}
          onChange={noop}
        />
      );
    case 'choice':
      return (
        <View style={styles.inline}>
          <Choice selected onPress={noop}>
            Informatică
          </Choice>
        </View>
      );
    case 'radio':
      return (
        <View style={styles.inline}>
          <Choice selected exclusive onPress={noop}>
            Liceu
          </Choice>
        </View>
      );
    case 'account':
      return <AccountKindChoice value='student' onChange={noop} />;
    case 'badge':
      return (
        <View style={styles.inline}>
          <Chip size='sm' variant='secondary'>
            Informatică
          </Chip>
        </View>
      );
    case 'row':
      return (
        <Row
          icon={Bookmark}
          title='Salvate'
          subtitle='Opțiunile care te interesează'
          onPress={noop}
        />
      );
    case 'compact-row':
      return <Row compact icon={Compass} title='Explorează' onPress={noop} />;
    case 'group':
      return (
        <GroupedList>
          <Row title='Aspect și setări' onPress={noop} />
          <Row title='Q&A' onPress={noop} />
        </GroupedList>
      );
    case 'section':
      return (
        <Section
          title='Recomandările tale'
          action='Vezi toate'
          onPress={noop}
        />
      );
    case 'panel':
      return (
        <Panel>
          <Copy>Conținutul unui panou</Copy>
        </Panel>
      );
    case 'accent-panel':
      return (
        <Panel accent>
          <Copy>Următorul pas din traseul tău</Copy>
        </Panel>
      );
    case 'detail':
      return (
        <DetailHeading title='Informatică' subtitle='Abilitate · Tehnologie' />
      );
    case 'progress':
      return <AnimatedProgress value={3} total={5} label='3 din 5 pași' />;
    case 'path-step':
      return (
        <PathStepItem
          step={{
            id: 'local-preview-step',
            type: 'course',
            title: 'Primul proiect',
            status: 'in_progress',
          }}
          index={0}
          expanded
          saving={false}
          disabled={false}
          onToggle={noop}
          onOpen={noop}
          onFinish={noop}
        />
      );
    case 'catalogue':
      return (
        <CatalogueResult
          item={catalogueItem}
          category='Cursuri'
          onPress={noop}
        />
      );
    case 'admission':
      return (
        <AdmissionFacts
          expanded
          profile={{
            id: 'local-preview-admission',
            specialization: 'Matematică-informatică',
            admission_year: 2026,
            last_admission_average: 9.25,
            previous_admission_average: 9.1,
            seats_total: 28,
            seats_occupied: 28,
          }}
        />
      );
    case 'tutor':
      return (
        <TutorCard
          tutor={{
            id: 'local-preview-tutor',
            display_name: 'Profesor · exemplu',
            biography: 'Lecții individuale, în ritmul tău.',
            experience: '',
            qualifications: '',
            levels: ['X'],
            subjects: [{ subject: 'Matematică', price_minor: 10000 }],
            availability: [],
            rating: null,
            review_count: 0,
            completed_lessons: 0,
            can_book: false,
          }}
        />
      );
    case 'qa':
      return (
        <View style={styles.stack}>
          <Copy style={styles.question}>Cum folosesc NextStep?</Copy>
          <Copy>Explorează opțiunile și alege pașii care ți se potrivesc.</Copy>
        </View>
      );
    case 'image':
      return (
        <Image source={demoImage} resizeMode='contain' style={styles.image} />
      );
    case 'avatar':
      return (
        <View
          style={[styles.avatar, { backgroundColor: theme.surfaceElevated }]}
        >
          <UserRound size={24} color={theme.accentText} />
        </View>
      );
    case 'wheel':
      return (
        <ColorWheel value={[270, 50, 60]} onChange={noop} size={192} disabled />
      );
    case 'brightness':
      return (
        <Host
          matchContents={{ vertical: true }}
          colorScheme={theme.isDark ? 'dark' : 'light'}
          seedColor={theme.accent}
          style={styles.slider}
        >
          <Slider value={60} min={0} max={100} onValueChange={noop} />
        </Host>
      );
    case 'swatch':
      return (
        <View
          style={[
            styles.swatch,
            { backgroundColor: theme.accent, borderColor: theme.border },
          ]}
        />
      );
    case 'empty':
      return (
        <EmptyState
          title='Nu ai încă opțiuni salvate'
          subtitle='Explorează catalogul pentru a găsi ce te interesează.'
        />
      );
    case 'error':
      return (
        <ErrorState
          title='Nu am putut încărca datele'
          subtitle='Încearcă din nou.'
          actionLabel='Reîncearcă'
          onActionPress={noop}
        />
      );
    case 'social':
      return <SocialSignIn />;
  }
  return null;
}
const styles = StyleSheet.create({
  inline: { flexDirection: 'row', alignItems: 'center', gap: s.sm },
  icon: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stack: { gap: s.sm },
  question: { fontWeight: '600' },
  image: { width: 160, height: 80 },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  swatch: { width: 48, height: 48, borderRadius: radius.sm, borderWidth: 1 },
  slider: { width: '100%' },
});
