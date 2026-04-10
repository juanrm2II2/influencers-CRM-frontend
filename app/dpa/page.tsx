import type { Metadata } from 'next';
import Footer from '@/components/Footer';

export const metadata: Metadata = {
  title: 'Data Processing Agreement – Influencer CRM',
  description: 'Data Processing Agreement template for Influencer CRM.',
};

export default function DpaPage() {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      <main className="flex-1 max-w-3xl mx-auto px-6 py-12">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Data Processing Agreement</h1>
        <p className="text-sm text-gray-500 mb-8">Last updated: April 10, 2026</p>

        <div className="prose prose-gray max-w-none space-y-6 text-gray-700 text-sm leading-relaxed">
          <section>
            <p className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-3 text-blue-800">
              This Data Processing Agreement (&quot;DPA&quot;) forms part of the agreement between
              the Customer (&quot;Data Controller&quot;) and Influencer CRM (&quot;Data Processor&quot;)
              for the provision of the Influencer CRM platform services.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">1. Definitions</h2>
            <ul className="list-disc pl-6 space-y-1 mt-2">
              <li><strong>&quot;Personal Data&quot;</strong> means any information relating to an identified or identifiable natural person.</li>
              <li><strong>&quot;Processing&quot;</strong> means any operation performed on Personal Data, including collection, storage, use, and deletion.</li>
              <li><strong>&quot;Data Controller&quot;</strong> means the Customer who determines the purposes and means of Processing.</li>
              <li><strong>&quot;Data Processor&quot;</strong> means Influencer CRM, which processes Personal Data on behalf of the Controller.</li>
              <li><strong>&quot;Sub-processor&quot;</strong> means any third party engaged by the Processor to process Personal Data.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">2. Scope of Processing</h2>
            <table className="w-full border-collapse border border-gray-200 mt-2 text-xs">
              <tbody>
                <tr>
                  <td className="border border-gray-200 px-3 py-2 bg-gray-50 font-medium">Subject Matter</td>
                  <td className="border border-gray-200 px-3 py-2">Provision of influencer relationship management services</td>
                </tr>
                <tr>
                  <td className="border border-gray-200 px-3 py-2 bg-gray-50 font-medium">Duration</td>
                  <td className="border border-gray-200 px-3 py-2">For the term of the service agreement plus 30 days for data deletion</td>
                </tr>
                <tr>
                  <td className="border border-gray-200 px-3 py-2 bg-gray-50 font-medium">Nature &amp; Purpose</td>
                  <td className="border border-gray-200 px-3 py-2">Storage, organization, and retrieval of influencer data for CRM purposes</td>
                </tr>
                <tr>
                  <td className="border border-gray-200 px-3 py-2 bg-gray-50 font-medium">Types of Data</td>
                  <td className="border border-gray-200 px-3 py-2">Names, social media handles, profile photos, engagement metrics, outreach records</td>
                </tr>
                <tr>
                  <td className="border border-gray-200 px-3 py-2 bg-gray-50 font-medium">Data Subjects</td>
                  <td className="border border-gray-200 px-3 py-2">Social media influencers, platform users (employees of the Controller)</td>
                </tr>
              </tbody>
            </table>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">3. Obligations of the Processor</h2>
            <p>The Processor shall:</p>
            <ul className="list-disc pl-6 space-y-1 mt-2">
              <li>Process Personal Data only on documented instructions from the Controller.</li>
              <li>Ensure that persons authorized to process Personal Data are bound by confidentiality obligations.</li>
              <li>Implement appropriate technical and organizational security measures.</li>
              <li>Not engage a Sub-processor without prior written authorization from the Controller.</li>
              <li>Assist the Controller in responding to data subject access requests.</li>
              <li>Delete or return all Personal Data upon termination of the service agreement.</li>
              <li>Make available all information necessary to demonstrate compliance and allow audits.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">4. Security Measures</h2>
            <p>The Processor implements the following security measures:</p>
            <ul className="list-disc pl-6 space-y-1 mt-2">
              <li>Encryption of data in transit using TLS 1.2+.</li>
              <li>Authentication via secure token-based system with httpOnly cookies.</li>
              <li>CSRF protection using the Double Submit Cookie pattern.</li>
              <li>Content Security Policy (CSP) headers to prevent XSS attacks.</li>
              <li>Role-based access controls (viewer, manager, admin).</li>
              <li>Input sanitization using DOMPurify.</li>
              <li>Regular security audits and vulnerability scanning.</li>
              <li>Rate limiting on sensitive endpoints.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">5. Data Breach Notification</h2>
            <p>
              The Processor shall notify the Controller without undue delay (and in any event within
              72 hours) after becoming aware of a Personal Data breach. The notification shall include:
            </p>
            <ul className="list-disc pl-6 space-y-1 mt-2">
              <li>The nature of the breach, including categories and approximate number of data subjects affected.</li>
              <li>The likely consequences of the breach.</li>
              <li>The measures taken or proposed to address the breach.</li>
              <li>Contact details of the Data Protection Officer.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">6. International Transfers</h2>
            <p>
              The Processor shall not transfer Personal Data outside the European Economic Area
              without appropriate safeguards in place, including:
            </p>
            <ul className="list-disc pl-6 space-y-1 mt-2">
              <li>Standard Contractual Clauses (SCCs) approved by the European Commission.</li>
              <li>Adequacy decisions by the European Commission.</li>
              <li>Binding Corporate Rules, where applicable.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">7. Sub-processors</h2>
            <p>
              The Controller provides general authorization for the Processor to engage Sub-processors,
              subject to the following conditions:
            </p>
            <ul className="list-disc pl-6 space-y-1 mt-2">
              <li>The Processor shall maintain an up-to-date list of Sub-processors.</li>
              <li>The Processor shall notify the Controller of any intended changes to Sub-processors.</li>
              <li>The Controller shall have the right to object to any new Sub-processor.</li>
              <li>Each Sub-processor shall be bound by equivalent data protection obligations.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">8. Audit Rights</h2>
            <p>
              The Controller has the right to conduct audits (or appoint a third-party auditor) to
              verify the Processor&apos;s compliance with this DPA. The Processor shall cooperate fully
              with any such audit, subject to reasonable notice and confidentiality obligations.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">9. Term and Termination</h2>
            <p>
              This DPA shall remain in effect for the duration of the service agreement. Upon
              termination, the Processor shall, at the Controller&apos;s choice, delete or return all
              Personal Data within 30 days and certify such deletion in writing.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">10. Contact</h2>
            <p>
              For questions about this DPA or to request a signed copy, contact us at{' '}
              <strong>legal@influencercrm.com</strong>.
            </p>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
}
