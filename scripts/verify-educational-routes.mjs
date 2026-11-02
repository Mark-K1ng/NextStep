// Synthetic hosted integration/load check. Never logs credentials or real accounts.
// node --env-file=.env scripts/verify-educational-routes.mjs
import { createClient } from '@supabase/supabase-js';
import { randomUUID } from 'node:crypto';
import { writeFile, mkdir } from 'node:fs/promises';
import assert from 'node:assert/strict';

const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const key = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
assert(url && key, 'Public Supabase configuration required');
const clients = [];
const report = { checks: [], load: {}, cleanup: [] };
const check = (name) => {
  report.checks.push(name);
  console.log(`PASS: ${name}`);
};
async function rpc(client, name, args) {
  const result = await client.rpc(name, args);
  if (result.error)
    throw new Error(`${name}: ${result.error.code || result.error.message}`);
  return result.data;
}
async function fixture(kind) {
  const client = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    db: { retry: false },
    global: {
      fetch: (input, init) =>
        fetch(input, {
          ...init,
          signal: init?.signal || AbortSignal.timeout(20000),
        }),
    },
  });
  const importId = randomUUID();
  const signup = await client.auth.signUp({
    email: `nextstep-education-${randomUUID()}@example.com`,
    password: `Ns!${randomUUID()}`,
    options: { data: { account_kind: kind, nextstep_guest_intake: importId } },
  });
  if (signup.error || !signup.data.session)
    throw new Error('Synthetic signup did not return a confirmed session');
  const entry = {
    client,
    user: signup.data.user,
    token: signup.data.session.access_token,
    importId,
  };
  clients.push(entry);
  if (kind === 'student') {
    const profile = await client.from('profiles').upsert(
      {
        id: entry.user.id,
        display_name: 'Synthetic education verification',
        grade_level: 'VIII',
        county: 'Bihor',
        interests: [],
        favorite_subjects: [],
      },
      { onConflict: 'id', ignoreDuplicates: true }
    );
    if (profile.error) throw new Error('Synthetic profile creation failed');
  }
  return entry;
}
async function route(entry, expectedUser = entry.user.id) {
  const started = performance.now();
  const result = await fetch(`${url}/functions/v1/educational-route`, {
    method: 'POST',
    headers: {
      apikey: key,
      Authorization: `Bearer ${entry.token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ expectedUser }),
    signal: AbortSignal.timeout(20000),
  });
  const data = await result.json();
  return {
    status: result.status,
    data,
    elapsed: Math.round(performance.now() - started),
    cache: result.headers.get('X-NextStep-Cache'),
  };
}
try {
  const owner = await fixture('student');
  let doc = await rpc(owner.client, 'get_education', {
    expected_user: owner.user.id,
  });
  assert.equal(doc.revision, 0);
  doc = await rpc(owner.client, 'import_education_intake', {
    expected_user: owner.user.id,
    import_id: owner.importId,
    responses: {
      interests: {
        domains: ['technology'],
        subjects: ['math'],
        activities: ['build'],
      },
    },
  });
  const importedRevision = doc.revision;
  assert.equal(doc.responses.interests.status, 'completed');
  assert.equal(
    (
      await rpc(owner.client, 'import_education_intake', {
        expected_user: owner.user.id,
        import_id: owner.importId,
        responses: {},
      })
    ).revision,
    importedRevision
  );
  check('confirmed signup, profile creation and idempotent guest import');
  const stale = await owner.client.rpc('save_education_questionnaire', {
    expected_user: owner.user.id,
    expected_revision: 0,
    questionnaire: 'work',
    answers: {},
    skipped: [],
    next_cursor: 0,
    completed: false,
  });
  assert.equal(
    stale.error?.code,
    'PT409',
    `Unexpected conflict response: ${stale.status} ${stale.error?.message}`
  );
  check('stale revision rejected');
  const snapshot = await rpc(owner.client, 'education_candidates', {
    expected_user: owner.user.id,
    preferred_tags: ['Tehnologie'],
  });
  assert(snapshot.candidates.length <= 720);
  assert(
    snapshot.candidates
      .filter((c) => ['school', 'university', 'program'].includes(c.type))
      .every((c) => c.county === 'Bihor')
  );
  report.candidateCount = snapshot.candidates.length;
  check('bounded Bihor candidate retrieval');
  const first = await route(owner);
  assert.equal(first.status, 200, 'Hosted route endpoint failed');
  assert.equal(first.data.directions[0].id, 'technology');
  assert(
    first.data.directions
      .flatMap((d) => d.options)
      .every((o) => !['program', 'university', 'career'].includes(o.type))
  );
  const proposal = first.data.directions[0].activity;
  let activity = await rpc(owner.client, 'save_exploration_activity', {
    expected_user: owner.user.id,
    activity: proposal.id,
    direction: proposal.directionId,
    next_status: 'accepted',
    feedback: null,
    snapshot: proposal,
    expected_revision: -1,
  });
  activity = await rpc(owner.client, 'save_exploration_activity', {
    expected_user: owner.user.id,
    activity: proposal.id,
    direction: proposal.directionId,
    next_status: 'completed',
    feedback: 'more',
    snapshot: { ...proposal, text: 'Must not replace accepted text' },
    expected_revision: activity.revision,
  });
  assert.equal(activity.proposal.text, proposal.text);
  check(
    'middle-school route, activity acceptance/reflection and immutable accepted proposal'
  );
  for (const grade of [
    'V',
    'VI',
    'VII',
    'VIII',
    'IX',
    'X',
    'XI',
    'XII',
    'student',
  ]) {
    const updated = await owner.client
      .from('profiles')
      .update({ grade_level: grade })
      .eq('id', owner.user.id);
    assert(!updated.error);
    const result = await route(owner);
    assert.equal(result.status, 200);
    assert(result.data.context.length > 0);
    if (['IX', 'X'].includes(grade))
      assert(
        result.data.directions
          .flatMap((d) => d.options)
          .every(
            (o) =>
              !['school', 'university', 'program', 'career'].includes(o.type)
          )
      );
  }
  check('routes for every supported grade and university');
  doc = await rpc(owner.client, 'get_education', {
    expected_user: owner.user.id,
  });
  doc = await rpc(owner.client, 'save_education_questionnaire', {
    expected_user: owner.user.id,
    expected_revision: doc.revision,
    questionnaire: 'practical',
    answers: {
      field: ['technology'],
      degree: ['master'],
      year: ['1'],
      goal: ['work'],
      budget: ['free'],
    },
    skipped: [],
    next_cursor: 0,
    completed: false,
  });
  const university = await route(owner);
  assert.equal(university.status, 200);
  assert(
    university.data.directions.every((d) =>
      d.options.every(
        (o) => o.type !== 'program' && (o.type !== 'course' || o.free === true)
      )
    )
  );
  check('university context and free-only constraint');
  const second = await fixture('student');
  const mismatch = await route(owner, second.user.id);
  assert.equal(mismatch.status, 400);
  const others = await second.client
    .from('user_education')
    .select('*')
    .eq('user_id', owner.user.id);
  assert.equal(others.data.length, 0);
  const teacher = await fixture('teacher');
  assert.equal((await route(teacher)).status, 403);
  check('cross-account isolation and teacher restriction');
  const exported = await owner.client.functions.invoke('export-data');
  assert(!exported.error && exported.data.userId === owner.user.id);
  assert(
    Array.isArray(exported.data.education) &&
      Array.isArray(exported.data.explorationActivities)
  );
  check('authenticated export includes questionnaire and activity records');
  await route(owner); // Prime the exact current input fingerprint.
  const samples = [];
  for (let batch = 0; batch < 2; batch++)
    samples.push(
      ...(await Promise.all(Array.from({ length: 10 }, () => route(owner))))
    );
  assert(samples.every((sample) => sample.status === 200));
  const times = samples.map((sample) => sample.elapsed).sort((a, b) => a - b);
  report.load = {
    requests: samples.length,
    concurrency: 10,
    successful: samples.length,
    cacheHits: samples.filter((s) => s.cache === 'hit').length,
    p50Ms: times[Math.floor(times.length * 0.5)],
    p95Ms: times[Math.min(times.length - 1, Math.floor(times.length * 0.95))],
    coldMs: first.elapsed,
  };
  check(
    'bounded concurrent smoke test; not a large-population capacity guarantee'
  );
} finally {
  for (const entry of clients.reverse()) {
    const deleted = await entry.client.functions.invoke('delete-account');
    report.cleanup.push(deleted.data?.success === true && !deleted.error);
  }
  await mkdir('.preview-ui', { recursive: true });
  await writeFile(
    '.preview-ui/educational-routes-live-report.json',
    JSON.stringify(report, null, 2)
  );
  console.log(JSON.stringify(report, null, 2));
  assert(
    report.cleanup.every(Boolean),
    'A synthetic account could not be removed'
  );
}
