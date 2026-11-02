import {
  connectStatus,
  verifyStripeSignature,
} from '../_shared/tutoring-stripe.ts';
function assert(value: unknown, message = 'Assertion failed'): asserts value {
  if (!value) throw new Error(message);
}
async function sign(body: string, timestamp: number, secret: string) {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const bytes = new Uint8Array(
    await crypto.subtle.sign(
      'HMAC',
      key,
      new TextEncoder().encode(`${timestamp}.${body}`),
    ),
  );
  return bytes.reduce(
    (result, value) => result + value.toString(16).padStart(2, '0'),
    '',
  );
}
Deno.test('webhook accepts an authentic signature and rejects tampering, stale timestamps and invalid signatures', async () => {
  const timestamp = 1800000000,
    body = '{"id":"evt_fixture"}',
    secret = 'whsec_fixture_only';
  const signature = await sign(body, timestamp, secret);
  const header = `t=${timestamp},v1=${signature}`;
  assert(await verifyStripeSignature(body, header, secret, timestamp * 1000));
  assert(
    !await verifyStripeSignature(body + ' ', header, secret, timestamp * 1000),
  );
  assert(
    !await verifyStripeSignature(
      body,
      header,
      secret,
      (timestamp + 301) * 1000,
    ),
  );
  assert(
    !await verifyStripeSignature(
      body,
      header,
      'wrong-secret',
      timestamp * 1000,
    ),
  );
  assert(
    !await verifyStripeSignature(
      body,
      `t=${timestamp},v1=0000`,
      secret,
      timestamp * 1000,
    ),
  );
  assert(!await verifyStripeSignature(body, '', secret, timestamp * 1000));
});
Deno.test('Connect is active only with actual enabled charges, payouts and transfers', () => {
  assert(
    connectStatus({
      charges_enabled: true,
      payouts_enabled: true,
      capabilities: { transfers: 'active' },
    }) === 'active',
  );
  assert(
    connectStatus({
      charges_enabled: true,
      payouts_enabled: false,
      details_submitted: true,
      requirements: { disabled_reason: 'requirements.past_due' },
    }) === 'restricted',
  );
  assert(connectStatus({ details_submitted: true }) === 'pending');
  assert(connectStatus({}) === 'onboarding');
});

Deno.test('refund handler rejects unsigned and altered bodies before external calls', async () => {
  const names = [
    'STRIPE_WEBHOOK_SECRET',
    'STRIPE_SECRET_KEY',
    'SUPABASE_URL',
    'SUPABASE_SERVICE_ROLE_KEY',
  ];
  const previous = names.map((name) => Deno.env.get(name));
  const originalServe = Deno.serve;
  const originalFetch = globalThis.fetch;
  const secret = crypto.randomUUID();
  const calls: string[] = [];
  try {
    Deno.env.set(names[0], secret);
    Deno.env.set(names[1], crypto.randomUUID());
    Deno.env.set(names[2], 'https://supabase.invalid');
    Deno.env.set(names[3], crypto.randomUUID());
    // Import the real entrypoint without starting a listener in this test.
    Deno.serve = (() => ({})) as unknown as typeof Deno.serve;
    const { handler } = await import('../tutoring-webhook/index.ts');
    Deno.serve = originalServe;
    globalThis.fetch = ((input: RequestInfo | URL) => {
      const url = input instanceof Request ? input.url : String(input);
      calls.push(url);
      if (url === 'https://api.stripe.com/v1/charges/ch_fixture') {
        return Promise.resolve(Response.json({
          payment_intent: 'pi_fixture',
          amount_refunded: 1250,
        }));
      }
      if (url === 'https://supabase.invalid/rest/v1/rpc/tutoring_refund') {
        return Promise.resolve(Response.json(null));
      }
      throw new Error('Unexpected test request');
    }) as typeof fetch;
    const body = JSON.stringify({
      id: 'evt_fixture',
      type: 'charge.refunded',
      data: { object: { id: 'ch_fixture' } },
    });
    const timestamp = Math.floor(Date.now() / 1000);
    const signature = `t=${timestamp},v1=${await sign(
      body,
      timestamp,
      secret,
    )}`;
    const request = (payload: string, header = '') =>
      new Request(
        'https://webhook.invalid',
        {
          method: 'POST',
          body: payload,
          headers: { 'stripe-signature': header },
        },
      );
    for (const invalid of [request(body), request(body + ' ', signature)]) {
      const response = await handler(invalid);
      assert(response.status === 400, 'Invalid refund must return 400');
      await response.text();
      assert(
        calls.length === 0,
        'Invalid refund must not reach Stripe or database',
      );
    }
    const response = await handler(request(body, signature));
    assert(response.status === 200, 'Authentic refund must remain supported');
    await response.text();
    assert(
      calls.length === 2,
      'Authentic refund must retrieve charge and update records',
    );
  } finally {
    Deno.serve = originalServe;
    globalThis.fetch = originalFetch;
    names.forEach((name, index) => {
      if (previous[index] === undefined) Deno.env.delete(name);
      else Deno.env.set(name, previous[index]!);
    });
  }
});
