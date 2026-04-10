import type { Metadata } from 'next';
import Footer from '@/components/Footer';

export const metadata: Metadata = {
  title: 'Terms of Service – Influencer CRM',
  description: 'Terms and conditions for using Influencer CRM.',
};

export default function TermsPage() {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      <main className="flex-1 max-w-3xl mx-auto px-6 py-12">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Terms of Service</h1>
        <p className="text-sm text-gray-500 mb-8">Last updated: April 10, 2026</p>

        <div className="prose prose-gray max-w-none space-y-6 text-gray-700 text-sm leading-relaxed">
          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">1. Acceptance of Terms</h2>
            <p>
              By accessing or using Influencer CRM (&quot;the Service&quot;), you agree to be bound by
              these Terms of Service. If you do not agree to these terms, do not use the Service.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">2. Description of Service</h2>
            <p>
              Influencer CRM is a platform for managing influencer relationships, tracking outreach
              campaigns, and analyzing social media metrics. The Service aggregates publicly available
              social media data to help users manage their influencer partnerships.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">3. User Accounts</h2>
            <ul className="list-disc pl-6 space-y-1 mt-2">
              <li>You must provide accurate and complete registration information.</li>
              <li>You are responsible for maintaining the security of your account credentials.</li>
              <li>You must notify us immediately of any unauthorized access to your account.</li>
              <li>You may not share your account with others or allow multiple users per account.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">4. Acceptable Use</h2>
            <p>You agree not to:</p>
            <ul className="list-disc pl-6 space-y-1 mt-2">
              <li>Use the Service for any unlawful purpose.</li>
              <li>Harass, stalk, or intimidate any influencer or user.</li>
              <li>Scrape or collect data beyond what the platform provides.</li>
              <li>Attempt to gain unauthorized access to other accounts or systems.</li>
              <li>Use the Service to send unsolicited communications (spam).</li>
              <li>Violate any applicable social media platform&apos;s terms of service.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">5. Intellectual Property</h2>
            <p>
              The Service, including its design, features, and content, is owned by Influencer CRM
              and protected by intellectual property laws. Your data remains your property, and you
              grant us a limited license to use it only for providing the Service.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">6. Data and Privacy</h2>
            <p>
              Your use of the Service is also governed by our{' '}
              <a href="/privacy" className="text-blue-600 hover:underline">Privacy Policy</a>.
              You acknowledge that influencer data collected by the Service is sourced from
              publicly available social media profiles.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">7. Disclaimers</h2>
            <p>
              The Service is provided &quot;as is&quot; and &quot;as available&quot; without warranties
              of any kind. We do not guarantee the accuracy, completeness, or reliability of any
              influencer data or metrics displayed on the platform.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">8. Limitation of Liability</h2>
            <p>
              To the maximum extent permitted by law, Influencer CRM shall not be liable for any
              indirect, incidental, special, consequential, or punitive damages arising out of or
              related to your use of the Service.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">9. Termination</h2>
            <p>
              We may suspend or terminate your access to the Service at any time for violation of
              these terms. You may terminate your account at any time by contacting us. Upon
              termination, you may request export of your data.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">10. Changes to Terms</h2>
            <p>
              We may update these terms from time to time. We will notify you of material changes
              via email or through the Service. Continued use after changes constitutes acceptance
              of the updated terms.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">11. Contact</h2>
            <p>
              For questions about these Terms of Service, contact us at{' '}
              <strong>legal@influencercrm.com</strong>.
            </p>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
}
