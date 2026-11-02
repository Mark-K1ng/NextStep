import { useRef, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Platform } from 'react-native';
import { useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { Copy, Panel, Screen, BackHeader } from '@/components/design';
import { Button } from '@/components/Button';
import { DataState } from '@/components/data-state';
import { useAccountMode } from '@/providers/account-mode';
import { startTeacherApplication } from '@/services/account-access';
import { supabase } from '@/lib/supabase';
import { TeacherNote } from './shared';

const statusCopy = {
  not_started: [
    'Cererea mea',
    'Pentru activarea funcțiilor de profesor, completează formularul profesional și așteaptă verificarea echipei NextStep.',
  ],
  draft: [
    'Cerere pregătită',
    'Codul cererii este pregătit. Primirea formularului nu a fost confirmată încă în aplicație. Dacă l-ai trimis deja, așteaptă înregistrarea răspunsului de către echipă.',
  ],
  submitted: [
    'Cerere primită',
    'Primirea cererii a fost înregistrată. Funcțiile de profesor se activează numai după aprobare.',
  ],
  under_review: [
    'Cerere în verificare',
    'Echipa NextStep verifică informațiile trimise. Vezi aici starea actualizată a cererii.',
  ],
  approved: ['Cont de profesor aprobat', 'Poți deschide panoul profesorului.'],
  rejected: [
    'Cererea nu a fost aprobată',
    'Consultă explicația echipei înainte de a pregăti o nouă cerere.',
  ],
  suspended: [
    'Cont de profesor suspendat',
    'Funcțiile de predare nu sunt disponibile. O nouă cerere nu înlocuiește soluționarea suspendării.',
  ],
} as const;

export function teacherFormUrl(value: string | undefined): string | null {
  if (!value) {
    return null;
  }
  try {
    const url = new URL(value);
    return url.protocol === 'https:' &&
      !url.username &&
      !url.password &&
      !url.port &&
      (url.hostname === 'forms.gle' ||
        (url.hostname === 'docs.google.com' &&
          /^\/forms\/d\/(?:e\/)?[^/]+\/viewform$/.test(url.pathname)))
      ? url.toString()
      : null;
  } catch {
    return null;
  }
}

export default function TeacherApplication() {
  const account = useAccountMode();
  const router = useRouter();
  const opening = useRef(false);
  const [openError, setOpenError] = useState(false);
  const [logoutError, setLogoutError] = useState(false);
  const [busy, setBusy] = useState(false);
  const form = teacherFormUrl(
    process.env.EXPO_PUBLIC_TEACHER_APPLICATION_FORM_URL
  );
  const mutation = useMutation({
    mutationFn: startTeacherApplication,
    onSuccess: () => account.refresh(),
  });
  const access = account.access;
  const status = access?.teacher_status ?? 'not_started';
  const copy = statusCopy[status];
  const expired =
    !!access?.application_expires_at &&
    new Date(access.application_expires_at).getTime() <= Date.now();
  const canPrepare = ['not_started', 'draft', 'rejected'].includes(status);
  const openForm = async () => {
    if (!form || opening.current) {
      return;
    }
    opening.current = true;
    setBusy(true);
    setOpenError(false);
    try {
      await WebBrowser.openBrowserAsync(form);
    } catch {
      setOpenError(true);
    } finally {
      opening.current = false;
      setBusy(false);
    }
  };
  return (
    <Screen nativeTitle='Cererea mea' bottomSafeArea='content'>
      {Platform.OS !== 'ios' && <BackHeader title='Cererea mea' />}
      {account.isPending ? (
        <DataState loadingLayout='form' loading />
      ) : account.error ? (
        <DataState error retry={() => account.refresh()} />
      ) : (
        <>
          <Panel>
            <Copy kind='heading'>{copy[0]}</Copy>
            <Copy>{copy[1]}</Copy>
            {!!access?.review_reason && <Copy>{access.review_reason}</Copy>}
            {!!access?.application_received_at && (
              <TeacherNote>
                Primire înregistrată:{' '}
                {new Date(access.application_received_at).toLocaleDateString(
                  'ro-RO'
                )}
              </TeacherNote>
            )}
          </Panel>
          {account.isApprovedTeacher ? (
            <Button onPress={() => router.replace('/teacher/dashboard')}>
              Deschide panoul profesorului
            </Button>
          ) : (
            <>
              {canPrepare && (
                <>
                  <TeacherNote>
                    Formularul se deschide în browser și poate solicita
                    autentificarea în contul Google. Folosește codul cererii și
                    adresa contului NextStep. Nu trimite parole sau coduri de
                    autentificare.
                  </TeacherNote>
                  {!form && (
                    <Panel>
                      <Copy>
                        Formularul de înscriere nu este configurat încă.
                      </Copy>
                      <TeacherNote>
                        Revino după activarea formularului de către echipa
                        NextStep. Nu s-a trimis nicio cerere.
                      </TeacherNote>
                    </Panel>
                  )}
                  {!!access?.application_reference && (
                    <Panel>
                      <Copy kind='heading'>Codul cererii</Copy>
                      <Copy selectable>{access.application_reference}</Copy>
                      <TeacherNote>
                        {expired
                          ? 'Codul a expirat. Pregătește un cod nou înainte de a completa formularul.'
                          : 'Copiază acest cod în câmpul „Codul cererii” din formular.'}
                      </TeacherNote>
                    </Panel>
                  )}
                  {(!access?.application_reference ||
                    expired ||
                    status === 'rejected') && (
                    <Button
                      disabled={!form}
                      loading={mutation.isPending}
                      onPress={() => mutation.mutate()}
                    >
                      Pregătește cererea
                    </Button>
                  )}
                  {!!access?.application_reference &&
                    !expired &&
                    status !== 'rejected' && (
                      <Button
                        loading={busy}
                        disabled={!form || mutation.isPending}
                        onPress={openForm}
                      >
                        Deschide formularul
                      </Button>
                    )}
                  <TeacherNote>
                    Deschiderea formularului nu confirmă trimiterea cererii.
                    Starea se schimbă după înregistrarea răspunsului de către
                    echipă, apoi după decizia de verificare.
                  </TeacherNote>
                </>
              )}
              {(mutation.isError || openError) && (
                <Copy accessibilityRole='alert'>
                  {openError
                    ? 'Nu am putut deschide formularul. Încearcă din nou.'
                    : 'Nu am putut pregăti cererea. Actualizează starea și încearcă din nou.'}
                </Copy>
              )}
              <Button variant='outline' onPress={() => account.refresh()}>
                Actualizează starea
              </Button>
            </>
          )}
          <Button
            variant='outline'
            onPress={() => router.push('/privacy-and-data')}
          >
            Confidențialitate și date
          </Button>
          <Button
            variant='outline'
            loading={busy}
            onPress={async () => {
              if (busy) {
                return;
              }
              setBusy(true);
              setLogoutError(false);
              try {
                const { error } = await supabase.auth.signOut({
                  scope: 'local',
                });
                if (error) {
                  throw error;
                }
                router.replace('/(auth)/login');
              } catch {
                setLogoutError(true);
              } finally {
                setBusy(false);
              }
            }}
          >
            Deconectează-te
          </Button>
          {logoutError && (
            <Copy accessibilityRole='alert'>
              Nu am putut încheia sesiunea. Încearcă din nou.
            </Copy>
          )}
        </>
      )}
    </Screen>
  );
}
