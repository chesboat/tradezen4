import React from 'react';
import { motion } from 'framer-motion';
import {
  Brain,
  Target,
  Calendar,
  BarChart3,
  MessageCircle,
  BookOpen,
  Zap,
  Shield,
  TrendingUp,
  Users,
  Clock,
  Heart,
  CheckCircle2,
  ArrowRight,
  FileText,
} from 'lucide-react';

interface FeaturesPageProps {
  onGetStarted: () => void;
}

export const FeaturesPage: React.FC<FeaturesPageProps> = ({ onGetStarted }) => {
  const featureSections = [
    {
      icon: <Brain className="w-12 h-12" />,
      title: 'AI Trading Coach',
      badge: 'Premium',
      description: 'Your personal trading psychologist, powered by GPT-4',
      features: [
        'Ask questions about your trades, patterns, and psychology',
        'Get personalized action plans for improvement',
        'Identify emotional patterns and blind spots',
        'Pre-market mental preparation suggestions',
        'End-of-day performance debriefs',
      ],
      image: '🤖',
    },
    {
      icon: <Target className="w-12 h-12" />,
      title: 'Discipline Mode',
      badge: null,
      description: 'Build unbreakable trading discipline with daily rituals',
      features: [
        'Daily check-in to set intentions and max trades',
        'Real-time nudges when approaching limits',
        'Override system with mandatory reflection',
        'End-of-day review prompts',
        'Track discipline streaks and progress',
      ],
      image: '🎯',
    },
    {
      icon: <BarChart3 className="w-12 h-12" />,
      title: 'Deep Analytics',
      badge: null,
      description: 'Know your edge with surgical precision',
      features: [
        'Win rate, R:R, and average P&L by symbol',
        'Time-of-day performance analysis',
        'Emotional state correlation to outcomes',
        'Custom date range filtering',
        'Trading health score and insights',
      ],
      image: '📊',
    },
    {
      icon: <Calendar className="w-12 h-12" />,
      title: 'Visual Calendar',
      badge: null,
      description: 'See your entire trading month at a glance',
      features: [
        'Color-coded P&L tiles (green wins, red losses)',
        'Reflection streak indicators with flame icons',
        'Weekly summaries with win rate and total P&L',
        'Share your calendar publicly (great for accountability)',
        'Download as image for social media',
      ],
      image: '📅',
    },
    {
      icon: <BookOpen className="w-12 h-12" />,
      title: 'Daily Reflections',
      badge: null,
      description: 'Build the habit of reviewing every session',
      features: [
        'Custom templates (pre-market, post-market, weekly)',
        'Image uploads for chart screenshots',
        'Tag-based organization',
        'Search through all past reflections',
        'Export notes to PDF',
      ],
      image: '📝',
    },
    {
      icon: <Heart className="w-12 h-12" />,
      title: 'Habit Tracking',
      badge: null,
      description: 'Your trading edge starts before the market opens',
      features: [
        'Track pre-market rituals (meditation, review, plan)',
        'Monitor sleep, exercise, and screen time',
        'Set daily, weekly, or custom frequency',
        'Visual progress tracking with streak indicators',
        'Correlation to trading performance',
      ],
      image: '✅',
    },
    {
      icon: <FileText className="w-12 h-12" />,
      title: 'Rich Notes App',
      badge: null,
      description: 'A full-featured notes system built for traders',
      features: [
        'Rich text editor with markdown support',
        'Tag-based organization and smart filtering',
        'Full-text search across all notes',
        'Link notes to specific trades or days',
        'Long-form trade analysis and market research',
      ],
      image: '📓',
    },
    {
      icon: <CheckCircle2 className="w-12 h-12" />,
      title: 'Smart Todo System',
      badge: null,
      description: 'Apple Reminders-style task management for traders',
      features: [
        'Smart lists (Today, Scheduled, Flagged)',
        'Quick-add with tags, notes, and URLs',
        'Flag important tasks for easy access',
        'Schedule tasks for future review',
        'Swipe actions on mobile (complete, delete)',
      ],
      image: '✓',
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-background via-background to-primary/5 pt-20 pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center max-w-3xl mx-auto"
          >
            <h1 className="text-5xl sm:text-6xl font-bold text-foreground mb-6">
              Everything You Need to
              <br />
              <span className="bg-gradient-to-r from-primary via-orange-500 to-red-500 bg-clip-text text-transparent">
                Master Trading Psychology
              </span>
            </h1>
            <p className="text-xl text-muted-foreground mb-8">
              Refine is the only journal that treats trading like the mental game it is.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Feature Sections */}
      <section className="py-16 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-32">
          {featureSections.map((section, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className={`flex flex-col ${
                i % 2 === 0 ? 'lg:flex-row' : 'lg:flex-row-reverse'
              } items-center gap-12 lg:gap-16`}
            >
              {/* Content */}
              <div className="flex-1">
                <div className="flex items-start gap-4 mb-6">
                  <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
                    {section.icon}
                  </div>
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <h2 className="text-3xl sm:text-4xl font-bold text-foreground">
                        {section.title}
                      </h2>
                      {section.badge && (
                        <span className="text-xs px-3 py-1 rounded-full bg-gradient-to-r from-orange-500 to-red-500 text-white font-bold">
                          {section.badge}
                        </span>
                      )}
                    </div>
                    <p className="text-lg text-muted-foreground">{section.description}</p>
                  </div>
                </div>

                <ul className="space-y-4">
                  {section.features.map((feature, j) => (
                    <li key={j} className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                      <span className="text-foreground">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Visual Placeholder */}
              <div className="flex-1 w-full">
                <div className="bg-card border-2 border-border rounded-2xl p-8 shadow-lg">
                  <div className="bg-muted/30 rounded-xl aspect-video flex items-center justify-center">
                    <span className="text-8xl">{section.image}</span>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Additional Features Grid */}
      <section className="py-24 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-bold text-foreground mb-4">
              Plus Everything Else You'd Expect
            </h2>
            <p className="text-xl text-muted-foreground">
              All the standard features, but built with traders in mind
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: <Users className="w-6 h-6" />,
                title: 'Multi-Account Support',
                description: 'Track separate accounts for day trading, swing trading, and demo',
              },
              {
                icon: <Zap className="w-6 h-6" />,
                title: 'Quick Trade Logging',
                description: 'Log trades in 5 seconds with smart defaults and symbols autocomplete',
              },
              {
                icon: <TrendingUp className="w-6 h-6" />,
                title: 'CSV Import',
                description: 'Import trade history from your broker instantly',
              },
              {
                icon: <Clock className="w-6 h-6" />,
                title: 'Time-of-Day Analysis',
                description: 'Find your most profitable trading hours',
              },
              {
                icon: <Shield className="w-6 h-6" />,
                title: 'Private & Secure',
                description: 'Bank-level encryption. Your data is yours alone',
              },
              {
                icon: <MessageCircle className="w-6 h-6" />,
                title: 'Rule Tracking',
                description: 'Define your trading rules and track adherence',
              },
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="bg-card border border-border rounded-xl p-6 hover:border-primary/30 hover:shadow-lg transition-all"
              >
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary mb-4">
                  {item.icon}
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">{item.title}</h3>
                <p className="text-sm text-muted-foreground">{item.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-24 bg-background">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl sm:text-5xl font-bold text-foreground mb-6">
              Ready to Build Real Discipline?
            </h2>
            <p className="text-xl text-muted-foreground mb-12">
              Start your 7-day free trial. No credit card required.
            </p>
            <button
              onClick={onGetStarted}
              className="group px-8 py-4 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl font-semibold hover:opacity-90 transition-all shadow-lg text-lg flex items-center gap-2 mx-auto"
            >
              Start Free Trial
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
            <p className="text-sm text-muted-foreground mt-6">
              Join 1,000+ traders mastering their psychology
            </p>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

