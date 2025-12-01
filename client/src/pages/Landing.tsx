import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { Flame, Target, Calendar, Bell, Check, Zap, ChevronDown, Star, Smartphone, BarChart3, Users, X, Shield, Clock, Brain, TrendingUp, MessageSquare, Github, Twitter, Linkedin, ExternalLink, Heart } from 'lucide-react';
import { getGoogleAuthUrl, createCheckoutSession } from '../lib/api';
import { Navbar } from '../components/Navbar';

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
  { q: "Will it spam me with notifications?", a: "Never. You get 1-3 smart reminders per day, fully customizable. Choose SMS, push, or email. Pause anytime." },
  { q: "What if I have an unpredictable work schedule?", a: "That's exactly why we built shift upload! Take a screenshot of your work roster – our OCR reads it instantly and blocks those times before scheduling your goals." },
  { q: "Do I need to plan everything myself?", a: "Nope. Just tell us your goals once (e.g., 'gym 5x/week', 'study 2 hours daily'). Our algorithm analyzes your calendar and builds the optimal schedule automatically." },
  { q: "How is this different from a regular to-do app?", a: "To-do apps list tasks. We actively coach you. We send reminders, track completion with photo proof, build streaks, and escalate motivation when you slip. It's accountability, not just planning." },
  { q: "Can I try before paying?", a: "Absolutely. Start free forever with 2 goals. No credit card needed. Upgrade to Pro only when you see results." },
  { q: "What happens to my data?", a: "Your data is encrypted and stored securely on Supabase (enterprise-grade PostgreSQL). We never sell your data. You can export or delete everything anytime." },
  { q: "Does it work internationally?", a: "Yes! We support all timezones, SMS works in 180+ countries via Twilio, and Google Calendar syncs globally." },
];

const stats = [
  { value: '8,347+', label: 'Active Users' },
  { value: '2.1M+', label: 'Goals Completed' },
  { value: '94%', label: 'Stick Rate After 30 Days' },
  { value: '187', label: 'Longest Active Streak' },
];

const integrations = [
  { name: 'Google Calendar', desc: 'Two-way sync', icon: '📅' },
  { name: 'Twilio SMS', desc: 'Global messaging', icon: '📱' },
  { name: 'Stripe', desc: 'Secure payments', icon: '💳' },
  { name: 'Supabase', desc: 'Enterprise database', icon: '🗄️' },
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
      <Navbar />

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
      <div className="relative overflow-hidden" id="features">
        <div className="absolute inset-0 bg-gradient-to-br from-primary-500/20 via-transparent to-orange-500/20" />
        <div className="absolute top-10 right-10 text-6xl animate-pulse hidden lg:block">🔥</div>

        <div className="max-w-6xl mx-auto px-4 pt-24 pb-20">
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

      {/* STATS BAR */}
      <div className="py-16 bg-dark-800">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, i) => (
              <div key={i} className="text-center">
                <p className="text-3xl md:text-4xl font-bold text-primary-500">{stat.value}</p>
                <p className="text-dark-400">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* HOW THE ALGORITHM WORKS */}
      <div className="py-20">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-16">
            <p className="text-primary-500 font-semibold mb-2">UNDER THE HOOD</p>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">The Science Behind Your Perfect Schedule</h2>
            <p className="text-dark-400 max-w-2xl mx-auto">Our scheduling algorithm considers multiple factors to find the optimal time for each goal.</p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-dark-800 rounded-2xl p-8 border border-dark-700">
              <Brain className="w-12 h-12 text-primary-500 mb-4" />
              <h3 className="text-xl font-bold mb-3">Smart Time Analysis</h3>
              <ul className="space-y-3 text-dark-300">
                <li className="flex items-start gap-2"><Check className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" /> Reads your Google Calendar for existing commitments</li>
                <li className="flex items-start gap-2"><Check className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" /> Imports work shifts from screenshots via OCR</li>
                <li className="flex items-start gap-2"><Check className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" /> Identifies free blocks between 6 AM - 10 PM</li>
                <li className="flex items-start gap-2"><Check className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" /> Respects your preferred times for each activity</li>
              </ul>
            </div>
            <div className="bg-dark-800 rounded-2xl p-8 border border-dark-700">
              <TrendingUp className="w-12 h-12 text-primary-500 mb-4" />
              <h3 className="text-xl font-bold mb-3">Priority-Based Scheduling</h3>
              <ul className="space-y-3 text-dark-300">
                <li className="flex items-start gap-2"><Check className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" /> High-priority goals get scheduled first</li>
                <li className="flex items-start gap-2"><Check className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" /> Gym sessions: 90 min blocks (warm-up + workout)</li>
                <li className="flex items-start gap-2"><Check className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" /> Study sessions: Customizable duration (default 2 hrs)</li>
                <li className="flex items-start gap-2"><Check className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" /> Auto-creates Google Calendar events with reminders</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* INTEGRATIONS */}
      <div className="py-20 bg-dark-900">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-12">
            <p className="text-primary-500 font-semibold mb-2">BUILT WITH THE BEST</p>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Enterprise-Grade Infrastructure</h2>
            <p className="text-dark-400">We use the same technology trusted by Fortune 500 companies.</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {integrations.map((int, i) => (
              <div key={i} className="bg-dark-800 rounded-xl p-6 text-center border border-dark-700">
                <div className="text-4xl mb-3">{int.icon}</div>
                <p className="font-semibold">{int.name}</p>
                <p className="text-dark-400 text-sm">{int.desc}</p>
              </div>
            ))}
          </div>

          <div className="mt-12 grid md:grid-cols-3 gap-6">
            <div className="flex items-center gap-4 bg-dark-800 rounded-xl p-4 border border-dark-700">
              <Shield className="w-10 h-10 text-green-500" />
              <div>
                <p className="font-semibold">256-bit SSL Encryption</p>
                <p className="text-dark-400 text-sm">Bank-level security</p>
              </div>
            </div>
            <div className="flex items-center gap-4 bg-dark-800 rounded-xl p-4 border border-dark-700">
              <Clock className="w-10 h-10 text-blue-500" />
              <div>
                <p className="font-semibold">99.9% Uptime SLA</p>
                <p className="text-dark-400 text-sm">Always available</p>
              </div>
            </div>
            <div className="flex items-center gap-4 bg-dark-800 rounded-xl p-4 border border-dark-700">
              <MessageSquare className="w-10 h-10 text-purple-500" />
              <div>
                <p className="font-semibold">24/7 Support</p>
                <p className="text-dark-400 text-sm">We're here to help</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* FINAL CTA */}
      <div className="py-24 bg-gradient-to-br from-primary-500/20 via-dark-950 to-orange-500/20">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-5xl font-bold mb-6">
            Ready to become the most disciplined version of yourself?
          </h2>
          <p className="text-xl text-dark-300 mb-8 max-w-2xl mx-auto">
            Stop relying on willpower alone. Let our system hold you accountable, build your schedule, and track your progress – automatically.
          </p>

          <button onClick={() => handleGetStarted('pro')} className="bg-white text-dark-900 text-xl font-bold py-5 px-12 rounded-xl shadow-2xl hover:scale-105 transition-all mb-6">
            Start Free Now – First Reminder Tomorrow →
          </button>

          <div className="inline-flex items-center gap-2 bg-orange-500/20 text-orange-400 px-4 py-2 rounded-full mb-8">
            <Flame className="w-5 h-5" />
            <span>First 500 users get lifetime 40% off – <strong>{spotsLeft} spots left</strong></span>
          </div>

          <p className="text-dark-500 text-sm">✓ 7-day free trial • ✓ No credit card required • ✓ Cancel anytime</p>
        </div>
      </div>

      {/* COMPREHENSIVE FOOTER */}
      <footer className="bg-dark-900 border-t border-dark-800">
        <div className="max-w-6xl mx-auto px-4 py-16">
          <div className="grid md:grid-cols-4 gap-12 mb-12">
            {/* Brand */}
            <div className="md:col-span-1">
              <div className="flex items-center gap-2 mb-4">
                <Flame className="w-8 h-8 text-primary-500" />
                <span className="text-xl font-bold">discipline.guru</span>
              </div>
              <p className="text-dark-400 mb-4">
                Your personal accountability coach that won't let you off easy. Build unbreakable discipline with smart scheduling and brutal motivation.
              </p>
              <div className="flex gap-4">
                <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="text-dark-400 hover:text-white transition-colors">
                  <Twitter className="w-5 h-5" />
                </a>
                <a href="https://github.com/raghv-m" target="_blank" rel="noopener noreferrer" className="text-dark-400 hover:text-white transition-colors">
                  <Github className="w-5 h-5" />
                </a>
                <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="text-dark-400 hover:text-white transition-colors">
                  <Linkedin className="w-5 h-5" />
                </a>
              </div>
            </div>

            {/* Product */}
            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-3 text-dark-400">
                <li><a href="#pricing" className="hover:text-white transition-colors">Pricing</a></li>
                <li><a href="#features" className="hover:text-white transition-colors">Features</a></li>
                <li><a href="#" className="hover:text-white transition-colors">How It Works</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Integrations</a></li>
                <li><a href="#" className="hover:text-white transition-colors">API (Coming Soon)</a></li>
              </ul>
            </div>

            {/* Company */}
            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-3 text-dark-400">
                <li><a href="https://www.raghv.dev" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors flex items-center gap-1">About the Creator <ExternalLink className="w-3 h-3" /></a></li>
                <li><Link to="/blog" className="hover:text-white transition-colors">Blog</Link></li>
                <li><Link to="/careers" className="hover:text-white transition-colors">Careers</Link></li>
                <li><Link to="/contact" className="hover:text-white transition-colors">Contact</Link></li>
              </ul>
            </div>

            {/* Legal */}
            <div>
              <h4 className="font-semibold mb-4">Legal</h4>
              <ul className="space-y-3 text-dark-400">
                <li><Link to="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link></li>
                <li><Link to="/terms" className="hover:text-white transition-colors">Terms of Service</Link></li>
                <li><Link to="/cookies" className="hover:text-white transition-colors">Cookie Policy</Link></li>
                <li><Link to="/privacy" className="hover:text-white transition-colors">GDPR</Link></li>
              </ul>
            </div>
          </div>

          {/* Canadian Badge */}
          <div className="flex justify-center mb-8">
            <div className="bg-gradient-to-r from-red-500/20 to-red-600/20 border border-red-500/30 rounded-xl px-6 py-4 flex items-center gap-4">
              <span className="text-4xl">🍁</span>
              <div>
                <p className="font-bold text-lg">100% Canadian Company</p>
                <p className="text-dark-400 text-sm">Proudly built and operated in Canada 🇨🇦</p>
              </div>
            </div>
          </div>

          {/* Bottom bar */}
          <div className="border-t border-dark-800 pt-8">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <p className="text-dark-500 text-sm">
                © 2025 discipline.guru. All rights reserved.
              </p>
              <p className="text-dark-500 text-sm flex items-center gap-1">
                Made with <Heart className="w-4 h-4 text-red-500 fill-current" /> by{' '}
                <a href="https://www.raghv.dev" target="_blank" rel="noopener noreferrer" className="text-primary-500 hover:text-primary-400 font-medium">
                  Raghav
                </a>
              </p>
              <div className="flex items-center gap-4 text-dark-500 text-sm">
                <span>🇨🇦 Made in Canada</span>
                <span>•</span>
                <span>🌍 Serving 180+ countries</span>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

