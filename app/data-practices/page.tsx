import type { Metadata } from 'next';
import Footer from '@/components/Footer';

export const metadata: Metadata = {
  title: 'Data Practices – Influencer CRM',
  description: 'Documentation of lawful bases for processing influencer personal data.',
};

export default function DataPracticesPage() {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      <main className="flex-1 max-w-3xl mx-auto px-6 py-12">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Data Practices</h1>
        <p className="text-sm text-gray-500 mb-2">
          Lawful Basis for Processing Influencer Personal Information
        </p>
        <p className="text-sm text-gray-500 mb-8">Last updated: April 10, 2026</p>

        <div className="prose prose-gray max-w-none space-y-6 text-gray-700 text-sm leading-relaxed">
          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">1. Overview</h2>
            <p>
              Influencer CRM processes personally identifiable information (PII) of social media
              influencers to facilitate relationship management between brands and creators. This
              document outlines the lawful bases under which we process this data, in compliance
              with GDPR (Article 6), CCPA, and other applicable privacy regulations.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">2. Categories of Influencer PII Processed</h2>
            <table className="w-full border-collapse border border-gray-200 mt-2 text-xs">
              <thead>
                <tr className="bg-gray-50">
                  <th className="border border-gray-200 px-3 py-2 text-left">Data Category</th>
                  <th className="border border-gray-200 px-3 py-2 text-left">Examples</th>
                  <th className="border border-gray-200 px-3 py-2 text-left">Source</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border border-gray-200 px-3 py-2">Public Profile Data</td>
                  <td className="border border-gray-200 px-3 py-2">Handle, display name, bio, profile photo URL</td>
                  <td className="border border-gray-200 px-3 py-2">Publicly available social media profiles</td>
                </tr>
                <tr>
                  <td className="border border-gray-200 px-3 py-2">Engagement Metrics</td>
                  <td className="border border-gray-200 px-3 py-2">Follower count, engagement rate, average likes/views</td>
                  <td className="border border-gray-200 px-3 py-2">Publicly available social media data</td>
                </tr>
                <tr>
                  <td className="border border-gray-200 px-3 py-2">Contact Records</td>
                  <td className="border border-gray-200 px-3 py-2">Outreach dates, communication channel, messages</td>
                  <td className="border border-gray-200 px-3 py-2">User-generated within the platform</td>
                </tr>
                <tr>
                  <td className="border border-gray-200 px-3 py-2">Classification Data</td>
                  <td className="border border-gray-200 px-3 py-2">Niche, partnership status, notes</td>
                  <td className="border border-gray-200 px-3 py-2">User-generated within the platform</td>
                </tr>
              </tbody>
            </table>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">3. Lawful Bases for Processing</h2>

            <h3 className="text-base font-medium text-gray-900 mt-4 mb-2">
              3.1 Legitimate Interest (GDPR Article 6(1)(f))
            </h3>
            <p>
              <strong>Applicable to:</strong> Public Profile Data, Engagement Metrics
            </p>
            <p className="mt-2">
              We rely on legitimate interest for processing publicly available influencer data.
              Our legitimate interest assessment concludes:
            </p>
            <ul className="list-disc pl-6 space-y-1 mt-2">
              <li>
                <strong>Purpose:</strong> Enabling brands to identify, evaluate, and manage partnerships
                with social media influencers using data the influencers have chosen to make public.
              </li>
              <li>
                <strong>Necessity:</strong> Processing this data is necessary for the core function of the
                CRM platform. Without it, the service cannot operate.
              </li>
              <li>
                <strong>Balancing test:</strong> The data is already publicly available and published
                voluntarily by the influencers. Processing does not create additional privacy risk
                beyond what already exists. We do not process sensitive categories of data.
              </li>
              <li>
                <strong>Safeguards:</strong> Data is only accessible to authenticated users, protected by
                role-based access controls, and can be deleted upon request.
              </li>
            </ul>

            <h3 className="text-base font-medium text-gray-900 mt-4 mb-2">
              3.2 Contractual Necessity (GDPR Article 6(1)(b))
            </h3>
            <p>
              <strong>Applicable to:</strong> Contact Records, Classification Data
            </p>
            <p className="mt-2">
              Processing of outreach records and classification data is necessary for the performance
              of the contract between us and our users (brands/agencies), who use the platform to
              manage their influencer partnerships.
            </p>

            <h3 className="text-base font-medium text-gray-900 mt-4 mb-2">
              3.3 Consent (GDPR Article 6(1)(a))
            </h3>
            <p>
              <strong>Applicable to:</strong> Cookies (non-essential), Marketing communications
            </p>
            <p className="mt-2">
              Where required, we obtain explicit consent before setting non-essential cookies or
              sending marketing communications. Consent can be withdrawn at any time.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">4. Data Subject Rights</h2>
            <p>
              Influencers whose data appears in the platform may exercise the following rights:
            </p>
            <ul className="list-disc pl-6 space-y-1 mt-2">
              <li><strong>Right of Access:</strong> Request a copy of their personal data.</li>
              <li><strong>Right to Rectification:</strong> Request correction of inaccurate data.</li>
              <li><strong>Right to Erasure:</strong> Request deletion of their data from the platform.</li>
              <li><strong>Right to Object:</strong> Object to processing based on legitimate interest.</li>
              <li><strong>Right to Restriction:</strong> Request restriction of processing.</li>
            </ul>
            <p className="mt-2">
              Requests should be sent to <strong>privacy@influencercrm.com</strong>. We will respond
              within 30 days.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">5. Data Retention</h2>
            <p>
              Influencer public profile data is refreshed periodically and retained for the duration
              of the user&apos;s subscription. Upon account termination, all associated influencer data
              is deleted within 30 days unless a longer retention period is required by law.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">6. International Transfers</h2>
            <p>
              If personal data is transferred outside the European Economic Area (EEA), we ensure
              appropriate safeguards are in place, such as Standard Contractual Clauses (SCCs) or
              adequacy decisions. See our{' '}
              <a href="/dpa" className="text-blue-600 hover:underline">Data Processing Agreement</a>{' '}
              for details.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">7. Contact</h2>
            <p>
              For questions about our data processing practices, contact our Data Protection Officer at{' '}
              <strong>dpo@influencercrm.com</strong>.
            </p>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
}
