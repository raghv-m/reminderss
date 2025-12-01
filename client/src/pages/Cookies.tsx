import { Navbar } from '../components/Navbar';
import { Flame } from 'lucide-react';
import { Link } from 'react-router-dom';

export function Cookies() {
  return (
    <div className="min-h-screen bg-dark-950 text-white">
      <Navbar />
      <div className="pt-24 pb-20">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold mb-4">Cookie Policy</h1>
            <p className="text-dark-400">Last updated: December 1, 2025</p>
          </div>

          <div className="prose prose-invert max-w-none space-y-8">
            <section className="bg-dark-800 rounded-xl p-8 border border-dark-700">
              <h2 className="text-2xl font-bold mb-4">What Are Cookies?</h2>
              <p className="text-dark-300">Cookies are small text files stored on your device when you visit a website. They help us remember your preferences and improve your experience.</p>
            </section>

            <section className="bg-dark-800 rounded-xl p-8 border border-dark-700">
              <h2 className="text-2xl font-bold mb-4">How We Use Cookies</h2>
              <p className="text-dark-300 mb-4">discipline.guru uses cookies for:</p>
              
              <h3 className="text-lg font-semibold mb-2 text-primary-500">Essential Cookies</h3>
              <ul className="list-disc list-inside text-dark-300 space-y-2 mb-4">
                <li><strong>Authentication:</strong> Keep you logged in securely</li>
                <li><strong>Session management:</strong> Remember your current session</li>
                <li><strong>Security:</strong> Protect against CSRF attacks</li>
              </ul>

              <h3 className="text-lg font-semibold mb-2 text-primary-500">Functional Cookies</h3>
              <ul className="list-disc list-inside text-dark-300 space-y-2 mb-4">
                <li><strong>Preferences:</strong> Remember your theme and notification settings</li>
                <li><strong>Exit intent:</strong> Track if exit popup was shown</li>
              </ul>

              <h3 className="text-lg font-semibold mb-2 text-primary-500">Analytics Cookies</h3>
              <ul className="list-disc list-inside text-dark-300 space-y-2">
                <li><strong>Usage patterns:</strong> Understand how users interact with our app</li>
                <li><strong>Performance:</strong> Identify and fix issues</li>
              </ul>
            </section>

            <section className="bg-dark-800 rounded-xl p-8 border border-dark-700">
              <h2 className="text-2xl font-bold mb-4">Cookies We Use</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-dark-600">
                      <th className="py-3 px-4">Cookie Name</th>
                      <th className="py-3 px-4">Purpose</th>
                      <th className="py-3 px-4">Duration</th>
                    </tr>
                  </thead>
                  <tbody className="text-dark-300">
                    <tr className="border-b border-dark-700">
                      <td className="py-3 px-4">userId</td>
                      <td className="py-3 px-4">Authentication</td>
                      <td className="py-3 px-4">30 days</td>
                    </tr>
                    <tr className="border-b border-dark-700">
                      <td className="py-3 px-4">exitShown</td>
                      <td className="py-3 px-4">Prevent repeat popups</td>
                      <td className="py-3 px-4">Session</td>
                    </tr>
                    <tr className="border-b border-dark-700">
                      <td className="py-3 px-4">pendingPlan</td>
                      <td className="py-3 px-4">Remember selected plan</td>
                      <td className="py-3 px-4">Session</td>
                    </tr>
                    <tr className="border-b border-dark-700">
                      <td className="py-3 px-4">theme</td>
                      <td className="py-3 px-4">Dark/Light mode preference</td>
                      <td className="py-3 px-4">1 year</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>

            <section className="bg-dark-800 rounded-xl p-8 border border-dark-700">
              <h2 className="text-2xl font-bold mb-4">Third-Party Cookies</h2>
              <p className="text-dark-300 mb-4">We use the following third-party services that may set cookies:</p>
              <ul className="list-disc list-inside text-dark-300 space-y-2">
                <li><strong>Google:</strong> OAuth authentication</li>
                <li><strong>Stripe:</strong> Payment processing (for Pro subscribers)</li>
                <li><strong>Vercel:</strong> Analytics and hosting</li>
              </ul>
            </section>

            <section className="bg-dark-800 rounded-xl p-8 border border-dark-700">
              <h2 className="text-2xl font-bold mb-4">Managing Cookies</h2>
              <p className="text-dark-300 mb-4">You can control cookies through your browser settings:</p>
              <ul className="list-disc list-inside text-dark-300 space-y-2">
                <li><strong>Chrome:</strong> Settings → Privacy and Security → Cookies</li>
                <li><strong>Firefox:</strong> Settings → Privacy & Security → Cookies</li>
                <li><strong>Safari:</strong> Preferences → Privacy → Cookies</li>
                <li><strong>Edge:</strong> Settings → Cookies and site permissions</li>
              </ul>
              <p className="text-dark-400 mt-4 text-sm">Note: Disabling essential cookies may prevent you from using our service.</p>
            </section>

            <section className="bg-dark-800 rounded-xl p-8 border border-dark-700">
              <h2 className="text-2xl font-bold mb-4">Contact Us</h2>
              <p className="text-dark-300">Questions about our cookie policy? Contact us:</p>
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

