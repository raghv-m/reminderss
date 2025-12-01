import { Navbar } from '../components/Navbar';
import { Flame } from 'lucide-react';
import { Link } from 'react-router-dom';

export function Terms() {
  return (
    <div className="min-h-screen bg-dark-950 text-white">
      <Navbar />
      <div className="pt-24 pb-20">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold mb-4">Terms of Service</h1>
            <p className="text-dark-400">Last updated: December 1, 2025</p>
          </div>

          <div className="prose prose-invert max-w-none space-y-8">
            <section className="bg-dark-800 rounded-xl p-8 border border-dark-700">
              <h2 className="text-2xl font-bold mb-4">1. Acceptance of Terms</h2>
              <p className="text-dark-300">By accessing or using discipline.guru, you agree to be bound by these Terms of Service. If you disagree with any part of these terms, you may not access the service.</p>
            </section>

            <section className="bg-dark-800 rounded-xl p-8 border border-dark-700">
              <h2 className="text-2xl font-bold mb-4">2. Description of Service</h2>
              <p className="text-dark-300">discipline.guru is a personal accountability and scheduling platform that:</p>
              <ul className="list-disc list-inside text-dark-300 space-y-2 mt-4">
                <li>Sends daily reminders via SMS and push notifications</li>
                <li>Automatically generates schedules based on your goals</li>
                <li>Syncs with Google Calendar</li>
                <li>Tracks goal completion and streaks</li>
                <li>Imports work schedules via OCR technology</li>
              </ul>
            </section>

            <section className="bg-dark-800 rounded-xl p-8 border border-dark-700">
              <h2 className="text-2xl font-bold mb-4">3. User Accounts</h2>
              <ul className="list-disc list-inside text-dark-300 space-y-2">
                <li>You must provide accurate information when creating an account</li>
                <li>You are responsible for maintaining account security</li>
                <li>You must be at least 13 years old to use this service</li>
                <li>One account per person; account sharing is not permitted</li>
              </ul>
            </section>

            <section className="bg-dark-800 rounded-xl p-8 border border-dark-700">
              <h2 className="text-2xl font-bold mb-4">4. Subscription & Payments</h2>
              <ul className="list-disc list-inside text-dark-300 space-y-2">
                <li>Free tier includes limited features (2 goals, basic reminders)</li>
                <li>Pro subscription is billed monthly or annually</li>
                <li>All payments are processed securely via Stripe</li>
                <li>Subscriptions auto-renew unless cancelled</li>
                <li>Refunds available within 7 days of initial purchase</li>
                <li>Prices are in CAD (Canadian Dollars)</li>
              </ul>
            </section>

            <section className="bg-dark-800 rounded-xl p-8 border border-dark-700">
              <h2 className="text-2xl font-bold mb-4">5. Acceptable Use</h2>
              <p className="text-dark-300 mb-4">You agree NOT to:</p>
              <ul className="list-disc list-inside text-dark-300 space-y-2">
                <li>Use the service for any illegal purpose</li>
                <li>Attempt to hack, disrupt, or overload our systems</li>
                <li>Share your account credentials with others</li>
                <li>Upload malicious content or scripts</li>
                <li>Use automated tools to access the service without permission</li>
                <li>Violate any applicable laws or regulations</li>
              </ul>
            </section>

            <section className="bg-dark-800 rounded-xl p-8 border border-dark-700">
              <h2 className="text-2xl font-bold mb-4">6. Intellectual Property</h2>
              <p className="text-dark-300">The service, including its design, code, logos, and content, is owned by discipline.guru. You may not copy, modify, or distribute any part of our service without permission.</p>
            </section>

            <section className="bg-dark-800 rounded-xl p-8 border border-dark-700">
              <h2 className="text-2xl font-bold mb-4">7. Third-Party Services</h2>
              <p className="text-dark-300">We integrate with third-party services (Google, Twilio, Stripe). Your use of these services is subject to their respective terms and privacy policies.</p>
            </section>

            <section className="bg-dark-800 rounded-xl p-8 border border-dark-700">
              <h2 className="text-2xl font-bold mb-4">8. Disclaimer of Warranties</h2>
              <p className="text-dark-300">The service is provided "as is" without warranties of any kind. We do not guarantee that the service will be uninterrupted, error-free, or meet your specific requirements.</p>
            </section>

            <section className="bg-dark-800 rounded-xl p-8 border border-dark-700">
              <h2 className="text-2xl font-bold mb-4">9. Limitation of Liability</h2>
              <p className="text-dark-300">To the maximum extent permitted by law, discipline.guru shall not be liable for any indirect, incidental, special, or consequential damages arising from your use of the service.</p>
            </section>

            <section className="bg-dark-800 rounded-xl p-8 border border-dark-700">
              <h2 className="text-2xl font-bold mb-4">10. Termination</h2>
              <p className="text-dark-300">We may terminate or suspend your account at any time for violations of these terms. You may also delete your account at any time through the settings page.</p>
            </section>

            <section className="bg-dark-800 rounded-xl p-8 border border-dark-700">
              <h2 className="text-2xl font-bold mb-4">11. Governing Law</h2>
              <p className="text-dark-300">These terms are governed by the laws of Canada. Any disputes shall be resolved in the courts of Canada.</p>
            </section>

            <section className="bg-dark-800 rounded-xl p-8 border border-dark-700">
              <h2 className="text-2xl font-bold mb-4">12. Contact</h2>
              <p className="text-dark-300">Questions about these terms? Contact us:</p>
              <p className="text-primary-500 mt-2">Email: raaghvv0508@gmail.com</p>
            </section>
          </div>
        </div>
      </div>

      <footer className="border-t border-dark-800 py-8">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <Link to="/welcome" className="inline-flex items-center gap-2 text-dark-400 hover:text-white">
            <Flame className="w-5 h-5 text-primary-500" /> Back to Home
          </Link>
        </div>
      </footer>
    </div>
  );
}

