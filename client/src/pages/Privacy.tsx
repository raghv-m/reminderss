import { Navbar } from '../components/Navbar';
import { Flame } from 'lucide-react';
import { Link } from 'react-router-dom';

export function Privacy() {
  return (
    <div className="min-h-screen bg-dark-950 text-white">
      <Navbar />
      <div className="pt-24 pb-20">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold mb-4">Privacy Policy</h1>
            <p className="text-dark-400">Last updated: December 1, 2025</p>
          </div>

          <div className="prose prose-invert max-w-none space-y-8">
            <section className="bg-dark-800 rounded-xl p-8 border border-dark-700">
              <h2 className="text-2xl font-bold mb-4">1. Introduction</h2>
              <p className="text-dark-300">discipline.guru ("we", "our", or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our web application and services.</p>
            </section>

            <section className="bg-dark-800 rounded-xl p-8 border border-dark-700">
              <h2 className="text-2xl font-bold mb-4">2. Information We Collect</h2>
              <h3 className="text-lg font-semibold mb-2 text-primary-500">Personal Information</h3>
              <ul className="list-disc list-inside text-dark-300 space-y-2 mb-4">
                <li>Name and email address (via Google OAuth)</li>
                <li>Phone number (for SMS reminders, optional)</li>
                <li>Google Calendar data (for scheduling, with your permission)</li>
                <li>Goals and preferences you set in the app</li>
                <li>Work shift schedules you upload</li>
              </ul>
              <h3 className="text-lg font-semibold mb-2 text-primary-500">Usage Data</h3>
              <ul className="list-disc list-inside text-dark-300 space-y-2">
                <li>Goal completion rates and streaks</li>
                <li>App usage patterns and feature interactions</li>
                <li>Device information and IP address</li>
              </ul>
            </section>

            <section className="bg-dark-800 rounded-xl p-8 border border-dark-700">
              <h2 className="text-2xl font-bold mb-4">3. How We Use Your Information</h2>
              <ul className="list-disc list-inside text-dark-300 space-y-2">
                <li>To provide and maintain our service</li>
                <li>To send you reminders and notifications</li>
                <li>To sync with your Google Calendar</li>
                <li>To generate your personalized schedule</li>
                <li>To track your progress and streaks</li>
                <li>To process payments (via Stripe)</li>
                <li>To improve our service based on usage patterns</li>
              </ul>
            </section>

            <section className="bg-dark-800 rounded-xl p-8 border border-dark-700">
              <h2 className="text-2xl font-bold mb-4">4. Data Storage & Security</h2>
              <p className="text-dark-300 mb-4">Your data is stored securely on Supabase (enterprise-grade PostgreSQL) with:</p>
              <ul className="list-disc list-inside text-dark-300 space-y-2">
                <li>256-bit SSL/TLS encryption in transit</li>
                <li>AES-256 encryption at rest</li>
                <li>Regular automated backups</li>
                <li>Access controls and audit logging</li>
              </ul>
            </section>

            <section className="bg-dark-800 rounded-xl p-8 border border-dark-700">
              <h2 className="text-2xl font-bold mb-4">5. Third-Party Services</h2>
              <p className="text-dark-300 mb-4">We use the following third-party services:</p>
              <ul className="list-disc list-inside text-dark-300 space-y-2">
                <li><strong>Google:</strong> OAuth authentication and Calendar API</li>
                <li><strong>Twilio:</strong> SMS messaging</li>
                <li><strong>Stripe:</strong> Payment processing</li>
                <li><strong>Supabase:</strong> Database hosting</li>
                <li><strong>Vercel:</strong> Web hosting</li>
              </ul>
            </section>

            <section className="bg-dark-800 rounded-xl p-8 border border-dark-700">
              <h2 className="text-2xl font-bold mb-4">6. Your Rights</h2>
              <p className="text-dark-300 mb-4">You have the right to:</p>
              <ul className="list-disc list-inside text-dark-300 space-y-2">
                <li>Access your personal data</li>
                <li>Correct inaccurate data</li>
                <li>Delete your account and all associated data</li>
                <li>Export your data in a portable format</li>
                <li>Opt out of marketing communications</li>
                <li>Revoke Google Calendar access at any time</li>
              </ul>
            </section>

            <section className="bg-dark-800 rounded-xl p-8 border border-dark-700">
              <h2 className="text-2xl font-bold mb-4">7. Data Retention</h2>
              <p className="text-dark-300">We retain your data for as long as your account is active. Upon account deletion, all personal data is permanently deleted within 30 days.</p>
            </section>

            <section className="bg-dark-800 rounded-xl p-8 border border-dark-700">
              <h2 className="text-2xl font-bold mb-4">8. Children's Privacy</h2>
              <p className="text-dark-300">Our service is not intended for children under 13. We do not knowingly collect information from children under 13.</p>
            </section>

            <section className="bg-dark-800 rounded-xl p-8 border border-dark-700">
              <h2 className="text-2xl font-bold mb-4">9. Contact Us</h2>
              <p className="text-dark-300">For privacy-related inquiries, contact us at:</p>
              <p className="text-primary-500 mt-2">Email: raaghvv0508@gmail.com</p>
              <p className="text-dark-300">Phone: +1 (825) 343-1168</p>
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

