import { useNavigate, useSearchParams } from 'react-router-dom';
import { Flame, Target, Calendar, Bell, Check, Zap } from 'lucide-react';
import { getGoogleAuthUrl, createCheckoutSession } from '../lib/api';

const plans = [
  {
    id: 'free',
    name: 'Free',
    price: '$0',
    period: '/forever',
    description: 'Get started with basic accountability',
    features: [
      'Daily SMS check-ins',
      '2 goals max',
      'Basic streak tracking',
      'Manual scheduling',
    ],
    cta: 'Get Started',
    popular: false,
  },
  {
    id: 'pro',
    name: 'Pro',
    price: '$10.99',
    period: '/month',
    description: 'Full accountability system',
    features: [
      'Everything in Free',
      'Unlimited goals',
      'Google Calendar sync',
      'Auto-scheduling AI',
      'Photo/video proof',
      'Brutal motivation mode 🔥',
      'Priority support',
    ],
    cta: 'Start Pro',
    popular: true,
  },
  {
    id: 'family',
    name: 'Family',
    price: '$20.99',
    period: '/month',
    description: 'Accountability for the whole family',
    features: [
      'Everything in Pro',
      'Up to 4 family members',
      'Family dashboard',
      'Shared goals & challenges',
      'Group streaks',
    ],
    cta: 'Start Family',
    popular: false,
  },
];

export function Landing() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const selectedPlan = searchParams.get('plan');

  const handleGetStarted = async (planId: string) => {
    const userId = localStorage.getItem('userId');
    
    if (!userId) {
      // Not logged in - redirect to Google auth with plan in state
      const { url } = await getGoogleAuthUrl();
      localStorage.setItem('pendingPlan', planId);
      window.location.href = url;
      return;
    }

    if (planId === 'free') {
      navigate('/');
      return;
    }

    // Create Stripe checkout session
    try {
      const { url } = await createCheckoutSession(planId);
      window.location.href = url;
    } catch (error) {
      console.error('Failed to create checkout session:', error);
    }
  };

  return (
    <div className="min-h-screen bg-dark-950">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary-500/10 via-transparent to-orange-500/10" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16">
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-6">
              <Flame className="w-10 h-10 text-primary-500" />
              <h1 className="text-4xl md:text-5xl font-bold">DisciplineOS</h1>
            </div>
            <p className="text-xl md:text-2xl text-dark-300 mb-4 max-w-2xl mx-auto">
              Your personal accountability coach that won't let you off easy.
            </p>
            <p className="text-dark-400 mb-8">
              Daily check-ins • Auto-scheduling • Brutal motivation
            </p>
          </div>
        </div>
      </div>

      {/* Features */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <div className="grid md:grid-cols-3 gap-8 mb-20">
          {[
            { icon: Bell, title: 'Daily SMS Check-ins', desc: 'Get asked if you hit your goals. No hiding.' },
            { icon: Calendar, title: 'Smart Scheduling', desc: 'Auto-schedule around your calendar.' },
            { icon: Target, title: 'Streak Tracking', desc: 'Build momentum with visible progress.' },
          ].map((f) => (
            <div key={f.title} className="text-center p-6">
              <f.icon className="w-12 h-12 text-primary-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">{f.title}</h3>
              <p className="text-dark-400">{f.desc}</p>
            </div>
          ))}
        </div>

        {/* Pricing Cards */}
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">Choose Your Plan</h2>
          <p className="text-dark-400">Start free. Upgrade when you're ready.</p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`relative rounded-2xl p-6 ${
                plan.popular
                  ? 'bg-gradient-to-b from-primary-500/20 to-dark-800 border-2 border-primary-500'
                  : 'bg-dark-800 border border-dark-700'
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="bg-primary-500 text-white text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1">
                    <Zap className="w-3 h-3" /> MOST POPULAR
                  </span>
                </div>
              )}

              <div className="text-center mb-6">
                <h3 className="text-xl font-bold mb-2">{plan.name}</h3>
                <div className="flex items-baseline justify-center gap-1">
                  <span className="text-4xl font-bold">{plan.price}</span>
                  <span className="text-dark-400">{plan.period}</span>
                </div>
                <p className="text-dark-400 text-sm mt-2">{plan.description}</p>
              </div>

              <ul className="space-y-3 mb-6">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-2 text-sm">
                    <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              <button
                onClick={() => handleGetStarted(plan.id)}
                className={`w-full py-3 rounded-lg font-semibold transition-colors ${
                  plan.popular
                    ? 'bg-primary-500 hover:bg-primary-600 text-white'
                    : 'bg-dark-700 hover:bg-dark-600 text-white'
                }`}
              >
                {plan.cta}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-dark-800 py-8">
        <div className="max-w-7xl mx-auto px-4 text-center text-dark-500 text-sm">
          <p>© 2024 DisciplineOS. Built for those who refuse to be average.</p>
        </div>
      </footer>
    </div>
  );
}

