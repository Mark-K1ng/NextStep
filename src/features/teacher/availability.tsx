import { useRef, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Copy, Panel } from '@/components/design';
import { Button } from '@/components/Button';
import { SelectField } from '@/components/SelectField';
import { days, clock } from '@/lib/tutoring';
import { useSession } from '@/providers/auth';
import { updateTeacherAvailability } from '@/services/account-access';
import type { Availability } from '@/types/tutoring';
import { TeacherAccountContent, TeacherNote, TeacherPage } from './shared';

const hours = Array.from({ length: 25 }, (_, hour) => ({
  value: String(hour * 60),
  label: clock(hour * 60),
}));
export function availabilityError(rows: Availability[]): string | null {
  if (rows.length > 21) {
    return 'Poți adăuga cel mult 21 de intervale.';
  }
  if (
    rows.some(
      (row) =>
        !Number.isInteger(row.weekday) ||
        row.weekday < 0 ||
        row.weekday > 6 ||
        !Number.isInteger(row.start_minute) ||
        !Number.isInteger(row.end_minute) ||
        row.start_minute < 0 ||
        row.end_minute > 1440 ||
        row.end_minute - row.start_minute < 60
    )
  ) {
    return 'Fiecare interval trebuie să dureze cel puțin 60 de minute și să se încheie după ora de început.';
  }
  if (
    rows.some((row, index) =>
      rows.some(
        (other, otherIndex) =>
          index !== otherIndex &&
          row.weekday === other.weekday &&
          row.start_minute < other.end_minute &&
          other.start_minute < row.end_minute
      )
    )
  ) {
    return 'Intervalele din aceeași zi nu se pot suprapune.';
  }
  return null;
}

function AvailabilityEditor({ initial }: { initial: Availability[] }) {
  const [rows, setRows] = useState(initial);
  const [saved, setSaved] = useState(initial);
  const [message, setMessage] = useState('');
  const saving = useRef(false);
  const { session } = useSession();
  const client = useQueryClient();
  const mutation = useMutation({
    mutationFn: updateTeacherAvailability,
    onSuccess: async (value) => {
      setRows(value);
      setSaved(value);
      setMessage('Disponibilitatea a fost salvată.');
      await client.invalidateQueries({
        queryKey: ['tutoring', session?.user.id],
      });
    },
    onError: () =>
      setMessage(
        'Nu am putut salva programul. Intervalele tale sunt păstrate; încearcă din nou.'
      ),
    onSettled: () => {
      saving.current = false;
    },
  });
  const error = availabilityError(rows);
  const dirty = JSON.stringify(rows) !== JSON.stringify(saved);
  const update = (index: number, key: keyof Availability, value: string) => {
    if (saving.current) {
      return;
    }
    setMessage('');
    setRows((current) =>
      current.map((row, i) =>
        i === index ? { ...row, [key]: Number(value) } : row
      )
    );
  };
  return (
    <>
      {!rows.length && (
        <TeacherNote>
          Nu ai intervale publicate. Eliminarea tuturor intervalelor oprește
          noile rezervări după salvare; ședințele existente se păstrează.
        </TeacherNote>
      )}
      {rows.map((row, index) => (
        <Panel key={index}>
          <SelectField
            label='Ziua'
            value={String(row.weekday)}
            options={days.map((label, value) => ({
              label,
              value: String(value),
            }))}
            onChange={(value) => update(index, 'weekday', value)}
          />
          <SelectField
            label='De la'
            value={String(row.start_minute)}
            options={hours.slice(0, -1)}
            onChange={(value) => update(index, 'start_minute', value)}
          />
          <SelectField
            label='Până la'
            value={String(row.end_minute)}
            options={hours.slice(1)}
            onChange={(value) => update(index, 'end_minute', value)}
          />
          <Button
            variant='outline'
            disabled={mutation.isPending}
            accessibilityLabel={`Elimină intervalul ${index + 1}`}
            onPress={() => {
              setRows((current) => current.filter((_, i) => i !== index));
              setMessage('');
            }}
          >
            Elimină intervalul
          </Button>
        </Panel>
      ))}
      <Button
        variant='secondary'
        disabled={mutation.isPending || rows.length >= 21}
        onPress={() => {
          setRows((current) => [
            ...current,
            { weekday: 1, start_minute: 960, end_minute: 1200 },
          ]);
          setMessage('');
        }}
      >
        Adaugă un interval
      </Button>
      {!!error && <Copy accessibilityRole='alert'>{error}</Copy>}
      <Button
        disabled={!dirty || !!error}
        loading={mutation.isPending}
        onPress={() => {
          if (!error && !saving.current) {
            saving.current = true;
            mutation.mutate(rows);
          }
        }}
      >
        Salvează disponibilitatea
      </Button>
      {!!message && (
        <Copy
          accessibilityRole={mutation.isError ? 'alert' : undefined}
          accessibilityLiveRegion='polite'
        >
          {message}
        </Copy>
      )}
      <TeacherNote>
        Schimbările se aplică numai după salvare și nu modifică ședințele deja
        rezervate. Dacă pleci fără să salvezi, modificările se pierd.
      </TeacherNote>
    </>
  );
}

export default function TeacherAvailability() {
  return (
    <TeacherPage title='Disponibilitate'>
      <TeacherNote>
        Fus orar: România. Intervalele se repetă săptămânal; o ședință durează
        60 de minute.
      </TeacherNote>
      <TeacherAccountContent loadingLayout='form'>
        {(data) => (
          <AvailabilityEditor key={data.id} initial={data.availability} />
        )}
      </TeacherAccountContent>
    </TeacherPage>
  );
}
