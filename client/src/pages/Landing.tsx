import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Flame, Target, Calendar, Bell, Check, Zap, ChevronDown, Star, Smartphone, BarChart3, Users, X } from 'lucide-react';
import { getGoogleAuthUrl, createCheckoutSession } from '../lib/api';

const testimonials = [
  {
    name: 'Sarah K.',
    role: 'Medical Student',
    text: "I finally stick to my study plan. The daily reminders feel like a personal trainer in my pocket.",
    avatar: '👩‍⚕️',
    streak: 47,
  },
  {
    name: 'Marcus T.',
    role: 'Software Engineer',
    text: "Went from 2 gym days a month to 5 per week. The brutal mode actually works.",
    avatar: '💪',
    streak: 89,
  },
  {
    name: 'Emily R.',
    role: 'Entrepreneur',
    text: "The auto-scheduler changed everything. I upload my work shifts and it fits my goals around them perfectly.",
    avatar: '🚀',
    streak: 134,
  },
];

const faqs = [
  { q: "Will it spam me?", a: "Only 1–3 smart reminders per day. You control everything in settings." },
  { q: "What if I'm super busy?", a: "It respects your existing calendar and work shifts. Only fills genuinely free slots." },
  { q: "Do I need to plan everything myself?", a: "Nope. Just set your goals once – the algorithm builds your daily schedule automatically." },
  { q: "Can I try before paying?", a: "Yes! Start free with no credit card. Upgrade only when you see results." },
];

const plans = [
  {
    id: 'free',
    name: 'Starter',
    price: '$0',
    period: '/forever',
    description: 'See if discipline.guru works for you',
    features: ['Daily SMS check-ins', '2 goals max', 'Basic streak tracking', 'Manual scheduling'],
    cta: 'Start Free Now',
    popular: false,
  },
  {
    id: 'pro',
    name: 'Pro',
    price: '$10.99',
    period: '/month',
    description: 'The full discipline system',
    features: ['Everything in Free', 'Unlimited goals', 'Google Calendar sync', 'Auto-scheduling AI', 'Work shift upload (OCR)', 'Photo/video proof', 'Brutal motivation mode 🔥'],
    cta: 'Start 7-Day Free Trial',
    popular: true,
  },
  {
    id: 'family',
    name: 'Family',
    price: '$20.99',
    period: '/month',
    description: 'Discipline for the whole squad',
    features: ['Everything in Pro', 'Up to 4 family members', 'Family dashboard', 'Shared goals & challenges', 'Group streaks & competition'],
    cta: 'Start Family Trial',
    popular: false,
  },
];

export function Landing() {
  const navigate = useNavigate();
  const [_searchParams] = useSearchParams();
  void _searchParams;
  const [spotsLeft, setSpotsLeft] = useState(312);
  const [showExitPopup, setShowExitPopup] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  useEffect(() => {
    // Fake countdown for urgency
    const timer = setInterval(() => {
      setSpotsLeft(prev => prev > 50 ? prev - 1 : prev);
    }, 30000);

    // Exit intent
    const handleMouseLeave = (e: MouseEvent) => {
      if (e.clientY < 10 && !localStorage.getItem('exitShown')) {
        setShowExitPopup(true);
        localStorage.setItem('exitShown', 'true');
      }
    };
    document.addEventListener('mouseleave', handleMouseLeave);
    return () => {
      clearInterval(timer);
      document.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, []);

  const handleGetStarted = async (planId: string) => {
    const userId = localStorage.getItem('userId');
    if (!userId) {
      const { url } = await getGoogleAuthUrl();
      localStorage.setItem('pendingPlan', planId);
      window.location.href = url;
      return;
    }
    if (planId === 'free') {
      navigate('/');
      return;
    }
    try {
      const { url } = await createCheckoutSession(planId);
      window.location.href = url;
    } catch (error) {
      console.error('Failed to create checkout session:', error);
    }
  };

  return (
    <div className="min-h-screen bg-dark-950 text-white">
      {/* Exit Intent Popup */}
      {showExitPopup && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="bg-dark-900 rounded-2xl p-8 max-w-md relative border border-primary-500">
            <button onClick={() => setShowExitPopup(false)} className="absolute top-4 right-4 text-dark-400 hover:text-white">
              <X className="w-6 h-6" />
            </button>
            <div className="text-center">
              <div className="text-5xl mb-4">⏰</div>
              <h3 className="text-2xl font-bold mb-2">Wait! Don't leave yet...</h3>
              <p className="text-dark-300 mb-6">Get your first personalized schedule in 30 seconds – completely free.</p>
              <button onClick={() => { setShowExitPopup(false); handleGetStarted('free'); }} className="w-full bg-primary-500 hover:bg-primary-600 py-4 rounded-xl font-bold text-lg">
                Get My Free Schedule →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* HERO SECTION */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary-500/20 via-transparent to-orange-500/20" />
        <div className="absolute top-10 right-10 text-6xl animate-pulse hidden lg:block">🔥</div>

        <div className="max-w-6xl mx-auto px-4 pt-12 pb-20">
          {/* Live streak counter */}
          <div className="flex justify-center mb-8">
            <div className="bg-dark-800/80 backdrop-blur px-4 py-2 rounded-full flex items-center gap-2 text-sm border border-dark-700">
              <Flame className="w-4 h-4 text-orange-500" />
              <span>Current longest user streak: <strong className="text-orange-500">187 days</strong> 🔥</span>
            </div>
          </div>

          <div className="text-center max-w-4xl mx-auto">
            <h1 className="text-4xl md:text-6xl font-black mb-6 leading-tight">
              Never Miss a Workout, Study Session, or Goal Again
            </h1>
            <p className="text-xl md:text-2xl text-dark-300 mb-6 leading-relaxed">
              discipline.guru sends you daily reminders, auto-builds your perfect schedule around your work shifts, syncs with Google Calendar, and tracks your fitness + learning progress – <strong className="text-white">all in one app.</strong>
            </p>

            <button
              onClick={() => handleGetStarted('free')}
              className="bg-primary-500 hover:bg-primary-600 text-white text-xl font-bold py-5 px-10 rounded-xl shadow-2xl shadow-primary-500/30 transition-all hover:scale-105 mb-4"
            >
              Start My Free 7-Day Trial →
            </button>
            <p className="text-dark-400 text-sm">✓ No credit card required • ✓ Cancel anytime • ✓ First reminder tomorrow</p>

            {/* Phone mockup */}
            <div className="mt-12 relative">
              <div className="bg-dark-800 rounded-3xl p-6 max-w-sm mx-auto border border-dark-700 shadow-2xl">
                <div className="bg-dark-900 rounded-2xl p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 bg-primary-500 rounded-full flex items-center justify-center">
                      <Bell className="w-5 h-5" />
                    </div>
                    <div className="text-left">
                      <p className="font-bold text-sm">discipline.guru</p>
                      <p className="text-dark-400 text-xs">now</p>
                    </div>
                  </div>
                  <p className="text-left text-lg">Time to crush your workout! 💪 You've got 90 mins blocked. Ready in 5?</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* SOCIAL PROOF */}
      <div className="bg-dark-900 py-16">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-12">
            <p className="text-primary-500 font-semibold mb-2">TRUSTED BY THOUSANDS</p>
            <h2 className="text-3xl md:text-4xl font-bold">Join 8,347 people who built unbreakable discipline in 2025</h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((t, i) => (
              <div key={i} className="bg-dark-800 rounded-2xl p-6 border border-dark-700">
                <div className="flex items-center gap-1 text-yellow-500 mb-4">
                  {[...Array(5)].map((_, j) => <Star key={j} className="w-4 h-4 fill-current" />)}
                </div>
                <p className="text-dark-200 mb-4 italic">"{t.text}"</p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="text-3xl">{t.avatar}</div>
                    <div>
                      <p className="font-semibold">{t.name}</p>
                      <p className="text-dark-400 text-sm">{t.role}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-orange-500 font-bold">{t.streak} 🔥</p>
                    <p className="text-dark-400 text-xs">day streak</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* HOW IT WORKS */}
      <div className="py-20">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-16">
            <p className="text-primary-500 font-semibold mb-2">SIMPLE SETUP</p>
            <h2 className="text-3xl md:text-4xl font-bold">How It Works</h2>
          </div>

          <div className="grid md:grid-cols-4 gap-8">
            {[
              { num: '1', icon: Target, title: 'Set Your Goals', desc: 'Gym, studying, side hustle – tell us what matters to you.' },
              { num: '2', icon: Calendar, title: 'Connect Calendar', desc: 'One click to sync Google Calendar. We see your busy times.' },
              { num: '3', icon: Smartphone, title: 'Upload Work Schedule', desc: 'Screenshot your shifts – our OCR reads them automatically.' },
              { num: '4', icon: Bell, title: 'Get Smart Reminders', desc: 'Wake up to a perfect schedule + reminders that actually work.' },
            ].map((step, i) => (
              <div key={i} className="text-center">
                <div className="relative inline-block mb-4">
                  <div className="w-16 h-16 bg-primary-500/20 rounded-2xl flex items-center justify-center">
                    <step.icon className="w-8 h-8 text-primary-500" />
                  </div>
                  <div className="absolute -top-2 -right-2 w-7 h-7 bg-primary-500 rounded-full flex items-center justify-center text-sm font-bold">
                    {step.num}
                  </div>
                </div>
                <h3 className="font-bold text-lg mb-2">{step.title}</h3>
                <p className="text-dark-400">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* FEATURES */}
      <div className="bg-dark-900 py-20">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-16">
            <p className="text-primary-500 font-semibold mb-2">POWERFUL FEATURES</p>
            <h2 className="text-3xl md:text-4xl font-bold">Everything You Need to Stay Disciplined</h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: Bell, title: 'Smart Daily Reminders', desc: 'Customizable push notifications that adapt to your schedule. Never annoying, always helpful.' },
              { icon: Calendar, title: 'Auto Schedule Builder', desc: 'Upload work shifts, connect calendar, and watch your perfect daily routine appear.' },
              { icon: Users, title: 'Google Calendar Sync', desc: 'Two-way sync. Events appear in your calendar. Busy times are respected.' },
              { icon: BarChart3, title: 'Progress Dashboard', desc: 'Beautiful charts showing your gym sessions, study hours, and goal completion rates.' },
              { icon: Flame, title: 'Streaks & Rewards', desc: 'Build momentum with visible streaks. Compete with yourself and others.' },
              { icon: Zap, title: 'Brutal Mode 🔥', desc: 'Optional "Hamza-style" motivation. When gentle reminders don\'t cut it.' },
            ].map((f, i) => (
              <div key={i} className="bg-dark-800 rounded-2xl p-6 border border-dark-700 hover:border-primary-500/50 transition-colors">
                <f.icon className="w-10 h-10 text-primary-500 mb-4" />
                <h3 className="font-bold text-lg mb-2">{f.title}</h3>
                <p className="text-dark-400">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* FAQ */}
      <div className="py-20">
        <div className="max-w-3xl mx-auto px-4">
          <div className="text-center mb-12">
            <p className="text-primary-500 font-semibold mb-2">GOT QUESTIONS?</p>
            <h2 className="text-3xl md:text-4xl font-bold">Frequently Asked</h2>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, i) => (
              <div key={i} className="bg-dark-800 rounded-xl border border-dark-700 overflow-hidden">
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-dark-700/50 transition-colors"
                >
                  <span className="font-semibold">{faq.q}</span>
                  <ChevronDown className={`w-5 h-5 transition-transform ${openFaq === i ? 'rotate-180' : ''}`} />
                </button>
                {openFaq === i && (
                  <div className="px-6 pb-4 text-dark-300">{faq.a}</div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* PRICING */}
      <div className="bg-dark-900 py-20" id="pricing">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-12">
            <p className="text-primary-500 font-semibold mb-2">SIMPLE PRICING</p>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Choose Your Plan</h2>
            <p className="text-dark-400">Start free. Upgrade when you're ready for more.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {plans.map((plan) => (
              <div key={plan.id} className={`relative rounded-2xl p-6 ${plan.popular ? 'bg-gradient-to-b from-primary-500/20 to-dark-800 border-2 border-primary-500 scale-105' : 'bg-dark-800 border border-dark-700'}`}>
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
                <button onClick={() => handleGetStarted(plan.id)} className={`w-full py-3 rounded-lg font-semibold transition-all ${plan.popular ? 'bg-primary-500 hover:bg-primary-600 text-white hover:scale-105' : 'bg-dark-700 hover:bg-dark-600 text-white'}`}>
                  {plan.cta}
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* FINAL CTA */}
      <div className="py-20 bg-gradient-to-br from-primary-500/20 to-dark-950">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-5xl font-bold mb-6">
            Ready to become the most disciplined version of yourself?
          </h2>
          <p className="text-xl text-dark-300 mb-8">
            Your first personalized schedule arrives tomorrow morning.
          </p>

          <button onClick={() => handleGetStarted('pro')} className="bg-white text-dark-900 text-xl font-bold py-5 px-12 rounded-xl shadow-2xl hover:scale-105 transition-all mb-6">
            Start Free Now – First Reminder Tomorrow →
          </button>

          {/* Urgency countdown */}
          <div className="inline-flex items-center gap-2 bg-orange-500/20 text-orange-400 px-4 py-2 rounded-full">
            <Flame className="w-5 h-5" />
            <span>First 500 users get lifetime 40% off – <strong>{spotsLeft} spots left</strong></span>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-dark-800 py-8">
        <div className="max-w-6xl mx-auto px-4 text-center text-dark-500 text-sm">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Flame className="w-5 h-5 text-primary-500" />
            <span className="font-bold text-white">discipline.guru</span>
          </div>
          <p>© 2025 discipline.guru – Built for those who refuse to be average.</p>
        </div>
      </footer>
    </div>
  );
}

