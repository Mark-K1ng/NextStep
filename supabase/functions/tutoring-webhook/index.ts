import { createClient } from '@supabase/supabase-js';
import { json } from '../_shared/http.ts';
import {
  connectStatus,
  stripeRequest,
  verifyStripeSignature,
} from '../_shared/tutoring-stripe.ts';

export async function handler(request: Request) {
  if (request.method !== 'POST') {
    return json({ error: 'Method not allowed' }, 405);
  }
  const secret = Deno.env.get('STRIPE_WEBHOOK_SECRET');
  const url = Deno.env.get('SUPABASE_URL');
  const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!secret || !url || !key || !Deno.env.get('STRIPE_SECRET_KEY')) {
    return json({ error: 'Webhook unavailable' }, 503);
  }
  const body = await request.text();
  if (
    body.length > 1_000_000 ||
    !await verifyStripeSignature(
      body,
      request.headers.get('stripe-signature') ?? '',
      secret,
    )
  ) return json({ error: 'Invalid signature' }, 400);
  try {
    const event = JSON.parse(body);
    const supabase = createClient(url, key, {
      auth: { persistSession: false },
    });
    const object = event.data?.object;
    if (event.type === 'account.updated') {
      const account = await stripeRequest(
        `accounts/${encodeURIComponent(object.id)}`,
      );
      const tutor = (account.metadata as Record<string, string>)?.tutor_id;
      if (tutor) {
        const current = await supabase.rpc('tutoring_connect', {
          p_tutor: tutor,
        });
        if (current.error) throw current.error;
        if (current.data?.stripe_account_id === account.id) {
          const updated = await supabase.rpc('tutoring_connect', {
            p_tutor: tutor,
            p_account: account.id,
            p_status: connectStatus(account),
          });
          if (updated.error) throw updated.error;
        }
      }
    } else if (
      [
        'checkout.session.completed',
        'checkout.session.expired',
        'checkout.session.async_payment_succeeded',
        'checkout.session.async_payment_failed',
      ].includes(event.type)
    ) {
      // Retrieve current provider state, so delayed/out-of-order event payloads cannot regress a payment.
      const session = await stripeRequest(
        `checkout/sessions/${encodeURIComponent(object.id)}`,
      );
      const booking = (session.metadata as Record<string, string>)?.booking_id;
      if (
        booking &&
        (session.payment_status === 'paid' || session.status === 'expired')
      ) {
        const result = await supabase.rpc('tutoring_settle', {
          p_event: event.id,
          p_booking: booking,
          p_checkout: session.id,
          p_paid: session.payment_status === 'paid',
          p_amount: session.amount_total,
          p_currency: session.currency,
          p_intent: session.payment_intent,
        });
        if (result.error) throw result.error;
        // A refund can arrive before the checkout-completed webhook. Reconcile the
        // current charge after settling instead of relying on event delivery order.
        if (
          session.payment_status === 'paid' &&
          typeof session.payment_intent === 'string'
        ) {
          const intent = await stripeRequest(
            `payment_intents/${
              encodeURIComponent(session.payment_intent)
            }?expand[]=latest_charge`,
          );
          const charge = intent.latest_charge as Record<string, unknown> | null;
          if (
            charge && typeof charge.amount_refunded === 'number' &&
            charge.amount_refunded > 0
          ) {
            const refund = await supabase.rpc('tutoring_refund', {
              p_event: `${event.id}-refund`,
              p_intent: session.payment_intent,
              p_amount_refunded: charge.amount_refunded,
            });
            if (refund.error) throw refund.error;
          }
        }
      }
    } else if (event.type === 'charge.refunded') {
      const charge = await stripeRequest(
        `charges/${encodeURIComponent(object.id)}`,
      );
      const result = await supabase.rpc('tutoring_refund', {
        p_event: event.id,
        p_intent: charge.payment_intent,
        p_amount_refunded: charge.amount_refunded,
      });
      if (result.error) throw result.error;
    }
    return json({ received: true });
  } catch {
    console.error('Tutoring webhook processing failed');
    return json({ error: 'Webhook processing failed' }, 500);
  }
}
Deno.serve(handler);
