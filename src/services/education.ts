import AsyncStorage from '@react-native-async-storage/async-storage';
import { secureRandomUUID } from '@/lib/secure-crypto';
import type { User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { accountRequest } from '@/lib/account-request';
import {
  QUESTIONNAIRES,
  validateAnswers,
  type EducationDocument,
  type EducationAnswers,
  type ActivityState,
  type QuestionnaireResponse,
} from '../../supabase/functions/_shared/education';
import type { Recommendation } from '@/engine/personalizedPath';

const GUEST_KEY = 'nextstep-education-intake-v1';
export type GuestIntake = {
  id: string;
  grade: string;
  cursor: number;
  preview: boolean;
  responses: Record<string, EducationAnswers>;
};
export async function readGuestIntake(): Promise<GuestIntake | null> {
  const raw = await AsyncStorage.getItem(GUEST_KEY);
  if (!raw) {
    return null;
  }
  const draft = JSON.parse(raw) as GuestIntake;
  if (
    !draft ||
    !/^[0-9a-f-]{36}$/i.test(draft.id) ||
    !['', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII', 'student'].includes(
      draft.grade
    ) ||
    !Number.isInteger(draft.cursor) ||
    draft.cursor < 0 ||
    draft.cursor > 2 ||
    typeof draft.preview !== 'boolean' ||
    !draft.responses ||
    Object.entries(draft.responses).some(([id, answers]) => {
      const definition = QUESTIONNAIRES.find((q) => q.id === id);
      return (
        !['interests', 'practical'].includes(id) ||
        !definition ||
        !validateAnswers(definition, answers)
      );
    })
  ) {
    throw new Error('Invalid local intake');
  }
  return draft;
}
export function newGuestIntake(): GuestIntake {
  return {
    id: secureRandomUUID(),
    grade: '',
    cursor: 0,
    preview: false,
    responses: {},
  };
}
export async function writeGuestIntake(draft: GuestIntake) {
  await AsyncStorage.setItem(GUEST_KEY, JSON.stringify(draft));
}
export async function clearGuestIntake() {
  await AsyncStorage.removeItem(GUEST_KEY);
}
export async function loadEducation(
  userId: string
): Promise<EducationDocument> {
  const result = await accountRequest((signal) =>
    supabase.rpc('get_education', { expected_user: userId }).abortSignal(signal)
  );
  if (result.error) {
    throw result.error;
  }
  return result.data as EducationDocument;
}
export async function importGuestIntake(
  user: User
): Promise<EducationDocument | null> {
  // A login never consumes another person's guest answers on a shared device.
  if (!user.user_metadata?.nextstep_guest_intake) {
    return null;
  }
  const draft = await readGuestIntake();
  if (!draft || user.user_metadata.nextstep_guest_intake !== draft.id) {
    return null;
  }
  const result = await accountRequest((signal) =>
    supabase
      .rpc('import_education_intake', {
        expected_user: user.id,
        import_id: draft.id,
        responses: draft.responses,
      })
      .abortSignal(signal)
  );
  if (result.error) {
    throw result.error;
  }
  // Clear only after acknowledgement; a timeout can safely retry the same import ID.
  const current = await readGuestIntake();
  if (current?.id === draft.id) {
    await clearGuestIntake();
  }
  return result.data as EducationDocument;
}
export async function saveEducation(
  document: EducationDocument,
  id: string,
  response: QuestionnaireResponse,
  clear = false
) {
  const result = await accountRequest((signal) =>
    supabase
      .rpc('save_education_questionnaire', {
        expected_user: document.user_id,
        expected_revision: document.revision,
        questionnaire: id,
        answers: response.answers,
        skipped: response.skipped,
        next_cursor: response.cursor,
        completed: response.status === 'completed',
        clear_answers: clear,
      })
      .abortSignal(signal)
  );
  if (result.error) {
    throw result.error;
  }
  return result.data as EducationDocument;
}
export type ExplorationActivity = ActivityState & {
  revision: number;
  proposal: {
    id: string;
    directionId: string;
    title: string;
    text: string;
    minutes: number;
  };
};
export type EducationRoute = {
  userId: string;
  algorithm: string;
  catalogueVersion: number;
  revision: number;
  directions: {
    id: string;
    name: string;
    reasons: string[];
    activity: ExplorationActivity['proposal'];
    options: Recommendation[];
  }[];
  notices: string[];
  context: string;
  activities: ExplorationActivity[];
};
export async function loadEducationRoute(
  userId: string,
  signal?: AbortSignal
): Promise<EducationRoute> {
  const { data, error } = await supabase.functions.invoke('educational-route', {
    body: { expectedUser: userId },
    signal,
  });
  if (
    error ||
    !data ||
    data.userId !== userId ||
    data.algorithm !== 'bihor-exploration-v1'
  ) {
    throw error || new Error('Route unavailable');
  }
  return data;
}
export async function saveExplorationActivity(
  userId: string,
  proposal: ExplorationActivity['proposal'],
  status: ActivityState['status'],
  reflection: ActivityState['reflection'],
  revision = -1
) {
  const result = await accountRequest((signal) =>
    supabase
      .rpc('save_exploration_activity', {
        expected_user: userId,
        activity: proposal.id,
        direction: proposal.directionId,
        next_status: status,
        feedback: reflection,
        snapshot: proposal,
        expected_revision: revision,
      })
      .abortSignal(signal)
  );
  if (result.error) {
    throw result.error;
  }
  return result.data as ExplorationActivity;
}
