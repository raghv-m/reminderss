import { Router } from 'express';
import Stripe from 'stripe';
import { supabase } from '../lib/supabase.js';

const router = Router();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2025-04-30.basil',
});

// Price IDs - replace with your actual Stripe price IDs
const PRICE_IDS: Record<string, string> = {
  pro: process.env.STRIPE_PRICE_PRO || 'price_pro_placeholder',
  family: process.env.STRIPE_PRICE_FAMILY || 'price_family_placeholder',
};

// Create checkout session
router.post('/checkout', async (req, res) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    const { planId } = req.body;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (!planId || !PRICE_IDS[planId]) {
      return res.status(400).json({ error: 'Invalid plan' });
    }

    // Get user
    const { data: user } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Create or get Stripe customer
    let customerId = user.stripe_customer_id;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        name: user.name || undefined,
        metadata: { userId },
      });
      customerId = customer.id;

      await supabase
        .from('users')
        .update({ stripe_customer_id: customerId })
        .eq('id', userId);
    }

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: PRICE_IDS[planId],
          quantity: 1,
        },
      ],
      success_url: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/billing/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/billing/cancel`,
      metadata: { userId, planId },
    });

    res.json({ url: session.url });
  } catch (error) {
    console.error('Checkout error:', error);
    res.status(500).json({ error: 'Failed to create checkout session' });
  }
});

// Get subscription status
router.get('/status', async (req, res) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { data: user } = await supabase
      .from('users')
      .select('plan, subscription_status, current_period_end, stripe_subscription_id')
      .eq('id', userId)
      .single();

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      plan: user.plan || 'free',
      status: user.subscription_status || 'inactive',
      currentPeriodEnd: user.current_period_end,
      hasSubscription: !!user.stripe_subscription_id,
    });
  } catch (error) {
    console.error('Status error:', error);
    res.status(500).json({ error: 'Failed to get subscription status' });
  }
});

// Cancel subscription
router.post('/cancel', async (req, res) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { data: user } = await supabase
      .from('users')
      .select('stripe_subscription_id')
      .eq('id', userId)
      .single();

    if (!user?.stripe_subscription_id) {
      return res.status(400).json({ error: 'No active subscription' });
    }

    // Cancel at period end
    await stripe.subscriptions.update(user.stripe_subscription_id, {
      cancel_at_period_end: true,
    });

    await supabase
      .from('users')
      .update({ subscription_status: 'canceled' })
      .eq('id', userId);

    res.json({ success: true, message: 'Subscription will cancel at period end' });
  } catch (error) {
    console.error('Cancel error:', error);
    res.status(500).json({ error: 'Failed to cancel subscription' });
  }
});

export { router as billingRouter };

