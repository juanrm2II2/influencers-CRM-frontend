import type { Metadata } from 'next';
import Footer from '@/components/Footer';

export const metadata: Metadata = {
  title: 'Cookie Policy – Influencer CRM',
  description: 'Learn how we use cookies and similar technologies.',
};

export default function CookiePolicyPage() {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      <main className="flex-1 max-w-3xl mx-auto px-6 py-12">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Cookie Policy</h1>
        <p className="text-sm text-gray-500 mb-8">Last updated: April 10, 2026</p>

        <div className="prose prose-gray max-w-none space-y-6 text-gray-700 text-sm leading-relaxed">
          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">1. What Are Cookies</h2>
            <p>
              Cookies are small text files stored on your device when you visit a website. They help
              the site remember your preferences and provide essential functionality.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">2. How We Use Cookies</h2>
            <p>Influencer CRM uses the following types of cookies:</p>

            <h3 className="text-base font-medium text-gray-900 mt-4 mb-2">Essential Cookies</h3>
            <p>
              These cookies are required for the platform to function properly. They include
              authentication cookies and CSRF protection tokens. You cannot opt out of these
              cookies as the Service would not function without them.
            </p>
            <table className="w-full border-collapse border border-gray-200 mt-2 text-xs">
              <thead>
                <tr className="bg-gray-50">
                  <th className="border border-gray-200 px-3 py-2 text-left">Cookie</th>
                  <th className="border border-gray-200 px-3 py-2 text-left">Purpose</th>
                  <th className="border border-gray-200 px-3 py-2 text-left">Duration</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border border-gray-200 px-3 py-2">crm_access_token</td>
                  <td className="border border-gray-200 px-3 py-2">Authentication</td>
                  <td className="border border-gray-200 px-3 py-2">Session</td>
                </tr>
                <tr>
                  <td className="border border-gray-200 px-3 py-2">XSRF-TOKEN</td>
                  <td className="border border-gray-200 px-3 py-2">CSRF protection</td>
                  <td className="border border-gray-200 px-3 py-2">Session</td>
                </tr>
                <tr>
                  <td className="border border-gray-200 px-3 py-2">cookie_consent</td>
                  <td className="border border-gray-200 px-3 py-2">Stores your cookie preferences</td>
                  <td className="border border-gray-200 px-3 py-2">365 days</td>
                </tr>
              </tbody>
            </table>

            <h3 className="text-base font-medium text-gray-900 mt-4 mb-2">Analytics Cookies</h3>
            <p>
              These cookies help us understand how visitors interact with the platform. They are only
              set with your explicit consent.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">3. Managing Cookies</h2>
            <p>
              You can manage your cookie preferences through the cookie consent banner that appears
              when you first visit the site. You can also manage cookies through your browser settings.
              Note that disabling essential cookies may prevent the platform from functioning properly.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">4. Third-Party Cookies</h2>
            <p>
              We do not use third-party advertising cookies. Any third-party cookies are limited to
              essential service providers and are governed by their respective privacy policies.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">5. Updates to This Policy</h2>
            <p>
              We may update this Cookie Policy from time to time. Changes will be posted on this page
              with an updated revision date.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">6. Contact</h2>
            <p>
              For questions about our use of cookies, contact us at{' '}
              <strong>privacy@influencercrm.com</strong>.
            </p>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
}
