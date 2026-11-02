type StripeObject = Record<string, unknown>;
export async function stripeRequest(
  path: string,
  params?: Record<string, string>,
  key?: string,
): Promise<StripeObject> {
  const secret = Deno.env.get('STRIPE_SECRET_KEY');
  if (!secret) throw new Error('Stripe not configured');
  const response = await fetch(`https://api.stripe.com/v1/${path}`, {
    method: params ? 'POST' : 'GET',
    headers: {
      Authorization: `Bearer ${secret}`,
      ...(params
        ? { 'Content-Type': 'application/x-www-form-urlencoded' }
        : {}),
      ...(key ? { 'Idempotency-Key': key } : {}),
    },
    body: params ? new URLSearchParams(params) : undefined,
    signal: AbortSignal.timeout(15000),
  });
  if (!response.ok) throw new Error('Stripe request failed');
  return await response.json();
}
export function connectStatus(account: StripeObject) {
  const capabilities = account.capabilities as StripeObject | undefined;
  if (
    account.charges_enabled === true && account.payouts_enabled === true &&
    capabilities?.transfers === 'active'
  ) return 'active';
  if (account.details_submitted !== true) return 'onboarding';
  const requirements = account.requirements as StripeObject | undefined;
  return requirements?.disabled_reason ? 'restricted' : 'pending';
}
export function redirectUrl(name: string) {
  const value = Deno.env.get(name);
  if (!value || new URL(value).protocol !== 'https:') {
    throw new Error('Redirect not configured');
  }
  return value;
}
export async function verifyStripeSignature(
  body: string,
  header: string,
  secret: string,
  now = Date.now(),
) {
  const parts = header.split(',').map((part) => part.split('='));
  const timestamp = parts.find(([name]) => name === 't')?.[1];
  if (
    !timestamp || !/^\d+$/.test(timestamp) ||
    Math.abs(now / 1000 - Number(timestamp)) > 300
  ) return false;
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const signature = new Uint8Array(
    await crypto.subtle.sign(
      'HMAC',
      key,
      new TextEncoder().encode(`${timestamp}.${body}`),
    ),
  );
  return parts.filter(([name]) => name === 'v1').some(([, value]) => {
    if (!/^[a-f0-9]{64}$/.test(value ?? '')) return false;
    let difference = 0;
    for (let i = 0; i < signature.length; i++) {
      difference |= signature[i] ^ parseInt(value.slice(i * 2, i * 2 + 2), 16);
    }
    return difference === 0;
  });
}
