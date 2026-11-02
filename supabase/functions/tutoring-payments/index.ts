import { json, withUser } from '../_shared/http.ts';
import {
  connectStatus,
  redirectUrl,
  stripeRequest,
} from '../_shared/tutoring-stripe.ts';

const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export const handler = withUser(async ({ request, supabase, user }) => {
  if (!Deno.env.get('STRIPE_SECRET_KEY')) {
    return json({ error: 'Payments unavailable' }, 503);
  }
  const body = await request.json();
  if (body.action === 'resume' && uuid.test(body.booking_id ?? '')) {
    const booking = await supabase.from('tutoring_bookings').select(
      'id,status,tutor_id',
    )
      .eq('id', body.booking_id).eq('student_id', user.id).single();
    if (booking.error || booking.data?.status !== 'pending_payment') {
      return json({ error: 'Booking unavailable' }, 409);
    }
    const tutor = await supabase.from('tutor_profiles').select('status').eq(
      'id',
      booking.data.tutor_id,
    ).single();
    const connect = await supabase.rpc('tutoring_connect', {
      p_tutor: booking.data.tutor_id,
    });
    if (
      tutor.error || tutor.data?.status !== 'approved' || connect.error ||
      !connect.data?.stripe_account_id
    ) return json({ error: 'Tutor unavailable' }, 409);
    const account = await stripeRequest(
      `accounts/${connect.data.stripe_account_id}`,
    );
    if (connectStatus(account) !== 'active') {
      return json({ error: 'Tutor payments unavailable' }, 409);
    }
    const payment = await supabase.rpc('tutoring_payment_link', {
      p_booking: booking.data.id,
    });
    if (payment.error || !payment.data?.checkout_id) {
      return json({ error: 'Payment unavailable' }, 409);
    }
    const session = await stripeRequest(
      `checkout/sessions/${payment.data.checkout_id}`,
    );
    if (session.status !== 'open') {
      return json({ error: 'Payment processing or expired' }, 409);
    }
    return json({ url: session.url, booking_id: booking.data.id });
  }
  if (body.action === 'onboard') {
    const refresh = redirectUrl('TUTORING_CONNECT_REFRESH_URL');
    const returnUrl = redirectUrl('TUTORING_CONNECT_RETURN_URL');
    const { data: tutor, error } = await supabase.from('tutor_profiles').select(
      'id,status',
    ).eq('user_id', user.id).single();
    if (error || tutor?.status !== 'approved') {
      return json({ error: 'Approved tutor required' }, 403);
    }
    const existing = await supabase.rpc('tutoring_connect', {
      p_tutor: tutor.id,
    });
    if (existing.error) throw existing.error;
    const account = existing.data?.stripe_account_id
      ? await stripeRequest(`accounts/${existing.data.stripe_account_id}`)
      : await stripeRequest('accounts', {
        type: 'express',
        country: 'RO',
        'capabilities[card_payments][requested]': 'true',
        'capabilities[transfers][requested]': 'true',
        'metadata[tutor_id]': tutor.id,
      }, `tutor-account-${tutor.id}`);
    const saved = await supabase.rpc('tutoring_connect', {
      p_tutor: tutor.id,
      p_account: account.id,
      p_status: connectStatus(account),
    });
    if (saved.error) throw saved.error;
    const link = await stripeRequest('account_links', {
      account: String(account.id),
      refresh_url: refresh,
      return_url: returnUrl,
      type: 'account_onboarding',
    });
    return json({ url: link.url });
  }
  if (
    body.action !== 'checkout' || !uuid.test(body.tutor_id ?? '') ||
    !uuid.test(body.request_id ?? '') || typeof body.subject !== 'string' ||
    body.subject.length > 100 || typeof body.starts_at !== 'string' ||
    !Number.isFinite(Date.parse(body.starts_at))
  ) return json({ error: 'Invalid request' }, 400);
  const success = redirectUrl('TUTORING_CHECKOUT_SUCCESS_URL');
  const cancel = redirectUrl('TUTORING_CHECKOUT_CANCEL_URL');
  const { data: connect, error: connectError } = await supabase.rpc(
    'tutoring_connect',
    { p_tutor: body.tutor_id },
  );
  if (connectError || !connect?.stripe_account_id) {
    return json({ error: 'Tutor payments unavailable' }, 409);
  }
  const account = await stripeRequest(`accounts/${connect.stripe_account_id}`);
  const state = connectStatus(account);
  const stateUpdate = await supabase.rpc('tutoring_connect', {
    p_tutor: body.tutor_id,
    p_account: account.id,
    p_status: state,
  });
  if (stateUpdate.error) throw stateUpdate.error;
  if (state !== 'active') {
    return json({ error: 'Tutor payments unavailable' }, 409);
  }
  // Client supplies no authoritative money values. Database validates and snapshots all amounts.
  const { data: booking, error } = await supabase.rpc('tutoring_reserve', {
    p_student: user.id,
    p_tutor: body.tutor_id,
    p_subject: body.subject,
    p_start: body.starts_at,
    p_id: body.request_id,
  });
  if (error) return json({ error: 'Slot unavailable' }, 409);
  const payment = await supabase.rpc('tutoring_payment_link', {
    p_booking: booking.id,
  });
  if (payment.error) throw payment.error;
  if (payment.data?.checkout_id) {
    const current = await stripeRequest(
      `checkout/sessions/${payment.data.checkout_id}`,
    );
    if (current.status === 'open') {
      return json({ url: current.url, booking_id: booking.id });
    }
    return json({ error: 'Payment is already processing or expired' }, 409);
  }
  const checkout = await stripeRequest('checkout/sessions', {
    mode: 'payment',
    success_url: success,
    cancel_url: cancel,
    'payment_method_types[0]': 'card',
    'line_items[0][quantity]': '1',
    'line_items[0][price_data][currency]': 'ron',
    'line_items[0][price_data][unit_amount]': String(booking.amount_minor),
    'line_items[0][price_data][product_data][name]':
      `Meditații · ${booking.subject} · 60 min`,
    'payment_intent_data[application_fee_amount]': String(
      booking.platform_fee_minor,
    ),
    'payment_intent_data[transfer_data][destination]':
      connect.stripe_account_id,
    'metadata[booking_id]': booking.id,
    'payment_intent_data[metadata][booking_id]': booking.id,
    client_reference_id: booking.id,
    // Stable across retries, including the expiry parameter required by Stripe idempotency.
    expires_at: String(
      Math.floor(Date.parse(booking.created_at) / 1000) + 35 * 60,
    ),
  }, `lesson-checkout-${booking.id}`);
  const linked = await supabase.rpc('tutoring_payment_link', {
    p_booking: booking.id,
    p_checkout: checkout.id,
  });
  if (linked.error) throw linked.error;
  return json({ url: checkout.url, booking_id: booking.id });
});
Deno.serve(handler);
