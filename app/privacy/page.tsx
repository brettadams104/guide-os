import Link from 'next/link'

export const metadata = {
  title: 'Privacy Policy — GuideStride',
  description: 'Privacy Policy for GuideStride',
}

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[#0f1f35]">
      <div className="max-w-2xl mx-auto px-6 py-16">

        {/* Header */}
        <div className="mb-12">
          <Link href="/" className="text-sky-400 text-sm hover:text-sky-300 transition-colors">← GuideStride</Link>
          <h1 className="text-3xl font-black text-white mt-6">Privacy Policy</h1>
          <p className="text-slate-400 text-sm mt-2">Last updated: June 28, 2026</p>
        </div>

        <div className="space-y-10 text-slate-300 text-sm leading-relaxed">

          <section>
            <h2 className="text-white font-bold text-base mb-3">1. Who We Are</h2>
            <p>GuideStride is a trip management and business tool built for professional fishing guides. GuideStride is a product of <strong className="text-white">Ethical Edge Inc.</strong>, a registered corporation. If you have questions about this policy, contact us at <a href="mailto:contact@guidestride.com" className="text-sky-400 hover:text-sky-300">contact@guidestride.com</a>.</p>
          </section>

          <section>
            <h2 className="text-white font-bold text-base mb-3">2. Information We Collect</h2>
            <p className="mb-3">We collect the following information when you use GuideStride:</p>
            <ul className="list-disc pl-5 space-y-1.5">
              <li><strong className="text-white">Contact Information</strong> — your name, email address, phone number, and physical address</li>
              <li><strong className="text-white">Account information</strong> — password and user ID for authentication</li>
              <li><strong className="text-white">Financial Information</strong> — payment information, trip pricing, and payment records</li>
              <li><strong className="text-white">Trip data</strong> — trip dates, locations, notes, pricing, and payment records</li>
              <li><strong className="text-white">Client data</strong> — names, contact information, and trip history for clients you manage</li>
              <li><strong className="text-white">Catch data</strong> — fish species, counts, lures, and photos logged during trips</li>
              <li><strong className="text-white">Location</strong> — coarse location (city/region level) when you use weather or conditions features</li>
              <li><strong className="text-white">Usage data</strong> — information about how you interact with the app (launches, taps, feature usage)</li>
              <li><strong className="text-white">Diagnostic data</strong> — crash logs, performance data, and technical diagnostics</li>
            </ul>
          </section>

          <section>
            <h2 className="text-white font-bold text-base mb-3">3. How We Use Your Information</h2>
            <p className="mb-3"><strong className="text-white">App Functionality</strong> — We use your information to:</p>
            <ul className="list-disc pl-5 space-y-1.5 mb-3">
              <li>Authenticate your account and enable app features</li>
              <li>Provide trip management, client management, and payment tracking</li>
              <li>Show you your trip history, analytics, and financial summaries</li>
              <li>Prevent fraud and maintain security</li>
              <li>Respond to customer support and feedback requests</li>
              <li>Deliver transactional emails (account verification, password reset)</li>
            </ul>
            <p className="mb-3"><strong className="text-white">Analytics</strong> — We use usage and diagnostic data to:</p>
            <ul className="list-disc pl-5 space-y-1.5 mb-3">
              <li>Understand how you use the app and which features are most valuable</li>
              <li>Measure app performance, crash rates, and technical stability</li>
              <li>Plan new features and improvements based on user behavior</li>
            </ul>
            <p className="mb-3"><strong className="text-white">Developer Marketing</strong> — We may use your email address to:</p>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>Send you announcements about new features and product updates</li>
              <li>Share tips and best practices for using GuideStride</li>
            </ul>
            <p className="mt-3">We do not sell your data to third parties. We do not use your data for third-party advertising or share your data with data brokers.</p>
          </section>

          <section>
            <h2 className="text-white font-bold text-base mb-3">4. Data Storage and Security</h2>
            <p>Your data is stored securely using <strong className="text-white">Supabase</strong>, a managed database platform with row-level security and encrypted connections. Trip photos are stored in Supabase Storage. We use industry-standard security practices to protect your data, but no method of transmission over the internet is 100% secure.</p>
          </section>

          <section>
            <h2 className="text-white font-bold text-base mb-3">5. Third-Party Services</h2>
            <p className="mb-3">GuideStride uses the following third-party services to operate:</p>
            <ul className="list-disc pl-5 space-y-1.5">
              <li><strong className="text-white">Supabase</strong> — database, authentication, and file storage; stores your account data, trips, clients, and photos</li>
              <li><strong className="text-white">Vercel</strong> — app hosting, deployment, and analytics; collects crash logs and performance diagnostics</li>
              <li><strong className="text-white">Resend</strong> — email delivery for transactional and feature announcement emails</li>
              <li><strong className="text-white">Open-Meteo</strong> — weather forecast data (receives only your location query, no personal data)</li>
              <li><strong className="text-white">USGS Water Services</strong> — river flow data (receives only your location query, no personal data)</li>
            </ul>
            <p className="mt-3">Each third-party service has its own privacy policy. We recommend reviewing them to understand how they handle data.</p>
          </section>

          <section>
            <h2 className="text-white font-bold text-base mb-3">6. Client Data You Enter</h2>
            <p>When you add clients to GuideStride, you are responsible for ensuring you have the right to store and manage that information. We store it on your behalf and it is only accessible by your account. We do not contact your clients or use their information for any purpose outside of displaying it to you within the app.</p>
          </section>

          <section>
            <h2 className="text-white font-bold text-base mb-3">7. Data Retention</h2>
            <p>We retain your data as long as your account is active. If you delete your account, all associated data — including trips, clients, catches, photos, and financial records — is permanently deleted and cannot be recovered.</p>
          </section>

          <section>
            <h2 className="text-white font-bold text-base mb-3">8. Your Rights</h2>
            <p className="mb-3">You have the right to:</p>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>Access and export your data at any time</li>
              <li>Correct inaccurate information in your account settings</li>
              <li>Delete your account and all associated data</li>
              <li>Contact us with any privacy questions or concerns</li>
            </ul>
          </section>

          <section>
            <h2 className="text-white font-bold text-base mb-3">9. Children's Privacy</h2>
            <p>GuideStride is not directed at children under the age of 13. We do not knowingly collect personal information from children under 13.</p>
          </section>

          <section>
            <h2 className="text-white font-bold text-base mb-3">10. Changes to This Policy</h2>
            <p>We may update this privacy policy from time to time. When we do, we will update the date at the top of this page. Continued use of GuideStride after changes are posted constitutes your acceptance of the updated policy.</p>
          </section>

          <section>
            <h2 className="text-white font-bold text-base mb-3">11. Contact</h2>
            <p>If you have any questions about this privacy policy or how your data is handled, please contact us at <a href="mailto:contact@guidestride.com" className="text-sky-400 hover:text-sky-300">contact@guidestride.com</a>.</p>
          </section>

        </div>

        <div className="mt-16 pt-8 border-t border-white/10">
          <p className="text-slate-500 text-xs">© 2026 Ethical Edge Inc. All rights reserved. GuideStride is a product of Ethical Edge Inc.</p>
        </div>

      </div>
    </div>
  )
}
