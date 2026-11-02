import { useRef, useState } from 'react';
import { Platform } from 'react-native';
import { BackHeader, Copy, Screen } from '@/components/design';
import { Input } from '@/components/Input';
import { Button } from '@/components/Button';
import { appVersionLabel, openFeedback } from '@/lib/app-feedback';

export default function Feedback() {
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);
  const opening = useRef(false);
  const open = async () => {
    if (!message.trim() || opening.current) {
      return;
    }
    opening.current = true;
    setBusy(true);
    setError(false);
    try {
      await openFeedback(message);
    } catch {
      setError(true);
    } finally {
      opening.current = false;
      setBusy(false);
    }
  };
  return (
    <Screen nativeTitle='Feedback' bottomSafeArea='content'>
      {Platform.OS !== 'ios' && <BackHeader title='Feedback' />}
      <Copy kind='heading'>Ce putem îmbunătăți?</Copy>
      <Copy>
        Spune-ne unde ai întâmpinat problema, ce ai încercat și ce te așteptai
        să se întâmple. Nu include parole sau date personale.
      </Copy>
      <Input
        accessibilityLabel='Descrie problema sau sugestia'
        placeholder='Problema sau sugestia ta'
        multiline
        value={message}
        onChangeText={setMessage}
        maxLength={2000}
      />
      <Copy kind='caption'>NextStep {appVersionLabel()} · program pilot</Copy>
      <Copy kind='caption'>
        Raportul include versiunea aplicației și sistemul de operare. Alegi
        aplicația și confirmi trimiterea în pasul următor.
      </Copy>
      <Button disabled={!message.trim()} loading={busy} onPress={open}>
        Continuă cu raportul
      </Button>
      {error && (
        <Copy accessibilityRole='alert'>
          Nu am putut deschide raportul. Textul tău este păstrat; încearcă din
          nou.
        </Copy>
      )}
    </Screen>
  );
}
