import { createClient } from '@supabase/supabase-js';
import { json, withUser } from './_shared/http.ts';
import {
  buildPersonalizedPath,
  type Candidate,
  fold,
  recommendationKey,
} from './_shared/personalized-path.ts';
import {
  activityFor,
  type ActivityState,
  EDUCATION_VERSION,
  type EducationDocument,
  rankDirections,
  stageCopy,
} from './_shared/education.ts';

// Isolate-local caches are bounded. No response is shared across accounts.
const cache = new Map<
  string,
  { fingerprint: string; expires: number; result: unknown }
>();
const catalogueCache = new Map<
  string,
  {
    expires: number;
    value: { candidates: Candidate[]; version: number; truncated: boolean };
  }
>();
function put<T>(map: Map<string, T>, key: string, value: T, limit: number) {
  if (map.size >= limit && !map.has(key)) map.delete(map.keys().next().value!);
  map.set(key, value);
}
async function body(request: Request) {
  const reader = request.body?.getReader();
  if (!reader) return null;
  let text = '';
  let bytes = 0;
  const decoder = new TextDecoder();
  try {
    for (;;) {
      const { value, done } = await reader.read();
      if (done) break;
      bytes += value.byteLength;
      if (bytes > 2048) {
        await reader.cancel();
        return null;
      }
      text += decoder.decode(value, { stream: true });
    }
    return JSON.parse(text + decoder.decode());
  } catch {
    return null;
  } finally {
    reader.releaseLock();
  }
}
const handler = withUser(async ({ request, token, user }) => {
  const payload = await body(request);
  if (!payload || payload.expectedUser !== user.id) {
    return json({ error: 'Account changed or invalid request' }, 400);
  }
  const url = Deno.env.get('SUPABASE_URL')!;
  const key = Deno.env.get('SUPABASE_ANON_KEY');
  if (!key) return json({ error: 'Service is not configured' }, 503);
  const db = createClient(url, key, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const education = await db.rpc('get_education', { expected_user: user.id });
  if (education.error) return json({ error: 'Student access required' }, 403);
  const results = await Promise.all([
    db.from('profiles').select('grade_level,county,interests,favorite_subjects')
      .eq('id', user.id).single(),
    db.from('user_exploration_activities').select('*').eq('user_id', user.id)
      .order('activity_id').limit(18),
    db.from('user_goals').select('career_id').eq('user_id', user.id).order(
      'created_at',
      { ascending: false },
    ).limit(1).maybeSingle(),
    db.from('user_favorites').select('item_type,item_id').eq('user_id', user.id)
      .order('item_type').order('item_id').limit(1001),
    db.from('user_progress').select('step_type,ref_id,status').eq(
      'user_id',
      user.id,
    ).order('step_type').order('ref_id').limit(1001),
    db.from('user_recommendation_decisions').select(
      'item_type,item_id,decision',
    ).eq('user_id', user.id).order('item_type').order('item_id').limit(1001),
    db.from('user_skills').select('skill_id,level').eq('user_id', user.id)
      .order('skill_id').limit(1001),
  ]);
  if (results.some((r) => r.error)) {
    return json({ error: 'Unable to load route inputs' }, 503);
  }
  const [profile, activities, goal, favorites, progress, decisions, skills] =
    results;
  const document = education.data as EducationDocument;
  let directions = rankDirections(
    document.responses,
    activities.data as ActivityState[],
    {
      interests: profile.data!.interests,
      subjects: profile.data!.favorite_subjects,
    },
  );
  // Candidate responses include account goal/favorite priority, so cache identity includes
  // their IDs. Shared catalogue variants contain catalogue facts only, never answers.
  const tags = [...new Set(directions.flatMap((d) => d.tags))].sort();
  const catalogueKey = JSON.stringify([tags, goal.data, favorites.data]);
  let catalogue = catalogueCache.get(catalogueKey);
  if (!catalogue || catalogue.expires < Date.now()) {
    const response = await db.rpc('education_candidates', {
      expected_user: user.id,
      preferred_tags: tags,
    });
    if (response.error) return json({ error: 'Catalogue unavailable' }, 503);
    catalogue = { expires: Date.now() + 60_000, value: response.data };
    put(catalogueCache, catalogueKey, catalogue, 100);
  }
  const fingerprint = JSON.stringify([
    EDUCATION_VERSION,
    document.revision,
    ...results.map((r) => r.data),
    catalogue.value.version,
  ]);
  const cached = cache.get(user.id);
  if (cached?.fingerprint === fingerprint && cached.expires > Date.now()) {
    return json(cached.result, 200, { 'X-NextStep-Cache': 'hit' });
  }
  const study = document.responses.practical?.answers || {};
  const candidates = catalogue.value.candidates.filter((candidate) =>
    !(profile.data!.grade_level === 'student' && candidate.type === 'program' &&
      (study.goal?.includes('work') || study.degree?.includes('master') ||
        study.degree?.includes('doctorate')))
  );
  const answers = {
    ...document.responses.interests?.answers,
    ...document.responses.practical?.answers,
  };
  const goalId = goal.data?.career_id;
  directions = rankDirections(
    document.responses,
    activities.data as ActivityState[],
    {
      interests: profile.data!.interests,
      subjects: profile.data!.favorite_subjects,
      goalDomains: candidates.find((candidate) =>
        candidate.type === 'career' && candidate.id === goalId
      )?.domains,
      grade: profile.data!.grade_level,
    },
  );
  const savedKeys = favorites.data!.map((f) =>
    f.item_type === 'specialization'
      ? recommendationKey(
        'school',
        candidates.find((c) => c.schoolProfileIds?.includes(f.item_id))?.id ||
          f.item_id,
      )
      : recommendationKey(f.item_type, f.item_id)
  );
  const savedCandidates = candidates.filter((c) =>
    savedKeys.includes(recommendationKey(c.type, c.id))
  );
  const input = {
    profile: {
      ...profile.data!,
      county: profile.data!.county === 'Bihor' ? 'Bihor' : '',
    },
    answers,
    candidates,
    savedKeys,
    savedSkillIds: [
      ...new Set(
        savedCandidates.flatMap((c) => (c.skills || []).map((s) => s.id)),
      ),
    ],
    savedCareerIds: savedCandidates.filter((c) => c.type === 'career').map((
      c,
    ) => c.id),
    userSkills: skills.data!.map((s) => ({ id: s.skill_id, level: s.level })),
    goalId,
    goalSkills: candidates.find((c) =>
      c.type === 'career' && c.id === goalId
    )?.skills || [],
    acceptedKeys: [
      ...progress.data!.map((p) => recommendationKey(p.step_type, p.ref_id)),
      ...decisions.data!.filter((d) => d.decision === 'accepted').map((d) =>
        recommendationKey(d.item_type, d.item_id)
      ),
    ],
    completedKeys: progress.data!.filter((p) => p.status === 'completed').map((
      p,
    ) => recommendationKey(p.step_type, p.ref_id)),
    dismissedKeys: decisions.data!.filter((d) => d.decision === 'dismissed')
      .map((d) => recommendationKey(d.item_type, d.item_id)),
  };
  const notices = buildPersonalizedPath(input).notices;
  if (profile.data!.county !== 'Bihor') {
    notices.push(
      'Catalogul instituțiilor este disponibil momentan pentru Bihor. Nu recomandăm instituții din alte județe.',
    );
  }
  if (catalogue.value.truncated) {
    notices.push(
      'Sugestiile folosesc un set limitat de opțiuni prioritizate din catalog. Explorează catalogul pentru alte alternative.',
    );
  }
  if (
    [favorites, progress, decisions, skills].some((r) => r.data!.length > 1000)
  ) {
    notices.push(
      'Ai un istoric foarte mare. Unele semnale nu au fost incluse în această actualizare.',
    );
  }
  const result = {
    userId: user.id,
    algorithm: EDUCATION_VERSION,
    catalogueVersion: catalogue.value.version,
    revision: document.revision,
    context: stageCopy(profile.data!.grade_level),
    notices,
    activities: activities.data,
    directions: directions.map((direction) => {
      const relevant = candidates.filter((c) =>
        c.domains.some((tag) => direction.tags.map(fold).includes(fold(tag))) ||
        (c.type === 'school' && (c.subjects || []).some((s) => {
          const labels: Record<string, string[]> = {
            math: ['matematica'],
            informatics: ['informatica'],
            science: ['biologie', 'chimie', 'fizica', 'stiinte'],
            languages: ['limba romana', 'limba engleza', 'limbi'],
            social: ['istorie', 'geografie', 'stiinte sociale'],
            arts: ['arte', 'desen', 'muzica'],
          };
          return direction.subjects.some((id) => labels[id]?.includes(fold(s)));
        }))
      );
      return {
        id: direction.id,
        name: direction.name,
        reasons: direction.reasons,
        activity: activityFor(
          direction.id,
          profile.data!.grade_level,
          document.responses,
        ),
        options: buildPersonalizedPath({ ...input, candidates: relevant }).items
          .filter((i) => i.score > 0),
      };
    }),
  };
  put(
    cache,
    user.id,
    { fingerprint, expires: Date.now() + 5 * 60_000, result },
    500,
  );
  return json(result, 200, { 'X-NextStep-Cache': 'miss' });
});
export default handler;
