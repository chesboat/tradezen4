import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Check, Sparkles, Crown, Zap, ArrowRight, Brain, Target, TrendingUp, Shield } from 'lucide-react';
import { SUBSCRIPTION_PLANS } from '@/types/subscription';
import { formatPrice, formatAnnualMonthly, getSavingsPercentage } from '@/lib/subscription';
interface PricingPageProps {
  onGetStarted: (tier: 'basic' | 'premium') => void;
}

export const PricingPage: React.FC<PricingPageProps> = ({ onGetStarted }) => {
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'annual'>('annual');
  
  const basicPlan = SUBSCRIPTION_PLANS.basic;
  const premiumPlan = SUBSCRIPTION_PLANS.premium;
  
  const handleGetStarted = (tier: 'basic' | 'premium') => {
    onGetStarted(tier);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-gray-50 to-gray-100 text-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 sm:py-20">
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 200, damping: 15 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary mb-6"
          >
            <Sparkles className="w-4 h-4" />
            <span className="text-sm font-medium">7-Day Free Trial • Cancel Anytime</span>
          </motion.div>
          
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground mb-6">
            Your Trading Health.
            <br />
            <span className="bg-gradient-to-r from-primary via-orange-500 to-red-500 bg-clip-text text-transparent">
              Powered by Premium.
            </span>
          </h1>
          
          <p className="text-lg sm:text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
            Everyone gets the 3-ring system. Premium unlocks 30/90-day trends, detailed breakdowns, and personalized coaching.
          </p>

          {/* Social Proof */}
          <div className="flex flex-wrap items-center justify-center gap-8 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <div className="flex -space-x-2">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-primary/50 border-2 border-background" />
                ))}
              </div>
              <span>Trusted by 1,000+ traders</span>
            </div>
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4 text-green-500" />
              <span>30% cheaper than competitors</span>
            </div>
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary" />
              <span>Habit correlation AI</span>
            </div>
          </div>
        </motion.div>

        {/* Billing Toggle */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="flex items-center justify-center gap-4 mb-12"
        >
          <button
            onClick={() => setBillingPeriod('monthly')}
            className={`px-6 py-3 rounded-xl font-semibold transition-all ${
              billingPeriod === 'monthly'
                ? 'bg-primary text-primary-foreground shadow-lg'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Monthly
          </button>
          <button
            onClick={() => setBillingPeriod('annual')}
            className={`px-6 py-3 rounded-xl font-semibold transition-all relative ${
              billingPeriod === 'annual'
                ? 'bg-primary text-primary-foreground shadow-lg'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Annual
            <span className="absolute -top-2 -right-2 bg-green-500 text-white text-xs px-2 py-0.5 rounded-full font-bold shadow-lg">
              Save {getSavingsPercentage(basicPlan.monthlyPrice, basicPlan.annualPrice)}%
            </span>
          </button>
        </motion.div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto mb-20">
          {/* Basic Plan */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="relative rounded-2xl border-2 border-border bg-background p-8 hover:border-primary/30 hover:shadow-xl transition-all"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center">
                <Zap className="w-6 h-6 text-blue-500" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-foreground">{basicPlan.name}</h3>
                <p className="text-sm text-muted-foreground">{basicPlan.description}</p>
              </div>
            </div>

            <div className="mb-6">
              {billingPeriod === 'monthly' ? (
                <div>
                  <div className="text-4xl font-bold text-foreground">
                    {formatPrice(basicPlan.monthlyPrice)}
                    <span className="text-xl text-muted-foreground font-normal">/month</span>
                  </div>
                </div>
              ) : (
                <div>
                  <div className="text-4xl font-bold text-foreground">
                    {formatAnnualMonthly(basicPlan.annualPrice)}
                    <span className="text-xl text-muted-foreground font-normal">/month</span>
                  </div>
                  <div className="text-sm text-muted-foreground mt-1">
                    {formatPrice(basicPlan.annualPrice)} billed annually
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-4 mb-8">
              {/* Trading Health Section */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Zap className="w-4 h-4 text-primary" />
                  <h4 className="font-semibold text-sm">Trading Health</h4>
                </div>
                <ul className="space-y-2 ml-6">
                  <li className="flex items-start gap-3">
                    <Check className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-foreground">7-day health view</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-foreground">See your 3 rings</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-foreground">Basic rule count (5/8)</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-foreground">Current streak tracking</span>
                  </li>
                </ul>
              </div>

              {/* Core Features */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Brain className="w-4 h-4 text-primary" />
                  <h4 className="font-semibold text-sm">Core Features</h4>
                </div>
                <ul className="space-y-2 ml-6">
                  <li className="flex items-start gap-3">
                    <Check className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-foreground">Unlimited trades & journal</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-foreground">Up to 3 accounts</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-foreground">Advanced analytics</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-foreground">1-year history</span>
                  </li>
                </ul>
              </div>
            </div>

            <button
              onClick={() => handleGetStarted('basic')}
              className="w-full py-3 px-6 bg-primary text-primary-foreground rounded-xl font-semibold hover:bg-primary/90 transition-all flex items-center justify-center gap-2 group"
            >
              Get Started
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </motion.div>

          {/* Premium Plan */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="relative rounded-2xl border-2 border-primary bg-gradient-to-br from-primary/5 to-primary/10 p-8 shadow-2xl hover:shadow-primary/20 transition-all"
          >
            {/* Popular Badge */}
            <div className="absolute -top-4 left-1/2 -translate-x-1/2">
              <div className="bg-gradient-to-r from-orange-500 to-red-500 text-white px-4 py-1.5 rounded-full text-sm font-bold flex items-center gap-1 shadow-lg">
                <Sparkles className="w-3 h-3" />
                Most Popular
              </div>
            </div>

            <div className="flex items-center gap-3 mb-4 mt-2">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center">
                <Crown className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-foreground">{premiumPlan.name}</h3>
                <p className="text-sm text-muted-foreground">{premiumPlan.description}</p>
              </div>
            </div>

            <div className="mb-6">
              {billingPeriod === 'monthly' ? (
                <div>
                  <div className="text-4xl font-bold text-foreground">
                    {formatPrice(premiumPlan.monthlyPrice)}
                    <span className="text-xl text-muted-foreground font-normal">/month</span>
                  </div>
                </div>
              ) : (
                <div>
                  <div className="text-4xl font-bold text-foreground">
                    {formatAnnualMonthly(premiumPlan.annualPrice)}
                    <span className="text-xl text-muted-foreground font-normal">/month</span>
                  </div>
                  <div className="text-sm text-muted-foreground mt-1">
                    {formatPrice(premiumPlan.annualPrice)} billed annually
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-4 mb-8">
              {/* Trading Health Pro Section */}
              <div className="bg-primary/5 border border-primary/20 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Zap className="w-4 h-4 text-primary" />
                  <h4 className="font-bold text-sm">Trading Health Pro</h4>
                </div>
                <ul className="space-y-2 ml-6">
                  <li className="flex items-start gap-3">
                    <Check className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-foreground font-medium">30-day & 90-day trends</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-foreground font-medium">Detailed rule breakdown</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-foreground font-medium">"For You" personalized coaching</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-foreground font-medium">Full ring calculations</span>
                  </li>
                </ul>
              </div>

              {/* Intelligence Features */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Brain className="w-4 h-4 text-primary" />
                  <h4 className="font-semibold text-sm">Intelligence</h4>
                </div>
                <ul className="space-y-2 ml-6">
                  <li className="flex items-start gap-3">
                    <Check className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-foreground">Setup Analytics</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-foreground">Time Intelligence</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-foreground">Insight History</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-foreground">Experiment Mode</span>
                  </li>
                </ul>
              </div>

              {/* Power Features */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Target className="w-4 h-4 text-primary" />
                  <h4 className="font-semibold text-sm">Everything Else</h4>
                </div>
                <ul className="space-y-2 ml-6">
                  <li className="flex items-start gap-3">
                    <Check className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-foreground">Unlimited accounts & storage</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-foreground">Calendar Heatmap</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-foreground">Custom Date Ranges</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-foreground">Priority Support</span>
                  </li>
                </ul>
              </div>
            </div>

            <button
              onClick={() => handleGetStarted('premium')}
              className="w-full py-3 px-6 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl font-semibold hover:opacity-90 transition-all flex items-center justify-center gap-2 group shadow-lg"
            >
              Get Started
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </motion.div>
        </div>

        {/* Feature Comparison Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mb-20"
        >
          <h2 className="text-3xl font-bold text-center mb-12">Feature Comparison</h2>
          
          <div className="bg-background rounded-2xl border border-border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    <th className="text-left p-4 font-semibold text-foreground">Feature</th>
                    <th className="text-center p-4 font-semibold text-foreground">Basic</th>
                    <th className="text-center p-4 font-semibold text-foreground">Premium</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {[
                    { name: 'Data History', basic: '30 days', premium: 'Unlimited' },
                    { name: 'Trading Accounts', basic: '3', premium: 'Unlimited' },
                    { name: 'Trades', basic: 'Unlimited', premium: 'Unlimited' },
                    { name: 'Daily Insights', basic: '✗', premium: '✓' },
                    { name: 'Habit Correlation AI', basic: 'Top 1', premium: 'Top 3' },
                    { name: 'Experiment Mode', basic: '✗', premium: '✓' },
                    { name: 'Insight History', basic: '✗', premium: '✓' },
                    { name: 'Correlation Charts', basic: '✗', premium: '✓' },
                    { name: 'Custom Insight Scheduling', basic: '✗', premium: '✓' },
                    { name: 'Setup Analytics', basic: '✗', premium: '✓' },
                    { name: 'Calendar Heatmap', basic: '✗', premium: '✓' },
                    { name: 'Time Intelligence', basic: '✗', premium: '✓' },
                    { name: 'Custom Date Ranges', basic: '✗', premium: '✓' },
                    { name: 'AI Coach', basic: '✗', premium: '✓' },
                    { name: 'Emotional Analysis', basic: '✗', premium: '✓' },
                    { name: 'Habits', basic: '10', premium: 'Unlimited' },
                    { name: 'Storage', basic: '2GB', premium: '10GB' },
                    { name: 'Weekly Reviews', basic: '✓', premium: '✓' },
                    { name: 'Public Sharing', basic: '✓', premium: '✓' },
                    { name: 'Priority Support', basic: '✗', premium: '✓' },
                  ].map((row, i) => (
                    <tr key={i} className="hover:bg-muted/30 transition-colors">
                      <td className="p-4 text-sm text-foreground font-medium">{row.name}</td>
                      <td className="p-4 text-center text-sm text-muted-foreground">{row.basic}</td>
                      <td className="p-4 text-center text-sm text-foreground font-medium">{row.premium}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </motion.div>

        {/* FAQ Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="mb-20"
        >
          <h2 className="text-3xl font-bold text-center mb-12">Frequently Asked Questions</h2>
          
          <div className="max-w-3xl mx-auto space-y-4">
            {[
              {
                q: "How does the 7-day trial work?",
                a: "Enter your payment info to start a 7-day trial with full Premium access. You won't be charged until day 8. If you love it, continue with Basic ($19/mo) or Premium ($39/mo). Cancel anytime with no charges."
              },
              {
                q: "Can I change plans later?",
                a: "Absolutely! Upgrade or downgrade anytime. Changes take effect immediately, and we'll prorate the difference."
              },
              {
                q: "What makes Refine different from Tradezella?",
                a: "Refine focuses on trading psychology, not just stats. Our AI Coach helps you build discipline, track habits, and understand emotional patterns. Plus, we're 30% cheaper!"
              },
              {
                q: "Do you offer refunds?",
                a: "Yes! If you're not satisfied within the first 30 days, we'll refund you in full. No questions asked."
              },
              {
                q: "What payment methods do you accept?",
                a: "We accept all major credit cards through Stripe. Your payment information is secure and encrypted."
              },
              {
                q: "Can I import my trades?",
                a: "Yes! You can import trades via CSV on all plans, and image import is available on Basic and Premium."
              },
            ].map((faq, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.7 + i * 0.1 }}
                className="bg-background rounded-xl border border-border p-6 hover:border-primary/30 transition-colors"
              >
                <h3 className="font-semibold text-foreground mb-2">{faq.q}</h3>
                <p className="text-sm text-muted-foreground">{faq.a}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Final CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1 }}
          className="text-center bg-gradient-to-br from-primary/10 to-primary/5 rounded-2xl p-12 border border-primary/20"
        >
          <Crown className="w-16 h-16 mx-auto mb-6 text-primary" />
          <h2 className="text-3xl font-bold text-foreground mb-4">
            Ready to Refine Your Edge?
          </h2>
          <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
            Join 1,000+ traders who are building discipline and improving their trading psychology with Refine.
          </p>
          <button
            onClick={() => handleGetStarted('premium')}
            className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl font-semibold hover:opacity-90 transition-all shadow-lg text-lg"
          >
            Start Your Free Trial
            <ArrowRight className="w-5 h-5" />
          </button>
          <p className="text-sm text-muted-foreground mt-4">
            Cancel anytime • 30-day money-back guarantee
          </p>
        </motion.div>
      </div>
    </div>
  );
};

