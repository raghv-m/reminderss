import { Navbar } from '../components/Navbar';
import { Calendar, Clock, ArrowRight, Flame } from 'lucide-react';
import { Link } from 'react-router-dom';

const blogPosts = [
  {
    id: 1,
    title: 'How I Built a 187-Day Workout Streak (And You Can Too)',
    excerpt: 'The secret isn\'t motivation – it\'s systems. Here\'s exactly how our users are crushing their fitness goals.',
    category: 'Fitness',
    date: 'Nov 28, 2025',
    readTime: '5 min read',
    image: '💪',
  },
  {
    id: 2,
    title: 'The Science of Habit Stacking: Why Timing Matters',
    excerpt: 'Research shows scheduling activities at specific times increases completion rates by 91%. Here\'s why.',
    category: 'Productivity',
    date: 'Nov 25, 2025',
    readTime: '7 min read',
    image: '🧠',
  },
  {
    id: 3,
    title: 'OCR Shift Parsing: Building the Feature Our Users Demanded',
    excerpt: 'A technical deep-dive into how we built automatic work schedule recognition using Tesseract.js.',
    category: 'Engineering',
    date: 'Nov 20, 2025',
    readTime: '10 min read',
    image: '⚙️',
  },
  {
    id: 4,
    title: 'From 2 Gym Days to 5: Real User Transformations',
    excerpt: 'Marcus went from barely exercising to becoming one of our top streakers. Here\'s his story.',
    category: 'Success Stories',
    date: 'Nov 15, 2025',
    readTime: '4 min read',
    image: '🏆',
  },
  {
    id: 5,
    title: 'Why "Brutal Mode" Motivation Actually Works',
    excerpt: 'The psychology behind our Hamza-style accountability messages and why soft reminders fail.',
    category: 'Psychology',
    date: 'Nov 10, 2025',
    readTime: '6 min read',
    image: '🔥',
  },
  {
    id: 6,
    title: 'Launching discipline.guru: A Solo Founder\'s Journey',
    excerpt: 'From idea to 8,000+ users in 6 months. The highs, lows, and lessons learned.',
    category: 'Startup',
    date: 'Nov 5, 2025',
    readTime: '8 min read',
    image: '🚀',
  },
];

export function Blog() {
  return (
    <div className="min-h-screen bg-dark-950 text-white">
      <Navbar />
      <div className="pt-24 pb-20">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-16">
            <p className="text-primary-500 font-semibold mb-2">BLOG</p>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Discipline Insights</h1>
            <p className="text-dark-400 max-w-2xl mx-auto">Tips, stories, and strategies to help you build unbreakable habits and crush your goals.</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {blogPosts.map((post) => (
              <article key={post.id} className="bg-dark-800 rounded-2xl overflow-hidden border border-dark-700 hover:border-primary-500/50 transition-colors group">
                <div className="h-48 bg-dark-700 flex items-center justify-center text-6xl">
                  {post.image}
                </div>
                <div className="p-6">
                  <div className="flex items-center gap-4 text-sm text-dark-400 mb-3">
                    <span className="text-primary-500 font-medium">{post.category}</span>
                    <span className="flex items-center gap-1"><Calendar className="w-4 h-4" /> {post.date}</span>
                    <span className="flex items-center gap-1"><Clock className="w-4 h-4" /> {post.readTime}</span>
                  </div>
                  <h2 className="text-xl font-bold mb-2 group-hover:text-primary-500 transition-colors">{post.title}</h2>
                  <p className="text-dark-400 mb-4">{post.excerpt}</p>
                  <button className="text-primary-500 font-medium flex items-center gap-1 hover:gap-2 transition-all">
                    Read More <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </article>
            ))}
          </div>

          <div className="text-center mt-12">
            <p className="text-dark-400">More articles coming soon. Subscribe for updates!</p>
          </div>
        </div>
      </div>

      {/* Simple Footer */}
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

