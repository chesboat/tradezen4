import React from 'react';
import { motion } from 'framer-motion';
import { 
  ArrowRight, 
  Brain, 
  Target, 
  TrendingUp, 
  CheckCircle2,
  Sparkles,
  Crown,
  MessageCircle,
  Calendar,
  BarChart3,
  Shield,
  Zap,
  BookOpen,
  Users,
  Star,
  Quote,
  FileText
} from 'lucide-react';
import { useNavigationStore } from '@/store/useNavigationStore';

interface HomePageProps {
  onGetStarted: () => void;
  onViewPricing: () => void;
}

export const HomePage: React.FC<HomePageProps> = ({ onGetStarted, onViewPricing }) => {
  const { setCurrentView } = useNavigationStore();

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-background via-background to-primary/5">
        <div className="absolute inset-0 bg-grid-pattern opacity-5" />
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 pt-20 sm:pt-32 pb-24">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            {/* Badge */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.2 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary mb-8 border border-primary/20"
            >
              <Sparkles className="w-4 h-4" />
              <span className="text-sm font-medium">7-Day Free Trial • No Credit Card Required</span>
            </motion.div>

            {/* Main Headline */}
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-foreground mb-6 leading-tight">
              Master Your Trading
              <br />
              <span className="bg-gradient-to-r from-primary via-orange-500 to-red-500 bg-clip-text text-transparent">
                Psychology
              </span>
            </h1>

            <p className="text-xl sm:text-2xl text-muted-foreground max-w-3xl mx-auto mb-12 leading-relaxed">
              The only journal built for traders who know that discipline, habits, and mindset 
              are the real edge in the market.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
              <button
                onClick={onGetStarted}
                className="group px-8 py-4 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl font-semibold hover:opacity-90 transition-all shadow-lg text-lg flex items-center gap-2"
              >
                Start Free Trial
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
              <button
                onClick={onViewPricing}
                className="px-8 py-4 bg-background border-2 border-border text-foreground rounded-xl font-semibold hover:border-primary/50 hover:bg-accent transition-all text-lg"
              >
                View Pricing
              </button>
            </div>

            {/* Social Proof */}
            <div className="flex flex-wrap items-center justify-center gap-8 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <div className="flex -space-x-2">
                  {[...Array(5)].map((_, i) => (
                    <div 
                      key={i} 
                      className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-primary/50 border-2 border-background flex items-center justify-center text-xs text-white font-bold"
                    >
                      {String.fromCharCode(65 + i)}
                    </div>
                  ))}
                </div>
                <span className="font-medium">1,000+ traders</span>
              </div>
              <div className="flex items-center gap-1.5">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                ))}
                <span className="ml-1 font-medium">4.9/5 rating</span>
              </div>
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-green-500" />
                <span className="font-medium">30-day money back</span>
              </div>
            </div>
          </motion.div>

          {/* Hero Image/Screenshot Placeholder */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="mt-16 relative"
          >
            <div className="relative mx-auto max-w-5xl">
              <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-orange-500/20 blur-3xl rounded-full" />
              <div className="relative bg-card border-2 border-border rounded-2xl shadow-2xl p-4 sm:p-8">
                <div className="bg-muted/30 rounded-xl aspect-video flex items-center justify-center text-muted-foreground">
                  <div className="text-center">
                    <BarChart3 className="w-16 h-16 mx-auto mb-4 opacity-50" />
                    <p className="text-sm">Dashboard Preview</p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-muted/30 border-y border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { value: '1,000+', label: 'Active Traders' },
              { value: '50k+', label: 'Trades Logged' },
              { value: '30%', label: 'Cheaper than Tradezella' },
              { value: '4.9/5', label: 'User Rating' },
            ].map((stat, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="text-center"
              >
                <div className="text-3xl sm:text-4xl font-bold text-foreground mb-2">{stat.value}</div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-bold text-foreground mb-4">
              Built for Traders Who Get It
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Refine isn't just another trading journal. It's a psychology lab for your trading mind.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: <Brain className="w-8 h-8" />,
                title: 'AI Trading Coach',
                description: 'Get personalized insights on your psychology, patterns, and blind spots. Like having a trading coach in your pocket.',
                badge: 'Premium',
              },
              {
                icon: <Target className="w-8 h-8" />,
                title: 'Discipline Mode',
                description: 'Set daily trade limits, check-in rituals, and get nudges when you\'re about to break your rules.',
              },
              {
                icon: <TrendingUp className="w-8 h-8" />,
                title: 'Deep Analytics',
                description: 'Track win rate, R:R, emotional patterns, and time-of-day performance. Know your edge, inside and out.',
              },
              {
                icon: <BookOpen className="w-8 h-8" />,
                title: 'Daily Reflections',
                description: 'Custom templates, image uploads, and streak tracking. Build the habit of reviewing every session.',
              },
              {
                icon: <Calendar className="w-8 h-8" />,
                title: 'Visual Calendar',
                description: 'See your trading month at a glance. Green days, red days, and reflection streaks. Share your progress publicly.',
              },
              {
                icon: <MessageCircle className="w-8 h-8" />,
                title: 'Habit Tracking',
                description: 'Track pre-market rituals, screen time, exercise, sleep. Your trading performance starts before the bell.',
              },
              {
                icon: <FileText className="w-8 h-8" />,
                title: 'Rich Notes App',
                description: 'Full-featured notes with tags, search, and markdown. Perfect for trade ideas, market analysis, and learning.',
              },
              {
                icon: <CheckCircle2 className="w-8 h-8" />,
                title: 'Smart Todos',
                description: 'Apple Reminders-style task management. Track review items, research tasks, and follow-up actions.',
              },
            ].map((feature, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="relative group"
              >
                <div className="bg-card border border-border rounded-2xl p-6 hover:border-primary/30 hover:shadow-lg transition-all h-full">
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                      {feature.icon}
                    </div>
                    {feature.badge && (
                      <span className="text-[10px] px-2 py-1 rounded-full bg-gradient-to-r from-orange-500 to-red-500 text-white font-bold">
                        {feature.badge}
                      </span>
                    )}
                  </div>
                  <h3 className="text-xl font-semibold text-foreground mb-3">{feature.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-24 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-bold text-foreground mb-4">
              Loved by Traders
            </h2>
            <p className="text-xl text-muted-foreground">
              Here's what our community is saying
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                quote: "Refine helped me cut my revenge trading by 80%. The discipline mode is a game changer.",
                author: "Alex Chen",
                role: "Day Trader",
                rating: 5,
              },
              {
                quote: "Finally, a journal that focuses on psychology instead of just P&L. The AI coach asks better questions than my therapist.",
                author: "Sarah Martinez",
                role: "Swing Trader",
                rating: 5,
              },
              {
                quote: "I tried Tradezella and Edgewonk. Refine is better and costs half the price. No brainer.",
                author: "Mike Johnson",
                role: "Futures Trader",
                rating: 5,
              },
            ].map((testimonial, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="bg-card border border-border rounded-2xl p-6 hover:border-primary/30 transition-all"
              >
                <div className="flex gap-1 mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <Quote className="w-8 h-8 text-primary/20 mb-4" />
                <p className="text-foreground mb-6 leading-relaxed">{testimonial.quote}</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-orange-500 flex items-center justify-center text-white font-bold">
                    {testimonial.author[0]}
                  </div>
                  <div>
                    <div className="font-semibold text-foreground">{testimonial.author}</div>
                    <div className="text-sm text-muted-foreground">{testimonial.role}</div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Comparison Section */}
      <section className="py-24 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-bold text-foreground mb-4">
              Why Choose Refine?
            </h2>
            <p className="text-xl text-muted-foreground">
              We focus on what actually matters: your psychology
            </p>
          </div>

          <div className="max-w-4xl mx-auto">
            <div className="bg-card border border-border rounded-2xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border bg-muted/30">
                      <th className="text-left p-4 font-semibold text-foreground">Feature</th>
                      <th className="text-center p-4 font-semibold text-foreground">
                        <div className="flex flex-col items-center">
                          <Crown className="w-6 h-6 text-primary mb-1" />
                          <span>Refine</span>
                        </div>
                      </th>
                      <th className="text-center p-4 font-semibold text-muted-foreground">Tradezella</th>
                      <th className="text-center p-4 font-semibold text-muted-foreground">Edgewonk</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {[
                      { name: 'AI Trading Coach', refine: true, tradezella: false, edgewonk: false },
                      { name: 'Discipline Mode', refine: true, tradezella: false, edgewonk: false },
                      { name: 'Habit Tracking', refine: true, tradezella: false, edgewonk: false },
                      { name: 'Emotional Analysis', refine: true, tradezella: false, edgewonk: true },
                      { name: 'Daily Reflections', refine: true, tradezella: true, edgewonk: true },
                      { name: 'Advanced Analytics', refine: true, tradezella: true, edgewonk: true },
                      { name: 'Starting Price', refine: '$19/mo', tradezella: '$39/mo', edgewonk: '$79/mo' },
                    ].map((row, i) => (
                      <tr key={i} className="hover:bg-muted/30 transition-colors">
                        <td className="p-4 text-sm font-medium text-foreground">{row.name}</td>
                        <td className="p-4 text-center">
                          {typeof row.refine === 'boolean' ? (
                            row.refine ? (
                              <CheckCircle2 className="w-5 h-5 text-green-500 mx-auto" />
                            ) : (
                              <span className="text-muted-foreground">—</span>
                            )
                          ) : (
                            <span className="font-bold text-primary">{row.refine}</span>
                          )}
                        </td>
                        <td className="p-4 text-center">
                          {typeof row.tradezella === 'boolean' ? (
                            row.tradezella ? (
                              <CheckCircle2 className="w-5 h-5 text-muted-foreground mx-auto" />
                            ) : (
                              <span className="text-muted-foreground">—</span>
                            )
                          ) : (
                            <span className="text-sm text-muted-foreground">{row.tradezella}</span>
                          )}
                        </td>
                        <td className="p-4 text-center">
                          {typeof row.edgewonk === 'boolean' ? (
                            row.edgewonk ? (
                              <CheckCircle2 className="w-5 h-5 text-muted-foreground mx-auto" />
                            ) : (
                              <span className="text-muted-foreground">—</span>
                            )
                          ) : (
                            <span className="text-sm text-muted-foreground">{row.edgewonk}</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-24 bg-gradient-to-br from-primary/10 via-orange-500/5 to-red-500/10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <Sparkles className="w-16 h-16 mx-auto mb-6 text-primary" />
            <h2 className="text-4xl sm:text-5xl font-bold text-foreground mb-6">
              Ready to Refine Your Edge?
            </h2>
            <p className="text-xl text-muted-foreground mb-12 leading-relaxed">
              Join 1,000+ traders who are mastering their psychology and building real discipline. 
              Start your free trial today—no credit card required.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <button
                onClick={onGetStarted}
                className="group px-8 py-4 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl font-semibold hover:opacity-90 transition-all shadow-lg text-lg flex items-center gap-2"
              >
                Start Free Trial
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
              <button
                onClick={onViewPricing}
                className="px-8 py-4 text-foreground rounded-xl font-semibold hover:text-primary transition-all text-lg"
              >
                View Pricing →
              </button>
            </div>
            <p className="text-sm text-muted-foreground mt-6">
              No credit card required • Cancel anytime • 30-day money-back guarantee
            </p>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

