import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';
import { getStripe } from '../../../../lib/stripe';

function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SECRET_KEY!,
  );
}

function getSubscriptionPeriodEnd(subscription: Stripe.Subscription): string | null {
  const item = subscription.items?.data?.[0];
  if (item?.current_period_end) {
    return new Date(item.current_period_end * 1000).toISOString();
  }
  return null;
}

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get('stripe-signature');

  if (!signature) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!,
    );
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  const supabase = getAdminClient();

  switch (event.type) {
    // One-time payment (lifetime) or subscription start (annual)
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session;
      const userId = session.metadata?.supabase_user_id;
      const planType = session.metadata?.plan_type;
      if (!userId) break;

      if (planType === 'lifetime' && session.payment_status === 'paid') {
        await supabase
          .from('profiles')
          .update({
            stripe_customer_id: session.customer as string,
            plan: 'pro',
            plan_type: 'lifetime',
            purchased_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq('id', userId);
      }

      if (planType === 'annual' && session.subscription) {
        const subscription = await getStripe().subscriptions.retrieve(
          session.subscription as string,
        );
        await supabase
          .from('profiles')
          .update({
            stripe_customer_id: session.customer as string,
            plan: 'pro',
            plan_type: 'annual',
            subscription_id: subscription.id,
            current_period_end: getSubscriptionPeriodEnd(subscription),
            updated_at: new Date().toISOString(),
          })
          .eq('id', userId);
      }
      break;
    }

    // Annual subscription renewed or changed
    case 'customer.subscription.updated': {
      const subscription = event.data.object as Stripe.Subscription;
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('subscription_id', subscription.id)
        .single();

      if (!profile) break;

      await supabase
        .from('profiles')
        .update({
          current_period_end: getSubscriptionPeriodEnd(subscription),
          updated_at: new Date().toISOString(),
        })
        .eq('id', profile.id);
      break;
    }

    // Annual subscription canceled or expired
    case 'customer.subscription.deleted': {
      const subscription = event.data.object as Stripe.Subscription;
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('subscription_id', subscription.id)
        .single();

      if (!profile) break;

      await supabase
        .from('profiles')
        .update({
          plan: 'free',
          plan_type: null,
          subscription_id: null,
          current_period_end: null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', profile.id);
      break;
    }
  }

  return NextResponse.json({ received: true });
}
