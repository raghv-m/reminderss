import { Router, raw } from 'express';
import Stripe from 'stripe';
import { supabase } from '../lib/supabase.js';

const router = Router();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '');

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || '';

// Use raw body for webhook signature verification
router.post('/stripe', raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'] as string;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  console.log(`📥 Stripe webhook: ${event.type}`);

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutCompleted(session);
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionUpdated(subscription);
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionDeleted(subscription);
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        await handlePaymentFailed(invoice);
        break;
      }
    }

    res.json({ received: true });
  } catch (error) {
    console.error('Webhook handler error:', error);
    res.status(500).json({ error: 'Webhook handler failed' });
  }
});

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const userId = session.metadata?.userId;
  const planId = session.metadata?.planId;

  if (!userId || !planId) {
    console.error('Missing metadata in checkout session');
    return;
  }

  const subscriptionId = session.subscription as string;

  // Get subscription details
  const subscription = await stripe.subscriptions.retrieve(subscriptionId) as Stripe.Subscription;

  const periodEnd = (subscription as any).current_period_end as number | undefined;

  await supabase
    .from('users')
    .update({
      plan: planId,
      stripe_subscription_id: subscriptionId,
      subscription_status: 'active',
      current_period_end: periodEnd 
        ? new Date(periodEnd * 1000).toISOString()
        : null,
    })
    .eq('id', userId);

  console.log(`✅ User ${userId} upgraded to ${planId}`);
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  const customerId = subscription.customer as string;

  // Find user by customer ID
  const { data: user } = await supabase
    .from('users')
    .select('id')
    .eq('stripe_customer_id', customerId)
    .single();

  if (!user) {
    console.error('User not found for customer:', customerId);
    return;
  }

  const status = subscription.status === 'active' ? 'active' 
    : subscription.status === 'past_due' ? 'past_due' 
    : 'inactive';

  const periodEnd = (subscription as any).current_period_end as number | undefined;

  await supabase
    .from('users')
    .update({
      subscription_status: status,
      current_period_end: periodEnd
        ? new Date(periodEnd * 1000).toISOString()
        : null,
    })
    .eq('id', user.id);

  console.log(`📝 Subscription updated for user ${user.id}: ${status}`);
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const customerId = subscription.customer as string;

  const { data: user } = await supabase
    .from('users')
    .select('id')
    .eq('stripe_customer_id', customerId)
    .single();

  if (!user) return;

  await supabase
    .from('users')
    .update({
      plan: 'free',
      subscription_status: 'inactive',
      stripe_subscription_id: null,
      current_period_end: null,
    })
    .eq('id', user.id);

  console.log(`❌ Subscription canceled for user ${user.id}`);
}

async function handlePaymentFailed(invoice: Stripe.Invoice) {
  const customerId = invoice.customer as string;

  const { data: user } = await supabase
    .from('users')
    .select('id, phone')
    .eq('stripe_customer_id', customerId)
    .single();

  if (!user) return;

  await supabase
    .from('users')
    .update({ subscription_status: 'past_due' })
    .eq('id', user.id);

  console.log(`⚠️ Payment failed for user ${user.id}`);
}

export { router as webhookRouter };

