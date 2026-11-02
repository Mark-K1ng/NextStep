import { useEffect, useRef, useState } from 'react';
import { View } from 'react-native';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { TutoringPage, Note, styles } from './shared';
import { Copy, Panel, Section, Choice } from '@/components/design';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { SelectField } from '@/components/SelectField';
import { DataState } from '@/components/data-state';
import { useTutoringAccount, useTutoringSubjects } from '@/hooks/use-tutoring';
import { saveApplication } from '@/services/tutoring';
import { applicationLabels, days, clock, parsePrice } from '@/lib/tutoring';
import { GRADES, gradeLabel } from '@/constants/profile-options';
import type { Availability } from '@/types/tutoring';
import { Redirect } from 'expo-router';
import { useAccountMode } from '@/providers/account-mode';

const hours = Array.from({ length: 25 }, (_, hour) => ({
  value: String(hour * 60),
  label: clock(hour * 60),
}));
class ApplicationValidationError extends Error {}
export default function TutorApplicationScreen() {
  const { isTeacher } = useAccountMode();
  return isTeacher ? (
    <Redirect href='/teacher/application' />
  ) : (
    <TutoringPage title='Cont de profesor'>
      <Copy>
        Acest cont este de elev. Cererile de profesor se trimit dintr-un cont de
        profesor, creat separat la înscriere.
      </Copy>
    </TutoringPage>
  );
}
export function LegacyTutorApplicationScreen() {
  const { userId, query } = useTutoringAccount();
  const subjects = useTutoringSubjects();
  const client = useQueryClient();
  const initialized = useRef(false);
  const [name, setName] = useState('');
  const [biography, setBiography] = useState('');
  const [experience, setExperience] = useState('');
  const [qualifications, setQualifications] = useState('');
  const [levels, setLevels] = useState<string[]>([]);
  const [prices, setPrices] = useState<Record<string, string>>({});
  const [availability, setAvailability] = useState<Availability[]>([]);
  const [accepted, setAccepted] = useState(false);
  const [message, setMessage] = useState('');
  useEffect(() => {
    if (query.isSuccess && !initialized.current) {
      initialized.current = true;
      const data = query.data;
      if (data) {
        setName(data.display_name);
        setBiography(data.biography);
        setExperience(data.experience);
        setQualifications(data.qualifications);
        setLevels(data.levels);
        setPrices(
          Object.fromEntries(
            data.subjects.map((subject) => [
              subject.subject,
              String(subject.price_minor / 100),
            ])
          )
        );
        setAvailability(data.availability);
        setAccepted(data.commission_accepted);
      }
    }
  }, [query.isSuccess, query.data]);
  const mutation = useMutation({
    mutationFn: async (submit: boolean) => {
      const selected = Object.entries(prices).map(([subject, price]) => ({
        subject,
        price_minor: parsePrice(price),
      }));
      if (
        name.trim().length < 2 ||
        !selected.length ||
        selected.some((subject) => subject.price_minor === null)
      ) {
        throw new ApplicationValidationError(
          'Completează numele și cel puțin o materie cu un tarif între 10 și 5.000 lei.'
        );
      }
      if (
        availability.some(
          (row) =>
            row.start_minute >= row.end_minute ||
            availability.some(
              (other) =>
                other !== row &&
                other.weekday === row.weekday &&
                row.start_minute < other.end_minute &&
                other.start_minute < row.end_minute
            )
        )
      ) {
        throw new ApplicationValidationError(
          'Verifică intervalele: ora de sfârșit trebuie să fie după început, fără suprapuneri.'
        );
      }
      if (
        submit &&
        (biography.trim().length < 40 ||
          experience.trim().length < 5 ||
          qualifications.trim().length < 5 ||
          !levels.length ||
          !availability.length ||
          !accepted)
      ) {
        throw new ApplicationValidationError(
          'Completează biografia (minimum 40 de caractere), experiența, calificările, clasele și disponibilitatea. Acceptă comisionul pentru a trimite cererea.'
        );
      }
      return saveApplication(
        {
          display_name: name.trim(),
          biography: biography.trim(),
          experience: experience.trim(),
          qualifications: qualifications.trim(),
          levels,
          subjects: selected as { subject: string; price_minor: number }[],
          availability,
          commission_accepted: accepted,
        },
        submit
      );
    },
    onSuccess: async (_, submit) => {
      setMessage(
        submit
          ? 'Cererea ta este în curs de verificare.'
          : 'Ciorna a fost salvată.'
      );
      await client.invalidateQueries({ queryKey: ['tutoring', userId] });
    },
    onError: (error) =>
      setMessage(
        error instanceof ApplicationValidationError
          ? error.message
          : 'Nu am putut salva cererea. Încearcă din nou.'
      ),
  });
  const locked =
    query.data &&
    ['submitted', 'under_review', 'suspended'].includes(query.data.status);
  const updateAvailability = (
    index: number,
    key: keyof Availability,
    value: string
  ) =>
    setAvailability((rows) =>
      rows.map((row, i) =>
        i === index ? { ...row, [key]: Number(value) } : row
      )
    );
  return (
    <TutoringPage title='Devino profesor'>
      {query.isPending ? (
        <DataState loadingLayout='form' loading />
      ) : query.isError ? (
        <DataState error retry={() => query.refetch()} />
      ) : (
        <>
          {query.data && (
            <Panel>
              <Copy>{applicationLabels[query.data.status]}</Copy>
            </Panel>
          )}
          {locked ? (
            <Note>
              Poți actualiza cererea după încheierea verificării. Pentru o
              suspendare, contactează echipa NextStep.
            </Note>
          ) : (
            <>
              <Copy kind='title'>Predă ceea ce știi.</Copy>
              <Note>
                Același cont rămâne disponibil pentru a învăța și a rezerva
                ședințe.
              </Note>
              {query.data?.status === 'approved' && (
                <Note>
                  Modificările profilului public, materiilor sau
                  disponibilității vor fi trimise din nou spre aprobare.
                  Rezervările existente își păstrează tarifele.
                </Note>
              )}
              <Input
                label='Numele afișat public'
                value={name}
                onChangeText={setName}
                maxLength={100}
                autoCapitalize='words'
              />
              <Input
                label='Despre tine'
                multiline
                value={biography}
                onChangeText={setBiography}
                maxLength={3000}
              />
              <Input
                label='Experiență didactică'
                multiline
                value={experience}
                onChangeText={setExperience}
                maxLength={2000}
              />
              <Input
                label='Calificări'
                multiline
                value={qualifications}
                onChangeText={setQualifications}
                maxLength={2000}
              />
              <Section title='Materii și tarife' />
              <Note>
                Selectează materiile. Fiecare tarif este pentru o ședință de 60
                de minute.
              </Note>
              {subjects.isPending ? (
                <DataState loadingLayout='row' loading />
              ) : subjects.isError ? (
                <DataState error retry={() => subjects.refetch()} />
              ) : (
                subjects.data.map((subject) => (
                  <View key={subject} style={styles.compact}>
                    <Choice
                      selected={subject in prices}
                      onPress={() =>
                        setPrices((current) => {
                          const next = { ...current };
                          if (subject in next) {
                            delete next[subject];
                          } else {
                            next[subject] = '';
                          }
                          return next;
                        })
                      }
                    >
                      {subject}
                    </Choice>
                    {subject in prices && (
                      <Input
                        label={`Tarif ${subject} (lei/oră)`}
                        keyboardType='decimal-pad'
                        value={prices[subject]}
                        onChangeText={(value) =>
                          setPrices((current) => ({
                            ...current,
                            [subject]: value,
                          }))
                        }
                        maxLength={7}
                      />
                    )}
                  </View>
                ))
              )}
              <Section title='Clase și niveluri' />
              <View style={styles.wrap}>
                {GRADES.map((grade) => (
                  <Choice
                    key={grade}
                    selected={levels.includes(grade)}
                    onPress={() =>
                      setLevels((current) =>
                        current.includes(grade)
                          ? current.filter((value) => value !== grade)
                          : [...current, grade]
                      )
                    }
                  >
                    {gradeLabel(grade)}
                  </Choice>
                ))}
              </View>
              <Section title='Disponibilitate săptămânală' />
              <Note>
                Fus orar: România. Intervalele se repetă săptămânal; o ședință
                durează 60 de minute.
              </Note>
              {availability.map((row, index) => (
                <Panel key={index}>
                  <SelectField
                    label='Ziua'
                    value={String(row.weekday)}
                    options={days.map((label, value) => ({
                      label,
                      value: String(value),
                    }))}
                    onChange={(value) =>
                      updateAvailability(index, 'weekday', value)
                    }
                  />
                  <SelectField
                    label='De la'
                    value={String(row.start_minute)}
                    options={hours.slice(0, -1)}
                    onChange={(value) =>
                      updateAvailability(index, 'start_minute', value)
                    }
                  />
                  <SelectField
                    label='Până la'
                    value={String(row.end_minute)}
                    options={hours.slice(1)}
                    onChange={(value) =>
                      updateAvailability(index, 'end_minute', value)
                    }
                  />
                  <Button
                    variant='outline'
                    onPress={() =>
                      setAvailability((current) =>
                        current.filter((_, i) => i !== index)
                      )
                    }
                  >
                    Elimină intervalul
                  </Button>
                </Panel>
              ))}
              <Button
                variant='secondary'
                disabled={availability.length >= 21}
                onPress={() =>
                  setAvailability((current) => [
                    ...current,
                    { weekday: 1, start_minute: 960, end_minute: 1200 },
                  ])
                }
              >
                Adaugă un interval
              </Button>
              <Panel>
                <Copy>
                  Tu stabilești prețul. NextStep reține un comision de 20%
                  pentru fiecare ședință plătită prin platformă.
                </Copy>
                <Note>
                  Partea brută a profesorului este 80%. Pot exista taxe,
                  rambursări și alte costuri.
                </Note>
                <Choice
                  selected={accepted}
                  onPress={() => setAccepted(!accepted)}
                >
                  Accept comisionul platformei
                </Choice>
              </Panel>
              <Button
                variant='secondary'
                loading={mutation.isPending}
                onPress={() => {
                  setMessage('');
                  mutation.mutate(false);
                }}
              >
                Salvează ciorna
              </Button>
              <Button
                loading={mutation.isPending}
                onPress={() => {
                  setMessage('');
                  mutation.mutate(true);
                }}
              >
                Trimite spre aprobare
              </Button>
            </>
          )}
          {!!message && <Copy accessibilityLiveRegion='polite'>{message}</Copy>}
        </>
      )}
    </TutoringPage>
  );
}
