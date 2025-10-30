import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  HelpCircle, 
  Mail, 
  MessageCircle, 
  Book, 
  Send,
  CheckCircle2,
  ExternalLink,
  Search,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useUserProfileStore } from '@/store/useUserProfileStore';
import toast from 'react-hot-toast';

interface FAQItem {
  question: string;
  answer: string;
  category: 'getting-started' | 'features' | 'billing' | 'technical';
}

const faqs: FAQItem[] = [
  {
    category: 'getting-started',
    question: 'How do I start my free trial?',
    answer: 'Sign up with your email, and you\'ll automatically get 7 days of free access to all Premium features. No credit card required to start.'
  },
  {
    category: 'getting-started',
    question: 'How do I log my first trade?',
    answer: 'Click the "+" button in the sidebar or bottom navigation, fill in your trade details, and hit save. You can add screenshots, notes, and tags to each trade.'
  },
  {
    category: 'features',
    question: 'What are Trading Health Rings?',
    answer: 'Trading Health Rings track your Edge, Consistency, and Risk Control daily. Close all three rings to build discipline and improve your trading psychology over time.'
  },
  {
    category: 'features',
    question: 'How does the AI Coach work?',
    answer: 'The AI Coach analyzes your trades, habits, and reflections to provide personalized insights. Ask questions about your performance, patterns, or psychology anytime.'
  },
  {
    category: 'features',
    question: 'Can I track multiple trading accounts?',
    answer: 'Yes! Basic plan includes 2 accounts, Premium includes unlimited accounts. Switch between accounts using the filter in the top navigation.'
  },
  {
    category: 'billing',
    question: 'How do I cancel my subscription?',
    answer: 'Go to Settings → Subscription → Manage Subscription. You can cancel anytime and keep access until the end of your billing period.'
  },
  {
    category: 'billing',
    question: 'What\'s your refund policy?',
    answer: 'We offer a 30-day money-back guarantee. If you\'re not satisfied, email us at support@refine.trading within 30 days for a full refund.'
  },
  {
    category: 'billing',
    question: 'Can I upgrade from Basic to Premium?',
    answer: 'Yes! Go to Settings → Subscription → Upgrade to Premium. You\'ll be charged a prorated amount for the remainder of your billing cycle.'
  },
  {
    category: 'technical',
    question: 'Is my data secure?',
    answer: 'Yes. All data is encrypted in transit and at rest. We use Firebase (Google Cloud) for storage and follow industry-standard security practices.'
  },
  {
    category: 'technical',
    question: 'Can I export my data?',
    answer: 'Yes! Go to Settings → Data & Sync → Export Profile Data. You can download a JSON file with all your trades, notes, and reflections.'
  },
  {
    category: 'technical',
    question: 'Does Refine work on mobile?',
    answer: 'Yes! Refine is fully responsive and works on all devices. We have a mobile-optimized interface with bottom navigation for easy one-handed use.'
  },
  {
    category: 'technical',
    question: 'How do I sync data across devices?',
    answer: 'Your data automatically syncs across all devices when you\'re logged in. If you notice any issues, go to Settings → Data & Sync → Sync Now.'
  }
];

const categories = [
  { id: 'all', label: 'All Topics', icon: Book },
  { id: 'getting-started', label: 'Getting Started', icon: HelpCircle },
  { id: 'features', label: 'Features', icon: MessageCircle },
  { id: 'billing', label: 'Billing', icon: Mail },
  { id: 'technical', label: 'Technical', icon: Search }
];

export const SupportPage: React.FC = () => {
  const { currentUser } = useAuth();
  const { profile } = useUserProfileStore();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedFAQ, setExpandedFAQ] = useState<number | null>(null);
  const [showContactForm, setShowContactForm] = useState(false);
  
  // Contact form state
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // Filter FAQs
  const filteredFAQs = faqs.filter(faq => {
    const matchesCategory = selectedCategory === 'all' || faq.category === selectedCategory;
    const matchesSearch = searchQuery === '' || 
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleSubmitContact = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!subject.trim() || !message.trim()) {
      toast.error('Please fill in all fields');
      return;
    }

    setIsSubmitting(true);
    
    try {
      // 🍎 APPLE WAY: Send to your support email via API
      const supportData = {
        userEmail: currentUser?.email || 'anonymous@refine.trading',
        userId: currentUser?.uid || 'anonymous',
        displayName: profile?.displayName || 'Unknown User',
        subject,
        message,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        url: window.location.href
      };

      console.log('Sending support request:', supportData);
      
      // Call Resend API endpoint
      const response = await fetch('/api/send-support-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(supportData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to send email');
      }

      const result = await response.json();
      console.log('✅ Support email sent:', result);
      
      setSubmitted(true);
      toast.success('Message sent! We\'ll respond within 24 hours.');
      
      // Reset form after 3 seconds
      setTimeout(() => {
        setShowContactForm(false);
        setSubmitted(false);
        setSubject('');
        setMessage('');
      }, 3000);
      
    } catch (error: any) {
      console.error('Failed to send support message:', error);
      toast.error(error.message || 'Failed to send message. Please email us directly at support@refine.trading');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-4"
        >
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mb-4">
            <HelpCircle className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-4xl font-bold">How can we help?</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Search our help center or contact us directly
          </p>
        </motion.div>

        {/* Search Bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="relative max-w-2xl mx-auto"
        >
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search for help..."
            className="w-full pl-12 pr-4 py-4 bg-card border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary text-lg"
          />
        </motion.div>

        {/* Category Filter */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="flex flex-wrap gap-2 justify-center"
        >
          {categories.map((category) => {
            const Icon = category.icon;
            return (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-all ${
                  selectedCategory === category.id
                    ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                    : 'bg-card hover:bg-accent border-border'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="text-sm font-medium">{category.label}</span>
              </button>
            );
          })}
        </motion.div>

        {/* FAQ Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="space-y-4"
        >
          <h2 className="text-2xl font-bold mb-6">Frequently Asked Questions</h2>
          
          {filteredFAQs.length === 0 ? (
            <div className="text-center py-12 bg-card rounded-xl border border-border">
              <Search className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No results found. Try a different search term.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredFAQs.map((faq, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="bg-card border border-border rounded-xl overflow-hidden hover:border-primary/30 transition-colors"
                >
                  <button
                    onClick={() => setExpandedFAQ(expandedFAQ === index ? null : index)}
                    className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-accent/50 transition-colors"
                  >
                    <span className="font-semibold pr-4">{faq.question}</span>
                    {expandedFAQ === index ? (
                      <ChevronUp className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                    )}
                  </button>
                  
                  {expandedFAQ === index && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="px-6 pb-4 text-muted-foreground leading-relaxed"
                    >
                      {faq.answer}
                    </motion.div>
                  )}
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>

        {/* Contact Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-gradient-to-br from-primary/5 via-primary/3 to-transparent rounded-2xl border border-primary/10 p-8"
        >
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold mb-2">Still need help?</h2>
            <p className="text-muted-foreground">
              Can't find what you're looking for? We're here to help.
            </p>
          </div>

          {!showContactForm ? (
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => setShowContactForm(true)}
                className="flex items-center justify-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-xl font-semibold hover:bg-primary/90 transition-all shadow-sm"
              >
                <MessageCircle className="w-5 h-5" />
                Contact Support
              </button>
              
              <a
                href="mailto:support@refine.trading"
                className="flex items-center justify-center gap-2 px-6 py-3 bg-card border border-border text-foreground rounded-xl font-semibold hover:bg-accent transition-all"
              >
                <Mail className="w-5 h-5" />
                Email Us
              </a>
            </div>
          ) : submitted ? (
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="text-center py-8"
            >
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-500/10 mb-4">
                <CheckCircle2 className="w-8 h-8 text-green-500" />
              </div>
              <h3 className="text-xl font-bold mb-2">Message Sent!</h3>
              <p className="text-muted-foreground">
                We'll get back to you within 24 hours at {currentUser?.email}
              </p>
            </motion.div>
          ) : (
            <motion.form
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              onSubmit={handleSubmitContact}
              className="max-w-2xl mx-auto space-y-4"
            >
              <div>
                <label className="block text-sm font-medium mb-2">Subject</label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Brief description of your issue"
                  className="w-full px-4 py-3 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Message</label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Please describe your issue in detail..."
                  rows={6}
                  className="w-full px-4 py-3 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                  required
                />
              </div>
              
              <div className="text-xs text-muted-foreground">
                We'll respond to <strong>{currentUser?.email}</strong> within 24 hours
              </div>
              
              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-xl font-semibold hover:bg-primary/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="w-5 h-5" />
                      Send Message
                    </>
                  )}
                </button>
                
                <button
                  type="button"
                  onClick={() => setShowContactForm(false)}
                  className="px-6 py-3 bg-muted text-foreground rounded-xl font-medium hover:bg-muted/80 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </motion.form>
          )}
        </motion.div>

        {/* Quick Links */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="grid md:grid-cols-3 gap-4"
        >
          <a
            href="https://twitter.com/refinejournal"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 p-4 bg-card border border-border rounded-xl hover:border-primary/30 hover:shadow-sm transition-all group"
          >
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform">
              <ExternalLink className="w-5 h-5 text-primary" />
            </div>
            <div>
              <div className="font-semibold">Follow Updates</div>
              <div className="text-xs text-muted-foreground">@refinejournal</div>
            </div>
          </a>
          
          <a
            href="/privacy"
            className="flex items-center gap-3 p-4 bg-card border border-border rounded-xl hover:border-primary/30 hover:shadow-sm transition-all group"
          >
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Book className="w-5 h-5 text-primary" />
            </div>
            <div>
              <div className="font-semibold">Privacy Policy</div>
              <div className="text-xs text-muted-foreground">How we protect your data</div>
            </div>
          </a>
          
          <a
            href="/terms"
            className="flex items-center gap-3 p-4 bg-card border border-border rounded-xl hover:border-primary/30 hover:shadow-sm transition-all group"
          >
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Book className="w-5 h-5 text-primary" />
            </div>
            <div>
              <div className="font-semibold">Terms of Service</div>
              <div className="text-xs text-muted-foreground">Our agreement with you</div>
            </div>
          </a>
        </motion.div>
      </div>
    </div>
  );
};

