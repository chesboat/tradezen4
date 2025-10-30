import React from 'react';
import { motion } from 'framer-motion';
import { FileText, ArrowLeft } from 'lucide-react';
import { useNavigationStore } from '@/store/useNavigationStore';

export const TermsOfService: React.FC = () => {
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
              <FileText className="w-8 h-8 text-primary" />
            </div>
            <div>
              <h1 className="text-4xl font-bold mb-2">Terms of Service</h1>
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
                Welcome to Refine. By accessing or using our trading journal application, you agree to be bound by these Terms of Service ("Terms"). Please read them carefully.
              </p>
            </section>

            {/* Agreement to Terms */}
            <section className="space-y-4">
              <h2 className="text-2xl font-bold text-foreground">1. Agreement to Terms</h2>
              
              <p className="text-muted-foreground">
                By creating an account or using Refine, you agree to:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                <li>These Terms of Service</li>
                <li>Our Privacy Policy</li>
                <li>All applicable laws and regulations</li>
              </ul>
              
              <p className="text-muted-foreground">
                If you do not agree with these Terms, you may not use our service.
              </p>
            </section>

            {/* Eligibility */}
            <section className="space-y-4">
              <h2 className="text-2xl font-bold text-foreground">2. Eligibility</h2>
              
              <p className="text-muted-foreground">
                To use Refine, you must:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                <li>Be at least 18 years old</li>
                <li>Have the legal capacity to enter into binding contracts</li>
                <li>Not be prohibited from using our service under applicable laws</li>
                <li>Provide accurate and complete registration information</li>
              </ul>
            </section>

            {/* Account Registration */}
            <section className="space-y-4">
              <h2 className="text-2xl font-bold text-foreground">3. Account Registration and Security</h2>
              
              <div className="space-y-4">
                <div>
                  <h3 className="text-xl font-semibold text-foreground mb-2">Account Creation</h3>
                  <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
                    <li>You must provide a valid email address</li>
                    <li>You are responsible for maintaining the confidentiality of your password</li>
                    <li>You must notify us immediately of any unauthorized access</li>
                    <li>One account per person (no account sharing)</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-xl font-semibold text-foreground mb-2">Account Termination</h3>
                  <p className="text-muted-foreground">
                    We reserve the right to suspend or terminate your account if you:
                  </p>
                  <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
                    <li>Violate these Terms</li>
                    <li>Engage in fraudulent or illegal activity</li>
                    <li>Abuse our service or other users</li>
                    <li>Fail to pay subscription fees</li>
                  </ul>
                </div>
              </div>
            </section>

            {/* Subscription and Billing */}
            <section className="space-y-4">
              <h2 className="text-2xl font-bold text-foreground">4. Subscription and Billing</h2>
              
              <div className="space-y-4">
                <div>
                  <h3 className="text-xl font-semibold text-foreground mb-2">Free Trial</h3>
                  <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
                    <li>New users receive a 7-day free trial with full Premium access</li>
                    <li>No credit card required to start trial</li>
                    <li>One trial per user (based on email address)</li>
                    <li>Trial ends automatically if no plan is selected</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-xl font-semibold text-foreground mb-2">Paid Subscriptions</h3>
                  <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
                    <li>Subscriptions are billed monthly or annually</li>
                    <li>Billing occurs on the same day each period</li>
                    <li>All fees are in USD unless otherwise stated</li>
                    <li>Prices are subject to change with 30 days notice</li>
                    <li>Payment is processed securely through Stripe</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-xl font-semibold text-foreground mb-2">Refund Policy</h3>
                  <div className="p-4 bg-muted/30 border border-border rounded-lg">
                    <p className="text-muted-foreground mb-2">
                      <strong className="text-foreground">30-Day Money-Back Guarantee:</strong>
                    </p>
                    <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
                      <li>Full refund if requested within 30 days of first payment</li>
                      <li>Contact support@refinejournal.com to request a refund</li>
                      <li>Refunds processed within 5-10 business days</li>
                      <li>After 30 days, no refunds for partial subscription periods</li>
                    </ul>
                  </div>
                </div>

                <div>
                  <h3 className="text-xl font-semibold text-foreground mb-2">Cancellation</h3>
                  <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
                    <li>Cancel anytime through Settings → Manage Subscription</li>
                    <li>Access continues until the end of your billing period</li>
                    <li>No partial refunds for mid-period cancellations</li>
                    <li>You can reactivate your subscription anytime</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-xl font-semibold text-foreground mb-2">Downgrades</h3>
                  <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
                    <li>Downgrade from Premium to Basic anytime</li>
                    <li>Changes take effect at the end of your current billing period</li>
                    <li>Premium features remain accessible until downgrade is effective</li>
                    <li>Data beyond Basic plan limits will be archived (not deleted)</li>
                  </ul>
                </div>
              </div>
            </section>

            {/* Data Retention */}
            <section className="space-y-4">
              <h2 className="text-2xl font-bold text-foreground">5. Data Retention and Ownership</h2>
              
              <div className="space-y-4">
                <div>
                  <h3 className="text-xl font-semibold text-foreground mb-2">Your Data Ownership</h3>
                  <p className="text-muted-foreground">
                    You retain all rights to your trading data, notes, and content. We do not claim ownership of your data.
                  </p>
                </div>

                <div>
                  <h3 className="text-xl font-semibold text-foreground mb-2">Data Retention by Plan</h3>
                  <div className="space-y-3">
                    <div className="p-4 bg-card border border-border rounded-lg">
                      <h4 className="font-semibold text-foreground mb-1">Basic Plan</h4>
                      <p className="text-sm text-muted-foreground">
                        Data older than 90 days is automatically deleted. Export regularly to keep backups.
                      </p>
                    </div>
                    
                    <div className="p-4 bg-card border border-border rounded-lg">
                      <h4 className="font-semibold text-foreground mb-1">Premium Plan</h4>
                      <p className="text-sm text-muted-foreground">
                        Unlimited data retention. All your data is preserved as long as your account is active.
                      </p>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-xl font-semibold text-foreground mb-2">Data Export</h3>
                  <p className="text-muted-foreground">
                    You can export your data anytime in JSON format through Settings → Export Data.
                  </p>
                </div>

                <div>
                  <h3 className="text-xl font-semibold text-foreground mb-2">Account Deletion</h3>
                  <p className="text-muted-foreground">
                    If you delete your account:
                  </p>
                  <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
                    <li>All personal data is permanently deleted within 30 days</li>
                    <li>This action cannot be undone</li>
                    <li>Export your data before deletion if you want to keep it</li>
                    <li>Anonymized analytics may be retained for business purposes</li>
                  </ul>
                </div>
              </div>
            </section>

            {/* Acceptable Use */}
            <section className="space-y-4">
              <h2 className="text-2xl font-bold text-foreground">6. Acceptable Use Policy</h2>
              
              <p className="text-muted-foreground mb-4">
                You agree NOT to:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                <li>Use the service for any illegal purpose</li>
                <li>Attempt to gain unauthorized access to our systems</li>
                <li>Reverse engineer, decompile, or disassemble our software</li>
                <li>Share your account credentials with others</li>
                <li>Upload malicious code, viruses, or harmful content</li>
                <li>Scrape or harvest data from our service</li>
                <li>Abuse our AI features or attempt to bypass rate limits</li>
                <li>Impersonate others or misrepresent your identity</li>
                <li>Harass, abuse, or harm other users</li>
                <li>Use the service to spam or send unsolicited messages</li>
              </ul>
            </section>

            {/* Intellectual Property */}
            <section className="space-y-4">
              <h2 className="text-2xl font-bold text-foreground">7. Intellectual Property</h2>
              
              <div className="space-y-4">
                <div>
                  <h3 className="text-xl font-semibold text-foreground mb-2">Our Rights</h3>
                  <p className="text-muted-foreground">
                    Refine, including all software, designs, logos, and content (excluding your data), is owned by us and protected by copyright, trademark, and other intellectual property laws.
                  </p>
                </div>

                <div>
                  <h3 className="text-xl font-semibold text-foreground mb-2">License to Use</h3>
                  <p className="text-muted-foreground">
                    We grant you a limited, non-exclusive, non-transferable license to use Refine for your personal trading journal purposes, subject to these Terms.
                  </p>
                </div>

                <div>
                  <h3 className="text-xl font-semibold text-foreground mb-2">Your Content</h3>
                  <p className="text-muted-foreground">
                    By uploading content (trades, notes, images), you grant us a license to:
                  </p>
                  <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
                    <li>Store and display your content to you</li>
                    <li>Process your data to provide AI insights (if you use Premium features)</li>
                    <li>Create anonymized, aggregated analytics</li>
                  </ul>
                  <p className="text-muted-foreground mt-2">
                    We will never share your personal trading data with third parties without your explicit consent.
                  </p>
                </div>
              </div>
            </section>

            {/* AI Features */}
            <section className="space-y-4">
              <h2 className="text-2xl font-bold text-foreground">8. AI-Powered Features</h2>
              
              <div className="space-y-4">
                <div>
                  <h3 className="text-xl font-semibold text-foreground mb-2">AI Coach and Insights</h3>
                  <p className="text-muted-foreground">
                    Premium users have access to AI-powered coaching and insights. You acknowledge that:
                  </p>
                  <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                    <li>AI-generated content is for informational purposes only</li>
                    <li>AI insights are not financial advice</li>
                    <li>You should not rely solely on AI recommendations for trading decisions</li>
                    <li>AI may occasionally produce inaccurate or incomplete information</li>
                    <li>We are not responsible for trading losses based on AI suggestions</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-xl font-semibold text-foreground mb-2">Usage Limits</h3>
                  <p className="text-muted-foreground">
                    To ensure fair use and manage costs:
                  </p>
                  <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
                    <li>Basic plan: No AI features</li>
                    <li>Premium plan: Unlimited AI requests (subject to fair use)</li>
                    <li>We may implement rate limits to prevent abuse</li>
                  </ul>
                </div>
              </div>
            </section>

            {/* Disclaimers */}
            <section className="space-y-4">
              <h2 className="text-2xl font-bold text-foreground">9. Disclaimers and Limitations</h2>
              
              <div className="p-6 bg-orange-500/10 border border-orange-500/20 rounded-xl space-y-4">
                <div>
                  <h3 className="text-xl font-semibold text-foreground mb-2">Not Financial Advice</h3>
                  <p className="text-muted-foreground">
                    Refine is a journaling and analytics tool. We do not provide financial, investment, or trading advice. All trading decisions are your own responsibility.
                  </p>
                </div>

                <div>
                  <h3 className="text-xl font-semibold text-foreground mb-2">No Guarantees</h3>
                  <p className="text-muted-foreground">
                    We do not guarantee that using Refine will improve your trading performance or profitability. Past performance does not indicate future results.
                  </p>
                </div>

                <div>
                  <h3 className="text-xl font-semibold text-foreground mb-2">Service "As Is"</h3>
                  <p className="text-muted-foreground">
                    Refine is provided "as is" without warranties of any kind, express or implied. We do not warrant that:
                  </p>
                  <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
                    <li>The service will be uninterrupted or error-free</li>
                    <li>Defects will be corrected immediately</li>
                    <li>The service is free from viruses or harmful components</li>
                  </ul>
                </div>
              </div>
            </section>

            {/* Limitation of Liability */}
            <section className="space-y-4">
              <h2 className="text-2xl font-bold text-foreground">10. Limitation of Liability</h2>
              
              <p className="text-muted-foreground">
                To the maximum extent permitted by law:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                <li>We are not liable for any indirect, incidental, special, or consequential damages</li>
                <li>Our total liability shall not exceed the amount you paid us in the past 12 months</li>
                <li>We are not liable for trading losses, data loss, or lost profits</li>
                <li>We are not responsible for third-party services (Stripe, OpenAI, etc.)</li>
              </ul>
            </section>

            {/* Indemnification */}
            <section className="space-y-4">
              <h2 className="text-2xl font-bold text-foreground">11. Indemnification</h2>
              
              <p className="text-muted-foreground">
                You agree to indemnify and hold harmless Refine, its officers, directors, employees, and agents from any claims, damages, losses, or expenses (including legal fees) arising from:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
                <li>Your use of the service</li>
                <li>Your violation of these Terms</li>
                <li>Your violation of any rights of another party</li>
                <li>Your trading activities or decisions</li>
              </ul>
            </section>

            {/* Changes to Service */}
            <section className="space-y-4">
              <h2 className="text-2xl font-bold text-foreground">12. Changes to Service and Terms</h2>
              
              <div className="space-y-4">
                <div>
                  <h3 className="text-xl font-semibold text-foreground mb-2">Service Changes</h3>
                  <p className="text-muted-foreground">
                    We reserve the right to:
                  </p>
                  <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
                    <li>Modify or discontinue features</li>
                    <li>Change pricing with 30 days notice</li>
                    <li>Perform maintenance and updates</li>
                    <li>Suspend the service temporarily for technical reasons</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-xl font-semibold text-foreground mb-2">Terms Changes</h3>
                  <p className="text-muted-foreground">
                    We may update these Terms from time to time. Material changes will be communicated via:
                  </p>
                  <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
                    <li>Email notification</li>
                    <li>In-app notification</li>
                    <li>Updated "Last modified" date</li>
                  </ul>
                  <p className="text-muted-foreground mt-2">
                    Continued use after changes constitutes acceptance of the new Terms.
                  </p>
                </div>
              </div>
            </section>

            {/* Governing Law */}
            <section className="space-y-4">
              <h2 className="text-2xl font-bold text-foreground">13. Governing Law and Disputes</h2>
              
              <div className="space-y-4">
                <div>
                  <h3 className="text-xl font-semibold text-foreground mb-2">Governing Law</h3>
                  <p className="text-muted-foreground">
                    These Terms are governed by the laws of the State of Delaware, United States, without regard to conflict of law principles.
                  </p>
                </div>

                <div>
                  <h3 className="text-xl font-semibold text-foreground mb-2">Dispute Resolution</h3>
                  <p className="text-muted-foreground">
                    Before filing a claim, you agree to contact us at support@refinejournal.com to attempt to resolve the dispute informally.
                  </p>
                </div>

                <div>
                  <h3 className="text-xl font-semibold text-foreground mb-2">Arbitration</h3>
                  <p className="text-muted-foreground">
                    Any disputes that cannot be resolved informally shall be resolved through binding arbitration in accordance with the American Arbitration Association rules.
                  </p>
                </div>
              </div>
            </section>

            {/* Miscellaneous */}
            <section className="space-y-4">
              <h2 className="text-2xl font-bold text-foreground">14. Miscellaneous</h2>
              
              <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                <li><strong>Entire Agreement:</strong> These Terms constitute the entire agreement between you and Refine</li>
                <li><strong>Severability:</strong> If any provision is found invalid, the remaining provisions remain in effect</li>
                <li><strong>No Waiver:</strong> Our failure to enforce any right does not waive that right</li>
                <li><strong>Assignment:</strong> You may not assign these Terms; we may assign them to a successor</li>
                <li><strong>Force Majeure:</strong> We are not liable for delays due to circumstances beyond our control</li>
              </ul>
            </section>

            {/* Contact */}
            <section className="space-y-4">
              <h2 className="text-2xl font-bold text-foreground">15. Contact Information</h2>
              
              <p className="text-muted-foreground mb-4">
                Questions about these Terms? Contact us:
              </p>
              
              <div className="p-6 bg-card border border-border rounded-xl space-y-2">
                <p className="text-foreground">
                  <strong>Email:</strong> <a href="mailto:legal@refinejournal.com" className="text-primary hover:underline">legal@refinejournal.com</a>
                </p>
                <p className="text-foreground">
                  <strong>Support:</strong> <a href="mailto:support@refinejournal.com" className="text-primary hover:underline">support@refinejournal.com</a>
                </p>
                <p className="text-foreground">
                  <strong>Website:</strong> <a href="https://refinejournal.com" className="text-primary hover:underline">refinejournal.com</a>
                </p>
              </div>
            </section>
          </div>
        </motion.div>

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mt-12 pt-8 border-t border-border text-center space-y-4"
        >
          <p className="text-sm text-muted-foreground">
            By using Refine, you acknowledge that you have read, understood, and agree to be bound by these Terms of Service.
          </p>
          <p className="text-sm text-muted-foreground">
            Effective Date: {lastUpdated}
          </p>
        </motion.div>
      </div>
    </div>
  );
};

