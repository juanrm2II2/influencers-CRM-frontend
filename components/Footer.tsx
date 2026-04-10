import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="bg-gray-100 border-t border-gray-200">
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-sm">
          <div>
            <h3 className="font-semibold text-gray-900 mb-3">Influencer CRM</h3>
            <p className="text-gray-500">
              Manage your influencer partnerships with confidence.
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-gray-900 mb-3">Legal</h3>
            <ul className="space-y-2 text-gray-600">
              <li>
                <Link href="/privacy" className="hover:text-blue-600 transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="hover:text-blue-600 transition-colors">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link href="/cookie-policy" className="hover:text-blue-600 transition-colors">
                  Cookie Policy
                </Link>
              </li>
              <li>
                <Link href="/dpa" className="hover:text-blue-600 transition-colors">
                  Data Processing Agreement
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-gray-900 mb-3">Data &amp; Privacy</h3>
            <ul className="space-y-2 text-gray-600">
              <li>
                <Link href="/data-practices" className="hover:text-blue-600 transition-colors">
                  Data Practices
                </Link>
              </li>
              <li>
                <Link
                  href="/privacy#ccpa"
                  className="hover:text-blue-600 transition-colors"
                  data-testid="ccpa-link"
                >
                  Do Not Sell My Personal Information
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-gray-200 text-center text-xs text-gray-400">
          &copy; {new Date().getFullYear()} Influencer CRM. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
