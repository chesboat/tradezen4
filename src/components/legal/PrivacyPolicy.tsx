import React from 'react';
import { motion } from 'framer-motion';
import { Shield, ArrowLeft } from 'lucide-react';
import { useNavigationStore } from '@/store/useNavigationStore';

export const PrivacyPolicy: React.FC = () => {
  const { setCurrentView } = useNavigationStore();
  const lastUpdated = 'January 15, 2025';

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-gradient-to-br from-primary/5 via-primary/3 to-transparent border-b border-border">
        <div className="max-w-4xl mx-auto px-6 py-12">
          <button
            onClick={() => setCurrentView('settings')}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Settings
          </button>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-4"
          >
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
              <Shield className="w-8 h-8 text-primary" />
            </div>
            <div>
              <h1 className="text-4xl font-bold mb-2">Privacy Policy</h1>
              <p className="text-muted-foreground">Last updated: {lastUpdated}</p>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-6 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="prose prose-slate dark:prose-invert max-w-none"
        >
          <div className="space-y-8">
            {/* Introduction */}
            <section>
              <p className="text-lg text-muted-foreground leading-relaxed">
                At Refine ("we," "our," or "us"), we take your privacy seriously. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our trading journal application.
              </p>
            </section>

            {/* Information We Collect */}
            <section className="space-y-4">
              <h2 className="text-2xl font-bold text-foreground">1. Information We Collect</h2>
              
              <div className="space-y-4">
                <div>
                  <h3 className="text-xl font-semibold text-foreground mb-2">Account Information</h3>
                  <p className="text-muted-foreground">
                    When you create an account, we collect:
                  </p>
                  <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
                    <li>Email address</li>
                    <li>Display name (optional)</li>
                    <li>Profile picture (optional)</li>
                    <li>Password (encrypted)</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-xl font-semibold text-foreground mb-2">Trading Data</h3>
                  <p className="text-muted-foreground">
                    To provide our journaling service, we collect:
                  </p>
                  <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
                    <li>Trade details (entry/exit prices, symbols, dates, P&L)</li>
                    <li>Trading notes and reflections</li>
                    <li>Screenshots and images you upload</li>
                    <li>Habit tracking data</li>
                    <li>Custom tags and categories</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-xl font-semibold text-foreground mb-2">Usage Information</h3>
                  <p className="text-muted-foreground">
                    We automatically collect:
                  </p>
                  <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
                    <li>Device information (browser type, operating system)</li>
                    <li>IP address and general location</li>
                    <li>Usage patterns and feature interactions</li>
                    <li>Error logs and performance data</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-xl font-semibold text-foreground mb-2">Payment Information</h3>
                  <p className="text-muted-foreground">
                    Payment processing is handled by Stripe. We do not store your credit card information. We only store:
                  </p>
                  <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
                    <li>Stripe customer ID</li>
                    <li>Subscription status and tier</li>
                    <li>Billing history (dates and amounts)</li>
                  </ul>
                </div>
              </div>
            </section>

            {/* How We Use Your Information */}
            <section className="space-y-4">
              <h2 className="text-2xl font-bold text-foreground">2. How We Use Your Information</h2>
              
              <p className="text-muted-foreground">
                We use your information to:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                <li>Provide and maintain our trading journal service</li>
                <li>Process your transactions and manage subscriptions</li>
                <li>Generate AI-powered insights and coaching (Premium feature)</li>
                <li>Send important service updates and notifications</li>
                <li>Improve our application and develop new features</li>
                <li>Provide customer support</li>
                <li>Detect and prevent fraud or abuse</li>
                <li>Comply with legal obligations</li>
              </ul>
            </section>

            {/* AI and Data Processing */}
            <section className="space-y-4">
              <h2 className="text-2xl font-bold text-foreground">3. AI Features and Data Processing</h2>
              
              <p className="text-muted-foreground">
                For Premium users who use AI features:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                <li>Your trading data may be processed by OpenAI's GPT-4 to generate insights</li>
                <li>We send only the necessary context (trades, notes, habits) for each request</li>
                <li>OpenAI does not use your data to train their models (per our enterprise agreement)</li>
                <li>AI-generated insights are stored in your account for your reference</li>
              </ul>
            </section>

            {/* Data Storage and Security */}
            <section className="space-y-4">
              <h2 className="text-2xl font-bold text-foreground">4. Data Storage and Security</h2>
              
              <div className="space-y-4">
                <div>
                  <h3 className="text-xl font-semibold text-foreground mb-2">Where We Store Data</h3>
                  <p className="text-muted-foreground">
                    All data is stored securely using Google Cloud Platform (Firebase):
                  </p>
                  <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
                    <li>Primary data center: United States</li>
                    <li>Encrypted at rest and in transit (TLS/SSL)</li>
                    <li>Regular automated backups</li>
                    <li>Industry-standard security practices</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-xl font-semibold text-foreground mb-2">Security Measures</h3>
                  <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
                    <li>Password hashing with bcrypt</li>
                    <li>Two-factor authentication (optional)</li>
                    <li>Regular security audits</li>
                    <li>Firestore security rules to prevent unauthorized access</li>
                    <li>Rate limiting to prevent abuse</li>
                  </ul>
                </div>
              </div>
            </section>

            {/* Data Retention */}
            <section className="space-y-4">
              <h2 className="text-2xl font-bold text-foreground">5. Data Retention</h2>
              
              <div className="bg-muted/30 border border-border rounded-xl p-6 space-y-3">
                <div>
                  <h3 className="font-semibold text-foreground mb-1">Basic Plan</h3>
                  <p className="text-sm text-muted-foreground">
                    Data older than 90 days is automatically deleted. Export your data regularly to keep a backup.
                  </p>
                </div>
                
                <div>
                  <h3 className="font-semibold text-foreground mb-1">Premium Plan</h3>
                  <p className="text-sm text-muted-foreground">
                    Unlimited data retention. Your data is kept as long as your account is active.
                  </p>
                </div>
                
                <div>
                  <h3 className="font-semibold text-foreground mb-1">After Account Deletion</h3>
                  <p className="text-sm text-muted-foreground">
                    All personal data is permanently deleted within 30 days. Aggregated, anonymized analytics may be retained.
                  </p>
                </div>
              </div>
            </section>

            {/* Your Rights */}
            <section className="space-y-4">
              <h2 className="text-2xl font-bold text-foreground">6. Your Privacy Rights</h2>
              
              <p className="text-muted-foreground mb-4">
                You have the right to:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                <li><strong>Access:</strong> Request a copy of your data (Settings → Export Data)</li>
                <li><strong>Correction:</strong> Update your profile and trading data anytime</li>
                <li><strong>Deletion:</strong> Delete your account and all associated data</li>
                <li><strong>Portability:</strong> Export your data in JSON format</li>
                <li><strong>Opt-out:</strong> Unsubscribe from marketing emails (we rarely send them)</li>
                <li><strong>Object:</strong> Object to certain data processing activities</li>
              </ul>
              
              <p className="text-muted-foreground mt-4">
                To exercise these rights, contact us at <a href="mailto:privacy@refinejournal.com" className="text-primary hover:underline">privacy@refinejournal.com</a>
              </p>
            </section>

            {/* Third-Party Services */}
            <section className="space-y-4">
              <h2 className="text-2xl font-bold text-foreground">7. Third-Party Services</h2>
              
              <p className="text-muted-foreground mb-4">
                We use the following trusted third-party services:
              </p>
              
              <div className="space-y-3">
                <div className="p-4 bg-card border border-border rounded-lg">
                  <h3 className="font-semibold text-foreground mb-1">Firebase (Google Cloud)</h3>
                  <p className="text-sm text-muted-foreground">
                    Database, authentication, and file storage
                  </p>
                </div>
                
                <div className="p-4 bg-card border border-border rounded-lg">
                  <h3 className="font-semibold text-foreground mb-1">Stripe</h3>
                  <p className="text-sm text-muted-foreground">
                    Payment processing and subscription management
                  </p>
                </div>
                
                <div className="p-4 bg-card border border-border rounded-lg">
                  <h3 className="font-semibold text-foreground mb-1">OpenAI</h3>
                  <p className="text-sm text-muted-foreground">
                    AI-powered insights and coaching (Premium only)
                  </p>
                </div>
                
                <div className="p-4 bg-card border border-border rounded-lg">
                  <h3 className="font-semibold text-foreground mb-1">Vercel</h3>
                  <p className="text-sm text-muted-foreground">
                    Hosting and content delivery
                  </p>
                </div>
              </div>
            </section>

            {/* Cookies */}
            <section className="space-y-4">
              <h2 className="text-2xl font-bold text-foreground">8. Cookies and Tracking</h2>
              
              <p className="text-muted-foreground">
                We use essential cookies to:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
                <li>Keep you logged in</li>
                <li>Remember your preferences (theme, accent color)</li>
                <li>Maintain your session security</li>
              </ul>
              
              <p className="text-muted-foreground mt-4">
                We do not use advertising cookies or sell your data to third parties.
              </p>
            </section>

            {/* Children's Privacy */}
            <section className="space-y-4">
              <h2 className="text-2xl font-bold text-foreground">9. Children's Privacy</h2>
              
              <p className="text-muted-foreground">
                Refine is not intended for users under 18 years of age. We do not knowingly collect personal information from children. If you believe a child has provided us with personal information, please contact us immediately.
              </p>
            </section>

            {/* International Users */}
            <section className="space-y-4">
              <h2 className="text-2xl font-bold text-foreground">10. International Users</h2>
              
              <p className="text-muted-foreground">
                If you are accessing Refine from outside the United States, please be aware that your information may be transferred to, stored, and processed in the United States. By using our service, you consent to this transfer.
              </p>
            </section>

            {/* Changes to Privacy Policy */}
            <section className="space-y-4">
              <h2 className="text-2xl font-bold text-foreground">11. Changes to This Policy</h2>
              
              <p className="text-muted-foreground">
                We may update this Privacy Policy from time to time. We will notify you of any material changes by:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
                <li>Posting the new policy on this page</li>
                <li>Updating the "Last updated" date</li>
                <li>Sending you an email notification (for significant changes)</li>
              </ul>
            </section>

            {/* Contact */}
            <section className="space-y-4">
              <h2 className="text-2xl font-bold text-foreground">12. Contact Us</h2>
              
              <p className="text-muted-foreground mb-4">
                If you have questions about this Privacy Policy or our data practices, please contact us:
              </p>
              
              <div className="p-6 bg-card border border-border rounded-xl space-y-2">
                <p className="text-foreground">
                  <strong>Email:</strong> <a href="mailto:privacy@refinejournal.com" className="text-primary hover:underline">privacy@refinejournal.com</a>
                </p>
                <p className="text-foreground">
                  <strong>Support:</strong> <a href="mailto:support@refinejournal.com" className="text-primary hover:underline">support@refinejournal.com</a>
                </p>
                <p className="text-foreground">
                  <strong>Website:</strong> <a href="https://refinejournal.com" className="text-primary hover:underline">refinejournal.com</a>
                </p>
              </div>
            </section>

            {/* GDPR/CCPA Notice */}
            <section className="space-y-4">
              <h2 className="text-2xl font-bold text-foreground">13. GDPR & CCPA Compliance</h2>
              
              <div className="space-y-4">
                <div>
                  <h3 className="text-xl font-semibold text-foreground mb-2">For EU Users (GDPR)</h3>
                  <p className="text-muted-foreground">
                    Under GDPR, you have additional rights including the right to lodge a complaint with your local data protection authority. Our legal basis for processing your data is:
                  </p>
                  <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
                    <li>Contract performance (to provide our service)</li>
                    <li>Legitimate interests (to improve our service)</li>
                    <li>Consent (for optional features like AI coaching)</li>
                  </ul>
                </div>
                
                <div>
                  <h3 className="text-xl font-semibold text-foreground mb-2">For California Users (CCPA)</h3>
                  <p className="text-muted-foreground">
                    We do not sell your personal information. You have the right to:
                  </p>
                  <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
                    <li>Know what personal information we collect</li>
                    <li>Request deletion of your personal information</li>
                    <li>Opt-out of the sale of personal information (we don't sell data)</li>
                    <li>Non-discrimination for exercising your rights</li>
                  </ul>
                </div>
              </div>
            </section>
          </div>
        </motion.div>

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mt-12 pt-8 border-t border-border text-center text-sm text-muted-foreground"
        >
          <p>
            This Privacy Policy is effective as of {lastUpdated} and will remain in effect except with respect to any changes in its provisions in the future.
          </p>
        </motion.div>
      </div>
    </div>
  );
};

