import type { Metadata } from 'next';
import Footer from '@/components/Footer';

export const metadata: Metadata = {
  title: 'Privacy Policy – Influencer CRM',
  description: 'Our privacy policy explains how we collect, use, and protect your data.',
};

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      <main className="flex-1 max-w-3xl mx-auto px-6 py-12">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Privacy Policy</h1>
        <p className="text-sm text-gray-500 mb-8">Last updated: April 10, 2026</p>

        <div className="prose prose-gray max-w-none space-y-6 text-gray-700 text-sm leading-relaxed">
          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">1. Introduction</h2>
            <p>
              Influencer CRM (&quot;we,&quot; &quot;us,&quot; or &quot;our&quot;) is committed to protecting
              your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard
              your information when you use our influencer relationship management platform.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">2. Information We Collect</h2>
            <p>We collect the following categories of information:</p>
            <ul className="list-disc pl-6 space-y-1 mt-2">
              <li><strong>Account Information:</strong> Name, email address, and password when you register.</li>
              <li><strong>Influencer Data:</strong> Publicly available social media data including handles, follower counts, engagement metrics, profile pictures, and bios.</li>
              <li><strong>Outreach Records:</strong> Communication logs, contact dates, channels used, and messages.</li>
              <li><strong>Usage Data:</strong> Log data, device information, and analytics about how you use our platform.</li>
              <li><strong>Cookies:</strong> See our <a href="/cookie-policy" className="text-blue-600 hover:underline">Cookie Policy</a> for details.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">3. How We Use Your Information</h2>
            <p>We use collected information for the following purposes:</p>
            <ul className="list-disc pl-6 space-y-1 mt-2">
              <li>Providing, operating, and maintaining the platform.</li>
              <li>Managing influencer relationships and outreach campaigns.</li>
              <li>Authenticating users and enforcing access controls.</li>
              <li>Improving and personalizing user experience.</li>
              <li>Complying with legal obligations.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">4. Legal Basis for Processing (GDPR)</h2>
            <p>We process personal data under the following lawful bases:</p>
            <ul className="list-disc pl-6 space-y-1 mt-2">
              <li><strong>Contractual Necessity:</strong> To provide the services you have requested.</li>
              <li><strong>Legitimate Interest:</strong> To improve our platform and manage influencer relationships using publicly available data.</li>
              <li><strong>Consent:</strong> For cookies and marketing communications, where applicable.</li>
              <li><strong>Legal Obligation:</strong> To comply with applicable laws and regulations.</li>
            </ul>
            <p className="mt-2">
              See our <a href="/data-practices" className="text-blue-600 hover:underline">Data Practices</a> page
              for detailed documentation of lawful bases for processing influencer PII.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">5. Data Sharing and Disclosure</h2>
            <p>
              We do not sell your personal information. We may share data with service providers who
              assist in operating our platform, subject to contractual obligations to protect your data.
              We may also disclose information when required by law or to protect our rights.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">6. Your Rights</h2>
            <p>Depending on your jurisdiction, you may have the right to:</p>
            <ul className="list-disc pl-6 space-y-1 mt-2">
              <li>Access and receive a copy of your personal data.</li>
              <li>Rectify inaccurate personal data.</li>
              <li>Request deletion of your personal data.</li>
              <li>Restrict or object to processing.</li>
              <li>Data portability (export your data).</li>
              <li>Withdraw consent at any time.</li>
            </ul>
            <p className="mt-2">
              To exercise these rights, contact us at <strong>privacy@influencercrm.com</strong>.
            </p>
          </section>

          <section id="ccpa">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">7. California Privacy Rights (CCPA)</h2>
            <p>
              California residents have specific rights under the California Consumer Privacy Act (CCPA),
              including the right to know what personal information we collect, the right to delete it,
              and the right to opt-out of the sale of personal information.
            </p>
            <p className="mt-2">
              <strong>We do not sell personal information.</strong> If you wish to exercise your CCPA rights,
              contact us at <strong>privacy@influencercrm.com</strong>.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">8. Data Retention</h2>
            <p>
              We retain personal data only for as long as necessary to fulfill the purposes described
              in this policy or as required by law. You may request deletion of your data at any time.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">9. Security</h2>
            <p>
              We implement industry-standard security measures including encryption in transit (TLS),
              access controls, CSRF protection, Content Security Policy headers, and regular security audits.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">10. Contact Us</h2>
            <p>
              For questions about this Privacy Policy, contact us at{' '}
              <strong>privacy@influencercrm.com</strong>.
            </p>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
}
