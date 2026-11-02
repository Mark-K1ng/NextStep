import exportData from '../export-data.ts';
import deleteAccount from '../delete-account.ts';
import explainPath from '../explain-path.ts';
import educationalRoute from '../educational-route.ts';

Deno.test('educational route rejects an account mismatch before reading any data', async () => {
  await withMockFetch(async (calls) => {
    const result = await educationalRoute(request({ expectedUser: 'other' }));
    assert(result.status === 400);
    assert(calls.every((call) => call.url.pathname === '/auth/v1/user'));
  });
});

Deno.test('educational route bounds data reads, uses caller authorization and reuses unchanged results', async () => {
  let revision = 1;
  await withMockFetch(async (calls) => {
    const first = await educationalRoute(request({ expectedUser: user.id }));
    assert(first.status === 200);
    const result = await first.json();
    assert(result.directions[0].id === 'technology');
    assert(result.directions[0].options[0].id === 'skill-1');
    const second = await educationalRoute(request({ expectedUser: user.id }));
    assert(second.headers.get('X-NextStep-Cache') === 'hit');
    revision++;
    const changed = await educationalRoute(request({ expectedUser: user.id }));
    assert(changed.headers.get('X-NextStep-Cache') === 'miss');
    assert(
      calls.filter((call) =>
        call.url.pathname.endsWith('/education_candidates')
      ).length === 1,
    );
    assert(
      calls.filter((call) => call.url.pathname.startsWith('/rest/')).every((
        call,
      ) => call.authorization === 'Bearer test-token'),
    );
    assert(
      calls.filter((call) =>
        call.url.pathname.includes('/user_') &&
        !call.url.pathname.includes('/rpc/')
      ).every((call) => Number(call.url.searchParams.get('limit')) <= 1001),
    );
  }, (url) => {
    if (url.pathname.endsWith('/get_education')) {
      return Response.json({
        user_id: user.id,
        revision,
        responses: { interests: { answers: { domains: ['technology'] } } },
      });
    }
    if (url.pathname.endsWith('/profiles')) {
      return Response.json({
        grade_level: 'XI',
        county: 'Bihor',
        interests: [],
        favorite_subjects: [],
      });
    }
    if (url.pathname.endsWith('/user_goals')) return Response.json(null);
    if (url.pathname.endsWith('/education_candidates')) {
      return Response.json({
        candidates: [{
          id: 'skill-1',
          type: 'skill',
          name: 'Synthetic skill',
          domains: ['Tehnologie'],
          skills: [{ id: 'skill-1', level: 1 }],
        }],
        version: 1,
        truncated: false,
      });
    }
    return Response.json([]);
  });
});

Deno.test('educational route refuses student-data access when the owner RPC rejects the account', async () => {
  await withMockFetch(async (calls) => {
    const result = await educationalRoute(request({ expectedUser: user.id }));
    assert(result.status === 403);
    assert(!calls.some((call) => call.url.pathname.endsWith('/profiles')));
  }, () => Response.json({ message: 'Student required' }, { status: 403 }));
});

function assert(value: unknown, message = 'Assertion failed'): asserts value {
  if (!value) throw new Error(message);
}

const user = {
  id: '11111111-1111-4111-8111-111111111111',
  aud: 'authenticated',
  role: 'authenticated',
  email: 'test@example.com',
  created_at: '2026-01-01',
  app_metadata: {},
  user_metadata: {},
};
const request = (body?: unknown) =>
  new Request('https://example.com/function', {
    method: 'POST',
    headers: {
      Authorization: 'Bearer test-token',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body ?? {}),
  });

async function withMockFetch(
  run: (
    calls: { url: URL; method: string; authorization: string | null }[],
  ) => Promise<void>,
  reply: (url: URL, method: string) => Response = () => Response.json([]),
  validUser = true,
) {
  const original = globalThis.fetch;
  const previousUrl = Deno.env.get('SUPABASE_URL');
  const previousKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  const previousAnonKey = Deno.env.get('SUPABASE_ANON_KEY');
  Deno.env.set('SUPABASE_URL', 'https://unit-test.invalid');
  Deno.env.set('SUPABASE_SERVICE_ROLE_KEY', 'unit-test-key');
  Deno.env.set('SUPABASE_ANON_KEY', 'unit-test-public-key');
  const calls: { url: URL; method: string; authorization: string | null }[] =
    [];
  globalThis.fetch = (input, init) => {
    const url = new URL(input instanceof Request ? input.url : String(input));
    const method = init?.method || 'GET';
    calls.push({
      url,
      method,
      authorization: new Headers(
        init?.headers || (input instanceof Request ? input.headers : undefined),
      ).get('Authorization'),
    });
    return Promise.resolve(
      url.pathname === '/auth/v1/user'
        ? validUser
          ? Response.json(user)
          : Response.json({ message: 'Invalid JWT' }, { status: 401 })
        : reply(url, method),
    );
  };
  try {
    await run(calls);
  } finally {
    globalThis.fetch = original;
    if (previousUrl === undefined) Deno.env.delete('SUPABASE_URL');
    else Deno.env.set('SUPABASE_URL', previousUrl);
    if (previousKey === undefined) Deno.env.delete('SUPABASE_SERVICE_ROLE_KEY');
    else Deno.env.set('SUPABASE_SERVICE_ROLE_KEY', previousKey);
    if (previousAnonKey === undefined) Deno.env.delete('SUPABASE_ANON_KEY');
    else Deno.env.set('SUPABASE_ANON_KEY', previousAnonKey);
  }
}

Deno.test('all functions answer browser preflight without authenticating', async () => {
  for (
    const handler of [exportData, deleteAccount, explainPath, educationalRoute]
  ) {
    const result = await handler(
      new Request('https://example.com', { method: 'OPTIONS' }),
    );
    assert(result.status === 204);
    assert(
      result.headers.get('Access-Control-Allow-Headers')?.toLowerCase()
        .includes('authorization'),
    );
    assert(
      result.headers.get('Access-Control-Allow-Methods')?.includes('POST'),
    );
  }
});

Deno.test('all functions reject missing authentication and unsupported methods', async () => {
  for (
    const handler of [exportData, deleteAccount, explainPath, educationalRoute]
  ) {
    assert(
      (await handler(new Request('https://example.com', { method: 'POST' })))
        .status === 401,
    );
    assert((await handler(new Request('https://example.com'))).status === 405);
  }
});

Deno.test('invalid JWTs never reach data queries or deletion', async () => {
  await withMockFetch(
    async (calls) => {
      for (
        const handler of [
          exportData,
          deleteAccount,
          explainPath,
          educationalRoute,
        ]
      ) {
        assert((await handler(request())).status === 401);
      }
      assert(calls.every((call) => call.url.pathname === '/auth/v1/user'));
    },
    () => Response.json([]),
    false,
  );
});

Deno.test('deletion stops if session revocation fails', async () => {
  await withMockFetch(async (calls) => {
    assert((await deleteAccount(request())).status === 500);
    assert(!calls.some((call) => call.method === 'DELETE'));
  }, () => Response.json({ message: 'Provider unavailable' }, { status: 500 }));
});

Deno.test('export queries only the authenticated user and returns a downloadable JSON file', async () => {
  await withMockFetch(async (calls) => {
    const result = await exportData(request());
    assert(result.status === 200);
    assert(result.headers.get('Content-Disposition')?.includes('filename='));
    assert(result.headers.get('Cache-Control') === 'no-store');
    const body = await result.json();
    assert(body.userId === user.id);
    const queries = calls.filter((call) =>
      call.url.pathname.startsWith('/rest/v1/')
    );
    assert(queries.length === 12);
    assert(queries.every((call) => call.authorization === 'Bearer test-token'));
    assert(Array.isArray(body.favorites));
    assert(Array.isArray(body.personalization));
    assert(Array.isArray(body.recommendationDecisions));
    assert(Array.isArray(body.education));
    assert(Array.isArray(body.explorationActivities));
    assert(
      queries.every((call) =>
        call.url.searchParams.get(
          call.url.pathname.endsWith('/profiles') ? 'id' : 'user_id',
        ) === `eq.${user.id}`
      ),
    );
  });
});

Deno.test('export preserves server favorites and fails safely when a required table is missing', async () => {
  const favorite = {
    user_id: user.id,
    item_id: 'saved-school',
    item_type: 'school',
  };
  await withMockFetch(
    async () => {
      const result = await exportData(request());
      assert(result.status === 200);
      const body = await result.json();
      assert(body.favorites.length === 1);
      assert(body.favorites[0].item_id === favorite.item_id);
    },
    (url) =>
      Response.json(url.pathname.endsWith('/user_favorites') ? [favorite] : []),
  );
  await withMockFetch(
    async () => {
      const result = await exportData(request());
      assert(result.status === 500);
    },
    (url) =>
      url.pathname.endsWith('/user_favorites')
        ? Response.json({ code: '42P01', message: 'relation does not exist' }, {
          status: 404,
        })
        : Response.json([]),
  );
});

Deno.test('deletion revokes sessions before deleting the authenticated account', async () => {
  await withMockFetch(
    async (calls) => {
      assert((await deleteAccount(request())).status === 200);
      const writes = calls.filter((call) =>
        call.url.pathname !== '/auth/v1/user'
      );
      assert(writes[0].url.pathname === '/auth/v1/logout');
      assert(writes[1].url.pathname === `/auth/v1/admin/users/${user.id}`);
      assert(writes[1].method === 'DELETE');
    },
    () =>
      new Response('{}', {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
  );
});

Deno.test('explanation validates arrays and recognizes partially covered skills', async () => {
  await withMockFetch(async () => {
    assert(
      (await explainPath(
        request({ gapAnalysis: { covered: {}, partial: [], missing: [] } }),
      )).status === 400,
    );
    const result = await explainPath(
      request({
        gapAnalysis: {
          covered: [],
          partial: [{ name: 'Comunicare' }],
          missing: [],
        },
      }),
    );
    assert(result.status === 200);
    const { explanation } = await result.json();
    assert(explanation.includes('Comunicare'));
    assert(!explanation.includes('Felicitări'));
  });
});

Deno.test('malformed JSON returns a client error rather than an internal server error', async () => {
  await withMockFetch(async () => {
    const result = await explainPath(
      new Request('https://example.com', {
        method: 'POST',
        headers: { Authorization: 'Bearer test-token' },
        body: '{broken',
      }),
    );
    assert(result.status === 400);
  });
});

Deno.test('explanation cancels oversized streaming bodies without content-length', async () => {
  await withMockFetch(async () => {
    let cancelled = false;
    const body = new ReadableStream<Uint8Array>({
      pull(controller) {
        controller.enqueue(new Uint8Array(60000));
      },
      cancel() {
        cancelled = true;
      },
    });
    const result = await explainPath(
      new Request('https://example.com', {
        method: 'POST',
        headers: { Authorization: 'Bearer test-token' },
        body,
      }),
    );
    assert(result.status === 413);
    assert(cancelled, 'Oversized input must stop reading the stream');
  });
});

Deno.test('explanation limits bytes rather than UTF-16 string length', async () => {
  await withMockFetch(async () => {
    const result = await explainPath(
      new Request('https://example.com', {
        method: 'POST',
        headers: { Authorization: 'Bearer test-token' },
        body: 'ă'.repeat(50001),
      }),
    );
    assert(result.status === 413);
  });
});
