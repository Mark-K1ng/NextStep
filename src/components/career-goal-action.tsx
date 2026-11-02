import { useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components';
import { useStudentData } from '@/hooks/use-student-data';
import { useSession } from '@/providers/auth';
import { useToast } from '@/providers/toast';
import { decideRecommendation } from '@/services/personalized-path';
import { showMessage } from '@/lib/show-message';
import { useAccountMode } from '@/providers/account-mode';
export function CareerGoalAction({ id, name }: { id: string; name: string }) {
  const { session } = useSession();
  const { isTeacher } = useAccountMode();
  const { goal, loading, error } = useStudentData({ includeGap: false });
  const client = useQueryClient();
  const toast = useToast();
  const lock = useRef(false);
  const [busy, setBusy] = useState(false);
  return (
    <Button
      variant='outline'
      disabled={isTeacher || loading || error || goal?.id === id || !session}
      loading={busy}
      onPress={async () => {
        if (!session || lock.current) {
          return;
        }
        lock.current = true;
        setBusy(true);
        try {
          await decideRecommendation(session.user.id, 'career', id, 'accepted');
          await Promise.all([
            client.invalidateQueries({
              queryKey: ['student', session.user.id],
            }),
            client.invalidateQueries({
              queryKey: ['personalized-path', session.user.id],
            }),
            client.invalidateQueries({
              queryKey: ['education-route', session.user.id],
            }),
          ]);
          toast('Obiectiv actualizat');
        } catch {
          showMessage('Obiectivul nu a fost salvat. Reîncearcă.');
        } finally {
          lock.current = false;
          setBusy(false);
        }
      }}
    >
      {goal?.id === id ? 'Obiectivul tău actual' : `Alege obiectiv: ${name}`}
    </Button>
  );
}
