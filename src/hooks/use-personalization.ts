import { useQuery } from '@tanstack/react-query';
import { useSession } from '@/providers/auth';
import { supabase } from '@/lib/supabase';
import { needsProfileCompletion } from '@/lib/finish-auth';
import { accountRequest } from '@/lib/account-request';
import { QUESTIONNAIRE_VERSION, type Answers } from '@/constants/questionnaire';
import { useAccountMode } from '@/providers/account-mode';
export interface Personalization {
  user_id: string;
  version: number;
  answers: Answers;
  status: 'draft' | 'completed' | 'skipped';
  cursor: number;
  revision: number;
  onboarding_required: boolean;
}
export const personalizationKey = (userId?: string) => [
  'personalization',
  userId,
  QUESTIONNAIRE_VERSION,
];
export function usePersonalization() {
  const { session } = useSession();
  const { access } = useAccountMode();
  const id = session?.user.id;
  return useQuery({
    queryKey: personalizationKey(id),
    enabled:
      !!session?.user.email_confirmed_at &&
      access?.account_kind === 'student' &&
      !session.user.user_metadata.nextstep_profile_pending &&
      !needsProfileCompletion(session.user),
    refetchOnMount: 'always',
    queryFn: async () => {
      const result = await supabase
        .from('user_personalization')
        .select('*')
        .eq('user_id', id!)
        .eq('version', QUESTIONNAIRE_VERSION)
        .maybeSingle();
      if (result.error) {
        throw result.error;
      }
      if (!result.data) {
        throw new Error('Finish account setup before personalization');
      }
      return result.data as Personalization;
    },
  });
}
export async function persistPersonalization(
  current: Personalization,
  answers: Answers,
  status: Personalization['status'],
  cursor: number
) {
  const result = await accountRequest((signal) =>
    supabase
      .rpc('save_personalization', {
        expected_revision: current.revision,
        expected_user: current.user_id,
        responses: answers,
        new_status: status,
        next_cursor: cursor,
      })
      .abortSignal(signal)
  );
  if (result.error) {
    throw result.error;
  }
  return result.data as Personalization;
}
