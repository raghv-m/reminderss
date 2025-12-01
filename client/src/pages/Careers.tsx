import { Navbar } from '../components/Navbar';
import { Flame, MapPin, Clock, DollarSign, Heart, Zap, Users, Code } from 'lucide-react';
import { Link } from 'react-router-dom';

const openings = [
  {
    title: 'Senior Full-Stack Developer',
    type: 'Full-time',
    location: 'Remote (Canada)',
    salary: '$120k - $160k CAD',
    description: 'Build the future of personal accountability. React, Node.js, PostgreSQL experience required.',
  },
  {
    title: 'Product Designer',
    type: 'Full-time',
    location: 'Remote (Canada)',
    salary: '$90k - $130k CAD',
    description: 'Design beautiful, conversion-optimized experiences that help people build discipline.',
  },
  {
    title: 'Growth Marketing Manager',
    type: 'Full-time',
    location: 'Remote (Canada)',
    salary: '$80k - $120k CAD',
    description: 'Scale our user acquisition. SEO, paid ads, content marketing, and viral growth strategies.',
  },
  {
    title: 'Customer Success Lead',
    type: 'Full-time',
    location: 'Remote (Canada)',
    salary: '$70k - $100k CAD',
    description: 'Help users succeed. Onboarding, support, and building our community of disciplined achievers.',
  },
];

const perks = [
  { icon: Heart, title: 'Health Benefits', desc: 'Full medical, dental, and vision coverage' },
  { icon: Clock, title: 'Flexible Hours', desc: 'Work when you\'re most productive' },
  { icon: MapPin, title: '100% Remote', desc: 'Work from anywhere in Canada' },
  { icon: DollarSign, title: 'Equity Options', desc: 'Own a piece of what you build' },
  { icon: Zap, title: 'Learning Budget', desc: '$2,000/year for courses and conferences' },
  { icon: Users, title: 'Team Retreats', desc: 'Annual in-person meetups in beautiful locations' },
];

export function Careers() {
  return (
    <div className="min-h-screen bg-dark-950 text-white">
      <Navbar />
      <div className="pt-24 pb-20">
        <div className="max-w-6xl mx-auto px-4">
          {/* Hero */}
          <div className="text-center mb-16">
            <p className="text-primary-500 font-semibold mb-2">CAREERS</p>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Join the Discipline Revolution</h1>
            <p className="text-dark-400 max-w-2xl mx-auto text-lg">
              We're building the world's best personal accountability platform. Help millions of people become the best versions of themselves.
            </p>
          </div>

          {/* Values */}
          <div className="bg-dark-800 rounded-2xl p-8 mb-16 border border-dark-700">
            <h2 className="text-2xl font-bold mb-6 text-center">Why Work With Us?</h2>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="text-4xl mb-3">🚀</div>
                <h3 className="font-bold mb-2">Early Stage, Big Impact</h3>
                <p className="text-dark-400">Join a fast-growing startup where your work directly shapes the product and culture.</p>
              </div>
              <div className="text-center">
                <div className="text-4xl mb-3">🇨🇦</div>
                <h3 className="font-bold mb-2">Proudly Canadian</h3>
                <p className="text-dark-400">100% Canadian company. We believe in work-life balance and treating people right.</p>
              </div>
              <div className="text-center">
                <div className="text-4xl mb-3">💪</div>
                <h3 className="font-bold mb-2">Mission-Driven</h3>
                <p className="text-dark-400">Help real people build discipline, achieve goals, and transform their lives.</p>
              </div>
            </div>
          </div>

          {/* Perks */}
          <div className="mb-16">
            <h2 className="text-2xl font-bold mb-8 text-center">Perks & Benefits</h2>
            <div className="grid md:grid-cols-3 gap-6">
              {perks.map((perk, i) => (
                <div key={i} className="bg-dark-800 rounded-xl p-6 border border-dark-700 flex items-start gap-4">
                  <perk.icon className="w-8 h-8 text-primary-500 flex-shrink-0" />
                  <div>
                    <h3 className="font-bold mb-1">{perk.title}</h3>
                    <p className="text-dark-400 text-sm">{perk.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Open Positions */}
          <div>
            <h2 className="text-2xl font-bold mb-8 text-center">Open Positions</h2>
            <div className="space-y-4">
              {openings.map((job, i) => (
                <div key={i} className="bg-dark-800 rounded-xl p-6 border border-dark-700 hover:border-primary-500/50 transition-colors">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <h3 className="text-xl font-bold mb-2">{job.title}</h3>
                      <p className="text-dark-400 mb-3">{job.description}</p>
                      <div className="flex flex-wrap gap-3 text-sm">
                        <span className="flex items-center gap-1 text-dark-300"><Clock className="w-4 h-4" /> {job.type}</span>
                        <span className="flex items-center gap-1 text-dark-300"><MapPin className="w-4 h-4" /> {job.location}</span>
                        <span className="flex items-center gap-1 text-dark-300"><DollarSign className="w-4 h-4" /> {job.salary}</span>
                      </div>
                    </div>
                    <a href="mailto:raaghvv0508@gmail.com?subject=Application: {job.title}" className="bg-primary-500 hover:bg-primary-600 text-white px-6 py-3 rounded-lg font-semibold whitespace-nowrap">
                      Apply Now
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* CTA */}
          <div className="text-center mt-16 bg-gradient-to-r from-primary-500/20 to-orange-500/20 rounded-2xl p-8">
            <h3 className="text-2xl font-bold mb-4">Don't see your role?</h3>
            <p className="text-dark-300 mb-6">We're always looking for talented people. Send us your resume!</p>
            <a href="mailto:raaghvv0508@gmail.com?subject=General Application" className="inline-flex items-center gap-2 bg-white text-dark-900 px-6 py-3 rounded-lg font-semibold hover:scale-105 transition-transform">
              <Code className="w-5 h-5" /> Send Your Resume
            </a>
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

